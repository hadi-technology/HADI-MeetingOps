# HADI MCP Infrastructure — Setup Spec & Current Status

> Last updated: April 2026  
> Author: HADI Technology

---

## Overview

This document describes the full architecture of the HADI remote MCP server infrastructure, how to configure a remote MCP server that works with Claude, and documents the current known issue with Claude.ai web connectors.

---

## Architecture

```
Claude Code / Claude Desktop
        │
        │  HTTP POST  (Bearer: Zoom User ID)
        ▼
mcp.haditechnology.com/meetingops   ← Cloudflare Worker (hadi-mcp)
        │
        │  KV lookup: tokens:{userId}
        ▼
Cloudflare KV (ZOOM_TOKENS namespace)
        │
        │  access_token (auto-refreshed if expired)
        ▼
api.zoom.us/v2   ← Zoom API (recordings, transcripts, summaries)


Browser (user)
        │
        │  GET /zoom/authorize
        ▼
auth.haditechnology.com   ← Cloudflare Worker (hadi-auth)
        │
        │  Zoom OAuth (authorization_code grant)
        ▼
zoom.us/oauth/authorize
        │
        │  callback with code
        ▼
auth.haditechnology.com/zoom/callback
        │  exchanges code → stores tokens in KV
        │  displays Zoom User ID to user
```

---

## Workers

### 1. hadi-auth (`auth.haditechnology.com`)

Handles Zoom OAuth for end users. Used when authorizing via the npm local package.

| Route | Method | Description |
|-------|--------|-------------|
| `/zoom/authorize` | GET | Redirects user to Zoom OAuth consent screen |
| `/zoom/callback` | GET | Exchanges code for tokens, stores in KV, shows User ID |
| `/zoom/token` | POST | Returns valid access token for a given `user_id` (refreshes if needed) |

**Env vars:**
- `ZOOM_CLIENT_ID` — in `wrangler.toml`
- `ZOOM_CLIENT_SECRET` — Cloudflare secret (`wrangler secret put ZOOM_CLIENT_SECRET`)

**KV:** `ZOOM_TOKENS` namespace (id: `58ed9ac316a247b8b42aa3cc08bebfee`)

---

### 2. hadi-mcp (`mcp.haditechnology.com`)

Remote MCP server. Implements the full MCP JSON-RPC protocol over HTTP, plus OAuth 2.1 endpoints for Claude.ai connector support.

**Env vars:**
- `ZOOM_CLIENT_ID` — in `wrangler.toml`
- `ZOOM_CLIENT_SECRET` — Cloudflare secret
- `ZOOM_TOKENS` — shared KV namespace (same as hadi-auth)

---

## MCP Endpoint Map

All routes live under `mcp.haditechnology.com`:

| Route | Method | Auth Required | Description |
|-------|--------|---------------|-------------|
| `/meetingops` | POST | No (initialize only) | MCP JSON-RPC endpoint |
| `/meetingops` | GET | No | SSE handshake (legacy clients) |
| `/meetingops/authorize` | GET | No | OAuth: redirect to Zoom |
| `/meetingops/callback` | GET | No | OAuth: exchange Zoom code, redirect to Claude.ai |
| `/meetingops/token` | POST | No | OAuth: exchange auth code for bearer token |
| `/meetingops/register` | POST | No | RFC 7591 Dynamic Client Registration |
| `/.well-known/oauth-protected-resource` | GET | No | RFC 9728 PRM document |
| `/.well-known/oauth-authorization-server` | GET | No | RFC 8414 AS metadata |
| `/health` | GET | No | Health check |

---

## Authentication Flow

### For Claude Code / Claude Desktop (local npm package)

1. User visits `https://auth.haditechnology.com/zoom/authorize`
2. Authorizes with Zoom account
3. Page displays their **Zoom User ID**
4. User adds it to MCP config as `ZOOM_USER_ID` env var
5. On each request, the local npm package calls `POST /zoom/token` on hadi-auth to get a valid access token
6. Token is used directly against Zoom API

