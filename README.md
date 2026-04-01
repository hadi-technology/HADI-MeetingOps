# MEETING | OPS by HADI

> Your Zoom meetings, inside Claude.

**HADI MeetingOps** is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that brings your Zoom meetings directly into [Claude](https://claude.ai) — so you can ask questions, automate follow-ups, and build workflows powered by your meeting data, without leaving Claude.

No switching apps. No searching through recordings. Just ask Claude.

🌐 [haditechnology.com/meetingops](https://haditechnology.com/meetingops)

---

## What you can do

- **"Summarize my last Zoom meeting"**
- **"What action items came out of yesterday's call?"**
- **"Draft a follow-up email based on my Q2 planning meeting"**
- **"Search my meetings for anything we discussed about the budget"**
- **"Prep me for my 2pm — what did we cover last time with this client?"**

Because MeetingOps runs over MCP, Claude can combine your meeting data with any other connected tool — Notion, Asana, Slack, email, calendar — in a single conversation.

---

## Setup

### Option A — Remote connector (Claude.ai, no install required)

The easiest way. Works directly in Claude.ai with no local setup needed.

**1. Authorize with Zoom**

Visit [auth.haditechnology.com/zoom/authorize](https://auth.haditechnology.com/zoom/authorize) and sign in with your Zoom account. Copy the **Zoom User ID** shown on the success page.

**2. Add as a custom connector in Claude.ai**

Go to [claude.ai](https://claude.ai) → Settings → **Connectors** → **Add custom connector**

Enter:
```
https://mcp.haditechnology.com/meetingops
```

When prompted for authentication, paste your **Zoom User ID** as the token.

**3. Done** — ask Claude anything about your Zoom meetings.

---

### Option B — Local install (Claude for Desktop / Claude Code)

For users who prefer running the MCP server locally.

**Requirements:** Node.js 18+

**1. Authorize with Zoom**

Visit [auth.haditechnology.com/zoom/authorize](https://auth.haditechnology.com/zoom/authorize) and sign in. Copy your **Zoom User ID**.

**2. Add to your MCP config**

In Claude for Desktop, edit your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "hadi-meetingops": {
      "command": "npx",
      "args": ["-y", "hadi-meetingops"],
      "env": {
        "ZOOM_USER_ID": "your_zoom_user_id_here",
        "ZOOM_AUTH_URL": "https://auth.haditechnology.com"
      }
    }
  }
}
```

**3. Restart Claude for Desktop** — MeetingOps will appear as a connected tool.

---

## Available tools

| Tool | Description |
|------|-------------|
| `list_meetings` | List recent meetings with transcript/summary availability |
| `get_transcript` | Get full transcript for a meeting |
| `get_summary` | Get Zoom AI Companion meeting summary |
| `get_meeting` | Get meeting details and participants |
| `search_meetings` | Search across transcripts and summaries |

---

## Privacy

MeetingOps does **not** record, store, or transmit your Zoom meeting content. The only data persisted is your Zoom User ID and OAuth refresh token (stored encrypted in Cloudflare KV). All meeting data is fetched on-demand and processed within Claude's context window only.

[Privacy Policy](https://haditechnology.com/privacy) · [Terms of Use](https://haditechnology.com/meetingops/terms)

---

## License

MIT © [HADI Technology](https://haditechnology.com)
