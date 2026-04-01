# HADI MeetingOps — Zoom MCP Server

MCP server that lets Claude access Zoom meeting transcripts and AI summaries. Built by HADI Technology (haditechnology.com).

## Git Policy

**Do not commit or push automatically.** Always wait for explicit user confirmation before running git commit or git push.

## Architecture

Two deployment modes:

**Remote (primary):** Cloudflare Worker at `mcp.haditechnology.com/meetingops`. Bearer token = Zoom User ID. Tokens stored in Cloudflare KV (`tokens:{userId}`). Auto-refreshes expired tokens via Zoom OAuth.

**Local (npm):** Node.js process launched by Claude for Desktop via `npx hadi-meetingops`. Uses `ZOOM_USER_ID` + `ZOOM_AUTH_URL` env vars. Calls `POST /zoom/token` on the HADI Auth Worker to get a valid access token.

Auth worker lives at `https://auth.haditechnology.com` (Cloudflare Worker in `~/hadi-auth-worker`). Remote MCP worker lives in `~/hadi-mcp-worker`.

## Tech Stack

- TypeScript + ESM modules
- `@modelcontextprotocol/sdk` for the local npm package
- Remote worker: vanilla Cloudflare Worker (no SDK), implements MCP JSON-RPC directly
- Zoom User OAuth (authorization_code grant)
- Cloudflare KV for token storage (shared between auth worker and MCP worker)

## Commands

```bash
npm run build           # Compile TypeScript (local npm package)
npm run dev             # Watch mode
npm start               # Run local MCP server

# Deploy remote MCP worker
cd ~/hadi-mcp-worker && npx wrangler deploy

# Deploy auth worker
cd ~/hadi-auth-worker && npx wrangler deploy
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `list_meetings` | List recent meetings with transcript/summary availability |
| `get_transcript` | Get full meeting transcript (VTT) |
| `get_summary` | Get Zoom AI Companion meeting summary |
| `get_meeting` | Get meeting details and participants |
| `search_meetings` | Search across transcripts and summaries |

## Key Directories

- `src/` — Local npm MCP server implementation
- `~/hadi-mcp-worker/src/index.ts` — Remote Cloudflare Worker MCP server
- `~/hadi-auth-worker/src/` — Zoom OAuth token management worker

## Environment Variables (local npm mode)

- `ZOOM_USER_ID` — Zoom user ID (from `/zoom/authorize` success page)
- `ZOOM_AUTH_URL` — Base URL of the HADI Auth Worker (default: `https://auth.haditechnology.com`)

## Remote MCP Worker Config

- Client ID in `wrangler.toml` as `ZOOM_CLIENT_ID`
- Client secret via `npx wrangler secret put ZOOM_CLIENT_SECRET`
- KV namespace ID: `58ed9ac316a247b8b42aa3cc08bebfee`

## First-time Setup (end user)

1. Visit `https://auth.haditechnology.com/zoom/authorize`
2. Authorize with Zoom account
3. Copy the `ZOOM_USER_ID` from the success page
4. Add `https://mcp.haditechnology.com/meetingops` as a custom connector in Claude.ai, using the User ID as the Bearer token

## Testing

```bash
# Test remote MCP endpoint
curl -X POST https://mcp.haditechnology.com/meetingops \
  -H "Authorization: Bearer YOUR_ZOOM_USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# Test local package with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```
