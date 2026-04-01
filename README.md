# MEETING | OPS by HADI

> Your Zoom meetings, inside Claude Cowork.

**HADI MeetingOps** is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that brings your Zoom meetings directly into [Claude Cowork](https://claude.ai) — so you can ask questions, automate follow-ups, and build workflows powered by your meeting data, all from within Claude.

No switching apps. No searching through recordings. Just ask Claude.

🌐 [haditechnology.com/meetingops](https://haditechnology.com/meetingops)

---

## Works with Claude Cowork

MeetingOps is built for **Claude Cowork** (claude.ai). Once connected, Claude has full access to your Zoom meeting history — you can ask it anything, chain it with other tools, and automate workflows directly inside your Claude workspace.

- **"Summarize my last Zoom meeting"**
- **"What action items came out of yesterday's call?"**
- **"Draft a follow-up email based on my Q2 planning meeting"**
- **"Search my meetings for anything we discussed about the budget"**
- **"Prep me for my 2pm — what did we cover last time with this client?"**

Because MeetingOps runs over MCP, Claude can combine your meeting data with any other connected tool — Notion, Asana, Slack, email, calendar — in a single conversation.

---

## What you can do

- **Ask Claude anything** — natural language access to all your Zoom meetings
- **Connect to other tools** — pipe meeting data into Notion, Asana, Slack & more via Claude Cowork
- **Automate follow-ups** — Claude drafts emails, tasks, and summaries automatically
- **Build custom workflows** — chain meeting insights with any other MCP server in Cowork
- **Meeting prep** — surface relevant past discussions before your next call

## Requirements

- [Claude Cowork](https://claude.ai) or Claude for Desktop
- A Zoom account with recorded meetings
- Node.js 18+

## Setup

### 1. Authorize with Zoom

Visit [auth.haditechnology.com/zoom/authorize](https://auth.haditechnology.com/zoom/authorize) in your browser and sign in with your Zoom account. You'll be shown your **Zoom User ID** — copy it.

### 2. Add to your MCP config

In Claude Cowork or Claude for Desktop, add the following MCP server configuration:

```json
{
  "mcpServers": {
    "hadi-meetingops": {
      "command": "npx",
      "args": ["hadi-meetingops"],
      "env": {
        "ZOOM_USER_ID": "your_zoom_user_id_here",
        "ZOOM_AUTH_URL": "https://auth.haditechnology.com"
      }
    }
  }
}
```

### 3. Restart Claude

Restart Claude Cowork or Claude for Desktop. MeetingOps will appear as a connected tool and Claude will have access to your Zoom meetings.

## Available tools

| Tool | Description |
|------|-------------|
| `list_meetings` | List recent meetings with transcript/summary availability |
| `get_transcript` | Get full transcript or AI summary for a meeting |
| `get_summary` | Get Zoom AI Companion meeting summary |
| `get_meeting` | Get meeting details and participants |
| `search_meetings` | Search across transcripts and summaries |
| `debug_status` | Check auth config and environment |

## Privacy

MeetingOps does **not** record, store, or transmit your Zoom meeting content. The only data persisted is your Zoom User ID and OAuth refresh token (stored encrypted in Cloudflare KV). All meeting data is fetched on-demand and processed within Claude's context window only.

[Terms of Use](https://haditechnology.com/meetingops/terms) · [Privacy Policy](https://haditechnology.com/privacy)

## License

MIT © [HADI Technology](https://haditechnology.com)
