# HADI MeetingOps — Zoom MCP Server

MCP server for Zoom — access meeting transcripts and AI summaries from Claude. Built by [HADI Technology](https://haditechnology.com).

## Features

- **List meetings** — Browse your recent Zoom meetings
- **Get transcripts** — Full verbatim transcripts from recorded meetings
- **Get AI summaries** — AI Companion meeting summaries with action items
- **Get meeting details** — Participants, duration, recording availability
- **Search** — Find meetings by keywords across transcripts and summaries

## Requirements

- Zoom Pro, Business, or Enterprise account
- Cloud recording with "Audio transcript" enabled, or AI Companion enabled
- A **Server-to-Server OAuth** app in the [Zoom Marketplace](https://marketplace.zoom.us/)

## Setup

### 1. Create a Zoom Server-to-Server OAuth App

1. Go to [Zoom Marketplace](https://marketplace.zoom.us/) → Develop → Build App
2. Choose **Server-to-Server OAuth**
3. Add the following scopes:
   - `cloud_recording:read:list_user_recordings:admin`
   - `cloud_recording:read:recording:admin`
   - `cloud_recording:read:meeting_transcript:admin`
   - `meeting:read:meeting:admin`
   - `meeting:read:list_meetings:admin`
   - `meeting:read:summary:admin`
4. Activate the app and note your **Account ID**, **Client ID**, and **Client Secret**

### 2. Set environment variables

```bash
export ZOOM_ACCOUNT_ID=your_account_id
export ZOOM_CLIENT_ID=your_client_id
export ZOOM_CLIENT_SECRET=your_client_secret
```

Add these to your shell profile (`~/.zshrc` or `~/.bashrc`) to persist them.

### 3. Configure Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "hadi-zoom": {
      "command": "npx",
      "args": ["-y", "@hadi-technology/meetingops-zoom"],
      "env": {
        "ZOOM_ACCOUNT_ID": "your_account_id",
        "ZOOM_CLIENT_ID": "your_client_id",
        "ZOOM_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

> Requires Node.js 18+.

## Available Tools

| Tool | Description |
|------|-------------|
| `list_meetings` | List recent meetings with transcript/summary availability |
| `get_transcript` | Get full meeting transcript (VTT or AI Companion) |
| `get_summary` | Get AI Companion meeting summary |
| `get_meeting` | Get meeting details and participants |
| `search_meetings` | Search meetings by keywords |
| `debug_status` | Check authentication and configuration status |

## Example Prompts

- "Show me my Zoom meetings from last week"
- "Get the transcript from my meeting with John yesterday"
- "What were the action items from yesterday's standup?"
- "Summarize my meeting from this morning"
- "Search my meetings for anything about the budget"

## Transcript Sources

The server automatically finds the best available transcript:

| Source | When Available |
|--------|----------------|
| Cloud Recording VTT | Meeting was cloud recorded with "Audio transcript" enabled |
| AI Companion Summary | AI Companion was enabled (recording not required) |

## Troubleshooting

**"No meetings found"**
- Check that cloud recordings or AI Companion is enabled on your Zoom account
- Verify your account is Pro/Business/Enterprise
- Ensure the S2S app scopes include `cloud_recording:read:list_user_recordings:admin`

**"Missing required environment variables"**
- Ensure `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, and `ZOOM_CLIENT_SECRET` are all set
- Run `debug_status` tool to check what's configured

**"No transcript available"**
- The meeting may not have been recorded
- AI Companion may not have been enabled for that meeting
- Transcript may still be processing (wait ~2x the meeting duration after it ends)

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test locally
node dist/index.js

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

## License

MIT
