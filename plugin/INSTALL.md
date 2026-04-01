# HADI MeetingOps — Manual Install for Claude Desktop

## Prerequisites

- [Claude Desktop](https://claude.ai/download) installed
- [Node.js 18+](https://nodejs.org) installed
- A Zoom account with cloud recordings enabled

---

## Step 1 — Authorize Zoom

Open this URL in your browser and sign in with your Zoom account:

```
https://auth.haditechnology.com/zoom/authorize
```

After authorizing, you'll see a success page with your **Zoom User ID** — a string like `QeLK8tdTSdej79w7J6L4Rg`. Copy it.

---

## Step 2 — Edit the config file

Open `claude_desktop_config.json` (in this folder) and replace `PASTE_YOUR_ZOOM_USER_ID_HERE` with the ID you copied:

```json
{
  "mcpServers": {
    "hadi-meetingops": {
      "command": "npx",
      "args": ["-y", "hadi-meetingops"],
      "env": {
        "ZOOM_USER_ID": "QeLK8tdTSdej79w7J6L4Rg",
        "ZOOM_AUTH_URL": "https://auth.haditechnology.com"
      }
    }
  }
}
```

---

## Step 3 — Add to Claude Desktop

### If you have no existing MCP servers

Copy the entire `claude_desktop_config.json` file to:

| Platform | Location |
|----------|----------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

### If you already have other MCP servers configured

Open your existing `claude_desktop_config.json` and add the `hadi-meetingops` block inside the `mcpServers` object alongside your existing servers:

```json
{
  "mcpServers": {
    "your-existing-server": { ... },
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

---

## Step 4 — Restart Claude Desktop

Quit and reopen Claude Desktop. You should see MeetingOps appear in the tools panel.

---

## Step 5 — Try it

Ask Claude:

- "Show me my Zoom meetings from last week"
- "Summarise my call with the client yesterday"
- "What action items came out of this morning's standup?"
- "Search my meetings for anything about the budget"

---

## Troubleshooting

**"No token found for this user"**
Your Zoom authorization has expired. Re-visit `https://auth.haditechnology.com/zoom/authorize` to reconnect.

**MeetingOps not showing in Claude**
Make sure Node.js 18+ is installed (`node --version`) and that you restarted Claude Desktop after editing the config.

**Wrong config file location**
On macOS, press `Cmd+Shift+G` in Finder and paste `~/Library/Application Support/Claude/` to navigate directly to the folder.

---

## Support

[haditechnology.com/meetingops](https://haditechnology.com/meetingops) · [privacy policy](https://haditechnology.com/privacy)
