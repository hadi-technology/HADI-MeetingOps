# HADI MeetingOps — Zoom MCP Server

MCP server that lets Claude access Zoom meeting transcripts and AI summaries via Server-to-Server OAuth. Built by HADI Technology (haditechnology.com).

## Git Policy

**Do not commit or push automatically.** Always wait for explicit user confirmation before running git commit or git push.

## Architecture

Uses Zoom **Server-to-Server OAuth** — no browser flow, no stored tokens. Credentials (`ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`) are set as environment variables. A token is fetched on startup and cached in memory; re-fetched automatically on expiry.

Past meetings are sourced from the user-level recordings endpoint (`/users/{uid}/recordings`) rather than the meetings list endpoint, as it returns richer data and works reliably with S2S OAuth scopes.

## Tech Stack

- TypeScript + ESM modules
- `@modelcontextprotocol/sdk` for MCP protocol
- Zoom Server-to-Server OAuth (account_credentials grant)
- No token storage — credentials injected via env vars

## Commands

```bash
npm run build           # Compile TypeScript
npm run dev             # Watch mode
npm start               # Run MCP server
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `list_meetings` | List recent meetings with transcript/summary availability |
| `get_transcript` | Get full meeting transcript (VTT or AI summary fallback) |
| `get_summary` | Get AI Companion meeting summary |
| `get_meeting` | Get meeting details and participants |
| `search_meetings` | Search across transcripts and summaries |
| `debug_status` | Check auth config and environment |

## Key Directories

- `src/` - MCP server implementation
- `src/auth/` - S2S OAuth token management
- `src/tools/` - Individual MCP tool handlers
- `cloud-functions/` - Optional GCP proxy for org-wide meeting access
- `scripts/` - Development and debugging utilities

## Environment Variables

- `ZOOM_ACCOUNT_ID` - Zoom account ID (from S2S OAuth app)
- `ZOOM_CLIENT_ID` - S2S OAuth client ID
- `ZOOM_CLIENT_SECRET` - S2S OAuth client secret
- `ZOOM_PROXY_URL` - Optional: URL of deployed proxy API for org-wide access

## Testing

```bash
# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js

# Clear in-memory token cache (restart server)
node dist/index.js --logout
```
