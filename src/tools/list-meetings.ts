import { z } from 'zod';
import { getZoomClient } from '../zoom-client.js';
import { isProxyConfigured, listMeetingsFromProxy, ProxyError } from '../proxy-client.js';
import type { MeetingInfo } from '../types.js';

export const listMeetingsSchema = z.object({
  meeting_type: z
    .enum(['past', 'upcoming', 'live'])
    .optional()
    .describe('Type of meetings to list: past (default), upcoming, or live.'),
  from_date: z
    .string()
    .optional()
    .describe('Start date (YYYY-MM-DD). Only used for past meetings. Defaults to 30 days ago.'),
  to_date: z
    .string()
    .optional()
    .describe('End date (YYYY-MM-DD). Only used for past meetings. Defaults to today.'),
  type: z
    .enum(['all', 'recorded', 'with_summary'])
    .optional()
    .describe('Filter by type: all, recorded, or with_summary. Defaults to all.'),
  user_email: z
    .string()
    .optional()
    .describe('Email of user to query meetings for. Admin only - requires Zoom admin privileges.'),
});

export type ListMeetingsInput = z.infer<typeof listMeetingsSchema>;

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDefaultFromDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return formatDate(date);
}

function getDefaultToDate(): string {
  return formatDate(new Date());
}

// Find instance UUID that matches the scheduled start time
function findInstanceUuid(
  instances: { uuid: string; start_time: string }[],
  scheduledStartTime: string
): string | null {
  const scheduledDate = new Date(scheduledStartTime);

  for (const instance of instances) {
    const instanceDate = new Date(instance.start_time);
    // Match if within 1 hour of scheduled time (meetings can start early/late)
    const diffMs = Math.abs(instanceDate.getTime() - scheduledDate.getTime());
    if (diffMs < 60 * 60 * 1000) {
      return instance.uuid;
    }
  }
  return null;
}

export async function listMeetings(input: ListMeetingsInput): Promise<MeetingInfo[]> {
  const client = getZoomClient();

  const meetingType = input.meeting_type || 'past';
  const filterType = input.type || 'all';

  // Handle upcoming and live meetings (no instance UUID needed)
  if (meetingType === 'upcoming' || meetingType === 'live') {
    const response = meetingType === 'upcoming'
      ? await client.listUpcomingMeetings()
      : await client.listLiveMeetings();

    const meetings: MeetingInfo[] = response.meetings.map((meeting) => ({
      meeting_id: String(meeting.id),
      instance_uuid: meeting.uuid, // For upcoming/live, use the scheduled UUID
      topic: meeting.topic,
      date: meeting.start_time,
      duration_minutes: meeting.duration,
      has_recording: false,
      has_transcript: false,
      has_summary: false,
    }));

    // Sort by date ascending for upcoming (soonest first)
    meetings.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return meetings;
  }

  // Handle past meetings (need instance UUIDs for transcripts)
  const fromDate = input.from_date || getDefaultFromDate();
  const toDate = input.to_date || getDefaultToDate();

  // If proxy is configured, use it to get meetings user participated in
  // This includes meetings they attended but didn't host
  if (isProxyConfigured()) {
    try {
      const proxyMeetings = await listMeetingsFromProxy(fromDate, toDate, 50, input.user_email);

      // Apply filter
      let filteredMeetings = proxyMeetings;
      if (filterType === 'with_summary') {
        filteredMeetings = proxyMeetings.filter((m) => m.has_summary);
      } else if (filterType === 'recorded') {
        filteredMeetings = proxyMeetings.filter((m) => m.has_recording);
      }

      // Sort by date descending (most recent first)
      filteredMeetings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return filteredMeetings;
    } catch (error) {
      // If admin access denied, throw the error instead of falling back
      if (error instanceof ProxyError && error.status === 403) {
        throw new Error('Admin access required to query other users\' meetings');
      }
      // Proxy failed, fall back to direct API
      console.error('Proxy list-meetings failed, falling back to direct API:', error);
    }
  }

  // user_email requires proxy - can't fall back to direct API
  if (input.user_email) {
    throw new Error('Querying other users\' meetings requires the proxy to be configured');
  }

  // Direct Zoom API — use the recordings endpoint as the primary source for past meetings.
  // It returns richer data (instance UUID, recording files) and works with S2S OAuth.
  const recordings = await client.getAllRecordings(fromDate, toDate);

  const meetings: MeetingInfo[] = [];

  for (const recording of recordings) {
    const hasTranscript = recording.recording_files?.some(
      (f) => f.file_type === 'TRANSCRIPT' || f.file_extension === 'VTT'
    ) ?? false;

    const meetingInfo: MeetingInfo = {
      meeting_id: String(recording.id),
      instance_uuid: recording.uuid,
      topic: recording.topic,
      date: recording.start_time,
      duration_minutes: recording.duration,
      has_recording: true,
      has_transcript: hasTranscript,
      has_summary: true, // Will be confirmed when fetched
    };

    if (filterType === 'recorded' || filterType === 'all') {
      meetings.push(meetingInfo);
    } else if (filterType === 'with_summary') {
      meetings.push(meetingInfo);
    }
  }

  // Sort by date descending (most recent first)
  meetings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return meetings;
}