Config example (`claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "hadi-meetingops": {
      "command": "npx",
      "args": ["-y", "hadi-meetingops"],
      "env": {
        "ZOOM_USER_ID": "YOUR_ZOOM_USER_ID",
        "ZOOM_AUTH_URL": "https://auth.haditechnology.com"
      }
    }
  }
}
```

### For Claude Code (remote HTTP transport)

```bash
claude mcp add --transport http hadi-meetingops https://mcp.haditechnology.com/meetingops
```

Bearer token = Zoom User ID. The MCP worker looks up `tokens:{userId}` in KV and auto-refreshes if expired.

### For Claude.ai Web (custom connector) — OAuth 2.1 flow

Claude.ai implements RFC 9728 / OAuth 2.1 / PKCE. The full flow:

1. Claude.ai hits `GET /meetingops` → receives `401` with:
   ```
   WWW-Authenticate: Bearer realm="HADI MeetingOps",
     resource_metadata="https://mcp.haditechnology.com/.well-known/oauth-protected-resource"
   ```

2. Claude.ai fetches `/.well-known/oauth-protected-resource`:
   ```json
   {
     "resource": "https://mcp.haditechnology.com/meetingops",
     "authorization_servers": ["https://mcp.haditechnology.com"],
     "scopes_supported": ["mcp"],
     "bearer_methods_supported": ["header"]
   }
   ```

3. Claude.ai fetches `/.well-known/oauth-authorization-server`:
   ```json
   {
     "issuer": "https://mcp.haditechnology.com",
     "authorization_endpoint": "https://mcp.haditechnology.com/meetingops/authorize",
     "token_endpoint": "https://mcp.haditechnology.com/meetingops/token",
     "registration_endpoint": "https://mcp.haditechnology.com/meetingops/register",
     "response_types_supported": ["code"],
     "grant_types_supported": ["authorization_code"],
     "code_challenge_methods_supported": ["S256"]
   }
   ```

4. Claude.ai registers itself via `POST /meetingops/register` (RFC 7591 DCR):
   ```json
   { "client_id": "claude-ai", "redirect_uris": ["https://claude.ai/api/mcp/auth_callback"], ... }
   ```

5. Claude.ai redirects user's browser to `/meetingops/authorize?response_type=code&client_id=claude-ai&redirect_uri=https://claude.ai/api/mcp/auth_callback&code_challenge=...&code_challenge_method=S256&state=...`

6. Our worker redirects to Zoom OAuth: `https://zoom.us/oauth/authorize?client_id=P5WLcOYjRhi_2HCj9u6foA&redirect_uri=https://mcp.haditechnology.com/meetingops/callback&state={encodedClaudeParams}`

7. User authorizes on Zoom → Zoom redirects to `/meetingops/callback?code=...&state=...`

8. Our callback:
   - Exchanges Zoom code for Zoom tokens
   - Stores tokens in KV under `tokens:{userId}`
   - Issues our own short-lived auth code (stored in KV with 5 min TTL)
   - Redirects to `https://claude.ai/api/mcp/auth_callback?code={ourCode}&state={claudeState}`

9. Claude.ai POSTs to `/meetingops/token` with `code`, `code_verifier`, `client_id`, `redirect_uri`

10. Our token endpoint:
    - Retrieves auth code entry from KV
    - Verifies PKCE `code_verifier` against stored `code_challenge` (SHA-256)
    - Returns `{ access_token: userId, token_type: "bearer", expires_in: 7776000, scope: "mcp" }`

11. Claude.ai uses `userId` as bearer token on all subsequent MCP requests

---

## MCP Protocol Implementation

The worker implements MCP JSON-RPC 2.0 over Streamable HTTP (POST).

**Supported methods:**

| Method | Auth | Description |
|--------|------|-------------|
| `initialize` | Optional | Returns server info + `Mcp-Session-Id` header |
| `notifications/initialized` | Optional | Returns 202 |
| `ping` | Required | Returns `{}` |
| `tools/list` | Required | Returns all 5 tool definitions |
| `tools/call` | Required | Executes named tool |

**`initialize` response includes `Mcp-Session-Id` header** (required by Streamable HTTP transport spec).

**Available tools:**

| Tool | Description |
|------|-------------|
| `list_meetings` | List recorded Zoom meetings for a date range |
| `get_transcript` | Download full VTT transcript for a meeting UUID |
| `get_summary` | Get Zoom AI Companion summary for a meeting UUID |
| `get_meeting` | Get meeting details + participant list |
| `search_meetings` | Search meeting topics and summaries for a keyword |

---

## Cloudflare KV Schema

Namespace: `ZOOM_TOKENS` (id: `58ed9ac316a247b8b42aa3cc08bebfee`)

| Key pattern | Value | Description |
|-------------|-------|-------------|
| `tokens:{userId}` | `StoredTokens` JSON | Zoom OAuth tokens for a user |
| `authcode:{code}` | `{ userId, codeChallenge }` JSON | Short-lived auth code (5 min TTL) |

```typescript
interface StoredTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  expires_at: number;  // ms timestamp
  user_id?: string;
}
```

---

## Deploying

### Prerequisites
- Node.js 18+
- Wrangler CLI: `npm install -g wrangler`
- Cloudflare account with `haditechnology.com` zone

### Auth Worker

```bash
cd ~/hadi-auth-worker
npx wrangler secret put ZOOM_CLIENT_SECRET
npx wrangler deploy
```

### MCP Worker

```bash
cd ~/hadi-mcp-worker
npx wrangler secret put ZOOM_CLIENT_SECRET
npx wrangler deploy
```

### Zoom App Settings

- **OAuth Redirect URL:** `https://mcp.haditechnology.com/meetingops/callback`
- **OAuth Allow List:** `https://mcp.haditechnology.com/meetingops/callback`
- **Client ID:** `P5WLcOYjRhi_2HCj9u6foA`

---

## Known Issue: Claude.ai Web Connector

**Status: Blocked by Anthropic bug**

The full OAuth 2.1 flow completes successfully (all endpoints return correct responses), but Claude.ai web never sends the bearer token on subsequent MCP requests. After receiving the access token from `/meetingops/token`, Claude.ai makes a POST to `/meetingops` with no `Authorization` header, sees a `401`, and restarts the OAuth loop instead of retrying with the token.

**Evidence from logs:**
```
201 /meetingops/register
302 /meetingops/authorize
302 /meetingops/callback        ← Zoom auth succeeds, tokens stored in KV
200 /meetingops/token           ← Token issued: userId = QeLK8tdT...
401 /meetingops                 ← POST with NO bearer token ← bug
```

**Root cause:** Claude.ai web client does not attach the OAuth access token to MCP requests after the authorization flow. This is a known client-side bug in Claude.ai.

**Workarounds:**
- **Claude Code CLI:** `claude mcp add --transport http hadi-meetingops https://mcp.haditechnology.com/meetingops` — works perfectly
- **Claude for Desktop:** use local npm package with `ZOOM_USER_ID` env var — works perfectly
- **Claude.ai web:** blocked until Anthropic fixes the bug

**Resolution:** Monitor Anthropic's MCP changelog. No server-side changes needed — our implementation is spec-compliant.

---

## CORS Policy

All responses include:
```
Access-Control-Allow-Origin: https://claude.ai
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, Mcp-Session-Id
Access-Control-Max-Age: 86400
```

---

## Zoom App Requirements

The Zoom OAuth app must have these scopes enabled:
- `recording:read:list_user_recordings`
- `recording:read:recording_files`
- `recording:read:summary`
- `meeting:read:past_meeting`
- `meeting:read:past_meeting_participants`
- `user:read:user`

---

## Future MCP Servers

The `mcp.haditechnology.com` worker is designed to host multiple MCP servers under path-based routing:

```
mcp.haditechnology.com/meetingops   ← live
mcp.haditechnology.com/calendar     ← future
mcp.haditechnology.com/crm          ← future
```

Each new integration gets its own path prefix with its own `/authorize`, `/callback`, `/token`, and `/register` endpoints while sharing the same Cloudflare Worker and KV namespace.
