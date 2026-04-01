import { ZOOM_USER_ID, ZOOM_AUTH_URL, validateConfig } from './constants.js';

/**
 * Fetch a valid Zoom access token from the HADI Auth Worker.
 *
 * The Worker handles token storage, refresh, and expiry automatically.
 * If the user has never authorized, or their refresh token has expired,
 * the Worker returns 401 and we print the authorize URL and exit.
 */
async function fetchTokenFromWorker(): Promise<string> {
  const workerUrl = `${ZOOM_AUTH_URL}/zoom/token`;

  let response: Response;
  try {
    response = await fetch(workerUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: ZOOM_USER_ID }),
    });
  } catch (err) {
    throw new Error(
      `Could not reach HADI Auth Worker at ${workerUrl}. ` +
      `Check your internet connection or ZOOM_AUTH_URL setting. (${err})`
    );
  }

  if (response.status === 401) {
    const data = await response.json().catch(() => ({}) as Record<string, unknown>) as {
      error?: string;
      authorize_url?: string;
    };
    const authorizeUrl = data.authorize_url ?? `${ZOOM_AUTH_URL}/zoom/authorize`;
    const reason = data.error === 'reauthorization_required'
      ? 'Your Zoom session has expired and needs to be renewed.'
      : 'Your Zoom account has not been connected yet.';

    process.stderr.write(
      `\n[HADI MeetingOps] Zoom authorization required.\n` +
      `${reason}\n\n` +
      `Open this URL in your browser to authorize:\n  ${authorizeUrl}\n\n`
    );
    process.exit(1);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`HADI Auth Worker error: ${response.status} ${text}`);
  }

  const data = await response.json() as { access_token: string };
  if (!data.access_token) {
    throw new Error('Auth Worker returned a response without an access_token.');
  }

  return data.access_token;
}

/**
 * Get a valid Zoom access token.
 * Called by ZoomClient on first use and after any 401 from Zoom's API.
 */
export async function getValidAccessToken(): Promise<string> {
  validateConfig();
  return fetchTokenFromWorker();
}

export async function logout(): Promise<void> {
  process.stderr.write(
    '[HADI MeetingOps] To disconnect Zoom, revoke access in your Zoom account settings\n' +
    'at https://marketplace.zoom.us/user/installed\n'
  );
}
