# HADI MeetingOps — Troubleshooting

This guide covers the most common issues users encounter with MeetingOps. If your problem isn't listed, email [support@haditechnology.com](mailto:support@haditechnology.com).

---

## "No meetings found" or empty list

**Symptom:** Claude says it can't find any of your recent meetings, even though you know you've had Zoom calls.

**Cause:** Your meetings weren't recorded to the cloud. MeetingOps only sees **cloud recordings** — local recordings stay on your computer and aren't accessible via the Zoom API.

**Resolution:**

1. In your Zoom web settings, go to **Settings → Recording**
2. Enable **Cloud recording**
3. Under **Advanced cloud recording settings**, enable **Audio transcript**
4. From now on, any meeting you record will be available to MeetingOps

Past meetings recorded only locally cannot be retroactively imported.

---

## "No transcript available" for a specific meeting

**Symptom:** Meeting shows up in the list, but `get_transcript` returns nothing or an error.

**Cause:** The meeting was cloud-recorded, but the audio transcript wasn't generated. Transcripts are an opt-in setting, and Zoom only generates them after the recording finishes processing.

**Resolution:**

1. Confirm **Audio transcript** is enabled in Settings → Recording → Advanced cloud recording settings
2. For a specific past meeting, sign in to [zoom.us/recording](https://zoom.us/recording) and check whether a transcript file is listed
3. If the meeting is recent, give Zoom 10–30 minutes after the call ends to finish processing
4. Going forward, transcripts will be generated automatically for new recordings

---

## "No summary" available

**Symptom:** `get_summary` returns nothing or "no summary available."

**Cause:** Zoom AI Companion was not enabled for the meeting. AI Companion is a separate feature from cloud recording.

**Resolution:**

1. In Zoom web settings, go to **Settings → AI Companion**
2. Enable **Meeting summary with AI Companion**
3. Optionally, enable **Automatically start summary when meeting starts**
4. Future meetings will get summaries; past meetings without AI Companion summaries cannot be summarized retroactively

---

## "Authentication failed" or "Re-authorize required"

**Symptom:** Claude returns an error like "authentication failed," "user not authorized," or "session expired."

**Cause:** Either your OAuth token expired (and the refresh token also expired, after ~90 days of inactivity), or you removed MeetingOps from your Zoom account and need to reconnect.

**Resolution:**

- **Claude.ai Web:** Go to **Settings → Connectors**, click **Disconnect** on MeetingOps, then click **Connect** again to redo the OAuth flow
- **Claude Desktop:** Visit [auth.haditechnology.com/zoom/authorize](https://auth.haditechnology.com/zoom/authorize) again, copy your new Zoom User ID, update your `claude_desktop_config.json`, and restart Claude
- **Claude Code:** Run `claude mcp remove hadi-meetingops` then `claude mcp add` again with a fresh User ID

---

## MeetingOps tool isn't appearing in Claude

**Symptom:** You added the connector but Claude doesn't seem to know about it. Asking "list my meetings" returns a generic answer with no tool call.

**Cause:** The connector wasn't enabled for the conversation, or the connector failed to initialize.

**Resolution:**

1. **Check the connector is enabled in this conversation:** In Claude.ai, click the **+** button in the chat input and confirm MeetingOps is toggled on
2. **Check the connector is connected:** Go to Settings → Connectors and confirm MeetingOps shows as **Connected** (not "Disconnected" or "Error")
3. **For Claude Desktop:** Restart the app — config changes don't apply until restart
4. **For Claude Code:** Run `claude mcp list` to confirm the server is registered

If the connector shows an error state, click **Reconnect** or remove and re-add it.

---

## Still stuck?

Email [support@haditechnology.com](mailto:support@haditechnology.com) with:

- Which Claude client you're using (Web, Desktop, Code)
- The exact error message or unexpected behavior
- Your Zoom account email (for account lookup)

We respond within one business day.
