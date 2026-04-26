# HADI MeetingOps — User Documentation

HADI MeetingOps connects Claude to your Zoom account so you can search, summarize, and prepare for meetings without leaving your conversation. This guide covers how to add the app, what each feature does, and how to remove the app when you're done.

- **Support:** [support@haditechnology.com](mailto:support@haditechnology.com)
- **Privacy Policy:** [haditechnology.com/privacy-policy](https://haditechnology.com/privacy-policy)
- **Troubleshooting:** [troubleshooting.md](./troubleshooting.md)

---

## Adding the App

### Prerequisites

Before you connect MeetingOps to Claude, your Zoom account must have:

- **Zoom Pro plan** or above (required for cloud recording)
- **Cloud recording enabled** with audio transcripts turned on (Settings > Recording > Cloud recording > Audio transcript)
- **Zoom AI Companion enabled** for meeting summaries (Settings > AI Companion > Meeting summary)

You only need to enable these once per account. Recordings made before these settings were enabled will not have transcripts or summaries available.

MeetingOps supports three Claude clients. Pick the one you use.

### Add to Claude.ai (Web)

1. Go to **Settings → Connectors** in Claude.ai
2. Click **Add custom connector** at the bottom of the page
3. Enter the URL: `https://mcp.haditechnology.com/meetingops`
4. Click **Add**, then click **Connect** on the new connector card
5. You'll be redirected to Zoom to authorize MeetingOps. Sign in and click **Allow**
6. After authorization, you'll be returned to Claude.ai with the connector marked as connected

**Smoke test:** Open a new conversation and ask: *"List my recent Zoom meetings."* You should see a list of meetings within a few seconds.

If something goes wrong, see [troubleshooting](./troubleshooting.md).

### Add to Claude Desktop

1. Visit [auth.haditechnology.com/zoom/authorize](https://auth.haditechnology.com/zoom/authorize)
2. Sign in to Zoom and authorize MeetingOps
3. The success page displays your **Zoom User ID** — copy it
4. Open your Claude Desktop config file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
5. Add the MeetingOps server with your Zoom User ID:

   ```json
   {
     "mcpServers": {
       "hadi-meetingops": {
         "command": "npx",
         "args": ["-y", "@hadi-technology/meetingops-zoom"],
         "env": {
           "ZOOM_USER_ID": "YOUR_ZOOM_USER_ID_HERE",
           "ZOOM_AUTH_URL": "https://auth.haditechnology.com"
         }
       }
     }
   }
   ```

6. Restart Claude Desktop

**Smoke test:** Ask Claude *"List my recent Zoom meetings."* You should see results within a few seconds.

If something goes wrong, see [troubleshooting](./troubleshooting.md).

### Add to Claude Code

1. Visit [auth.haditechnology.com/zoom/authorize](https://auth.haditechnology.com/zoom/authorize) and authorize Zoom
2. Copy your Zoom User ID from the success page
3. In your terminal, run:

   ```bash
   claude mcp add --transport http hadi-meetingops https://mcp.haditechnology.com/meetingops
   ```

4. When prompted for an authentication token, paste your Zoom User ID

**Smoke test:** In any Claude Code session, ask *"List my recent Zoom meetings."* You should see results within a few seconds.

If something goes wrong, see [troubleshooting](./troubleshooting.md).

---

## Usage

MeetingOps exposes its functionality through three MCP capability types: **tools** (actions Claude can take), **resources** (data Claude can read), and **prompts** (reusable workflows).

Each capability uses one or more Zoom API scopes, all of which are read-only. The full scope list is:

- `recording:read:list_user_recordings` — list cloud recordings
- `recording:read:recording_files` — read individual recording files (transcripts)
- `recording:read:summary` — read AI Companion summaries
- `meeting:read:past_meeting` — read past meeting metadata
- `meeting:read:past_meeting_participants` — read past meeting participant lists
- `user:read:user` — read the connected user's Zoom profile

### Tools

#### `list_meetings` — List Meetings

Lists your cloud-recorded Zoom meetings within a date range.

- **Zoom scopes:** `recording:read:list_user_recordings`
- **Sample prompt:** *"List my Zoom meetings from the past two weeks."*
- **Sample output:** A list of meeting topics, dates, durations, and unique IDs

#### `get_transcript` — Get Transcript

Fetches the full transcript of a specific meeting.

- **Zoom scopes:** `recording:read:recording_files`
- **Sample prompt:** *"Show me the transcript of my meeting with the engineering team yesterday."*
- **Sample output:** The complete VTT transcript with speaker labels and timestamps

#### `get_summary` — Get Summary

Retrieves the Zoom AI Companion summary of a meeting, including next steps.

- **Zoom scopes:** `recording:read:summary`
- **Sample prompt:** *"Summarize my last meeting."*
- **Sample output:** A concise summary plus a list of action items and decisions

#### `get_meeting` — Get Meeting Details

Returns metadata for a past meeting plus its full participant list.

- **Zoom scopes:** `meeting:read:past_meeting`, `meeting:read:past_meeting_participants`
- **Sample prompt:** *"Who attended my product review meeting last Thursday?"*
- **Sample output:** Meeting topic, start time, duration, and the names + emails of all attendees

#### `search_meetings` — Search Meetings

Searches across your meeting summaries and topics for a keyword.

- **Zoom scopes:** `recording:read:list_user_recordings`, `recording:read:summary`
- **Sample prompt:** *"Find any meetings where we discussed the Q2 roadmap."*
- **Sample output:** A list of matching meetings with summary excerpts

### Resources

Resources require no Zoom scopes beyond those already used by tools.

#### `zoom://profile` — Zoom Profile

The connected user's Zoom profile (name, email, account ID).

- **Zoom scopes:** `user:read:user`
- **Sample prompt:** *"Show me my Zoom profile."*

#### `zoom://upcoming` — Upcoming Meetings

Your scheduled upcoming Zoom meetings.

- **Zoom scopes:** No additional scope (uses existing meeting read scope)
- **Sample prompt:** *"What Zoom meetings do I have coming up?"*

### Prompts

Prompts are reusable workflows that combine multiple tool calls. They use only the scopes already required by the tools they invoke.

#### `meeting_summary` — Meeting Summary

Generates an audience-aware summary (executive, technical, PM, or client-facing).

- **Sample prompt:** *"Run the meeting summary prompt for my last call."*

#### `meeting_prep` — Meeting Prep

Pulls context from past meetings to prepare you for an upcoming call.

- **Sample prompt:** *"Prep me for my call with Acme Corp tomorrow."*

#### `action_tracker` — Action Tracker

Lists open action items and decisions from your recent meetings.

- **Sample prompt:** *"What action items are still open from the last 30 days?"*

#### `cross_meeting_search` — Cross-Meeting Search

Searches across meetings and analyzes patterns over time.

- **Sample prompt:** *"What topics keep coming up in my meetings this quarter?"*

---

## Removing the App

You can remove MeetingOps from either Zoom or Claude. Both achieve the same end state.

### Remove via Zoom Marketplace

1. Sign in to the [Zoom Marketplace](https://marketplace.zoom.us)
2. Click your profile, then **Manage** → **Added Apps**
3. Find **HADI MeetingOps** and click **Remove**
4. Confirm the removal

### Remove via Claude

1. Go to **Settings → Connectors** in Claude.ai (or the equivalent settings page in Claude Desktop / Claude Code)
2. Find **HADI MeetingOps** and click **Disconnect** or **Remove**

### What Happens on Removal

When you remove the app from Zoom Marketplace, Zoom sends a deauthorization signal to MeetingOps. Within seconds, the worker:

- **Deletes** your `tokens:{userId}` entry from Cloudflare KV — this is the OAuth token that lets MeetingOps call the Zoom API on your behalf
- **Invalidates** your refresh token (`refresh:{token}` in KV) — once `tokens:{userId}` is gone, the refresh token cannot be exchanged for a new access token. The KV entry itself expires naturally within 90 days

After deauthorization, any further MCP request from your Claude session will return an authentication error until you reconnect.

### What Data Is Stored

MeetingOps stores **only OAuth tokens**, never meeting content. Specifically:

| What's stored | Where | When deleted |
|---------------|-------|--------------|
| Encrypted Zoom OAuth access + refresh tokens | Cloudflare KV (`tokens:{userId}`) | Immediately on Zoom deauthorization |
| MCP refresh token (Claude.ai web only) | Cloudflare KV (`refresh:{token}`) | Becomes unusable on Zoom deauthorization; KV entry expires within 90 days |
| Meeting transcripts, summaries, participant lists | **Never persisted** — fetched on demand from Zoom and held only in your Claude conversation context | N/A |

### Request Manual Data Deletion

If you want to confirm data deletion or have any other privacy concern, email [support@haditechnology.com](mailto:support@haditechnology.com) with your Zoom account email. We'll confirm removal within one business day.
