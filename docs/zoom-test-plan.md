# HADI MeetingOps — Test Plan for Zoom Reviewers

This document walks the Zoom Marketplace review team through testing every Zoom API scope used by HADI MeetingOps. Each scope has a single, specific user prompt that exercises it, with the expected outcome.

- **App name:** HADI MeetingOps
- **Production OAuth Client ID:** `P5WLcOYjRhi_2HCj9u6foA`
- **Documentation:** [zoom-marketplace.md](./zoom-marketplace.md)
- **Support:** [support@haditechnology.com](mailto:support@haditechnology.com)

---

## Test Account

| Field | Value |
|-------|-------|
| Zoom account email | `afadhel@gmail.com` |
| Password | _(provided in Zoom resubmission release notes)_ |
| 2FA | Disabled for the duration of the review |
| Pre-populated data | At least 3 cloud-recorded meetings with audio transcripts, at least 2 with AI Companion summaries |

---

## Setup

The fastest path for the reviewer is Claude.ai Web. No local install required.

1. Go to [claude.ai](https://claude.ai) and sign in with any Claude account (free tier is fine)
2. Click your profile → **Settings** → **Connectors**
3. Click **Add custom connector** at the bottom of the page
4. Enter the URL: `https://mcp.haditechnology.com/meetingops`
5. Click **Add**
6. Click **Connect** on the new MeetingOps connector card
7. You'll be redirected to Zoom OAuth — sign in with the test account credentials above and click **Allow**
8. You'll be returned to Claude.ai and the connector will show **Connected**

You're ready to test.

---

## Scope Verification

Each row below maps a single Zoom API scope to one specific MCP invocation. Run the prompts in a new Claude conversation. Toggle the MeetingOps connector on (click the **+** button in the chat input).

### `recording:read:list_user_recordings`

- **Prompt:** *"List my recent Zoom meetings."*
- **What happens:** Claude invokes the `list_meetings` tool, which calls `GET /v2/users/{userId}/recordings`
- **Expected output:** A list of cloud-recorded meetings with topic, date, duration, and meeting UUID — at least 3 meetings should appear from the test account

### `recording:read:recording_files`

- **Prompt:** *"Show me the transcript of my most recent meeting."*
- **What happens:** Claude calls `list_meetings` to find the most recent meeting, then `get_transcript` which calls `GET /v2/meetings/{meetingId}/recordings` and downloads the transcript file
- **Expected output:** A VTT-format transcript with speaker labels and timestamps. Truncated at ~100,000 characters with a note if longer

### `recording:read:summary`

- **Prompt:** *"Summarize my last meeting."*
- **What happens:** Claude calls `list_meetings` to identify the most recent meeting, then `get_summary` which calls `GET /v2/meetings/{meetingId}/meeting_summary`
- **Expected output:** A summary of the meeting with key points, decisions, and any next steps that AI Companion captured. (Test the most recent meeting that has AI Companion enabled — see Test Account note above)

### `meeting:read:past_meeting`

- **Prompt:** *"Show me the details of my last meeting, including who attended."*
- **What happens:** Claude calls `get_meeting`, which fans out to `GET /v2/past_meetings/{meetingId}` for metadata AND `GET /v2/past_meetings/{meetingId}/participants` for the participant list
- **Expected output:** Meeting topic, date, duration, plus a participant list with names and emails

### `meeting:read:past_meeting_participants`

- This scope is exercised by the **same prompt as the previous row**. The `get_meeting` tool calls both `past_meeting` and `past_meeting_participants` in parallel
- **Expected output:** The participant list portion of the response — names, emails, and join durations

### `user:read:user`

- **Prompt:** *"Show me my Zoom profile."*
- **What happens:** Claude reads the `zoom://profile` MCP resource, which calls `GET /v2/users/{userId}`
- **Expected output:** The connected user's first name, last name, email, account ID, timezone, and language

---

## Uninstall Verification

Once the scope tests pass, verify the deauthorization webhook works correctly.

1. Go to the [Zoom Marketplace](https://marketplace.zoom.us)
2. Sign in with the test account (`afadhel@gmail.com`)
3. Click your profile → **Manage** → **Added Apps**
4. Find **HADI MeetingOps** and click **Remove**
5. Confirm the removal

After Zoom sends the `app_deauthorized` event, our worker deletes the user's OAuth tokens from Cloudflare KV within seconds.

**Verify the deletion:**

1. Return to Claude.ai (the same conversation, no need to refresh)
2. Send the prompt: *"List my recent Zoom meetings."*
3. **Expected output:** An authentication error — Claude will report that the connector is no longer authorized

This confirms that revoking the app from Zoom Marketplace immediately wipes our stored credentials.

---

## What's Stored

For full transparency on data handling:

- **Stored:** Encrypted Zoom OAuth access + refresh tokens, keyed by Zoom user ID, in Cloudflare KV
- **Not stored:** Meeting content (transcripts, summaries, participant lists). All meeting data is fetched on demand from Zoom and held only in the user's Claude conversation context

See the [Removing the App](./zoom-marketplace.md#removing-the-app) section of our user documentation for the full data retention policy.

---

## Questions

Email [support@haditechnology.com](mailto:support@haditechnology.com) with the subject line **"Zoom App Review"** for the fastest response. We monitor this address continuously during the review window.
