import type { ZoomTokens } from '../types.js';
import {
  ZOOM_ACCOUNT_ID,
  ZOOM_CLIENT_ID,
  ZOOM_CLIENT_SECRET,
  ZOOM_TOKEN_URL,
  validateConfig,
} from './constants.js';

// In-memory token cache
let cachedToken: ZoomTokens | null = null;

// Fetch a new access token from Zoom using Server-to-Server OAuth
async function fetchServerToServerToken(): Promise<ZoomTokens> {
  const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString('base64');

  const params = new URLSearchParams();
  params.set('grant_type', 'account_credentials');
  params.set('account_id', ZOOM_ACCOUNT_ID);

  const response = await fetch(ZOOM_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      `Zoom S2S token request failed: ${response.status} ${JSON.stringify(errorData)}`
    );
  }

  const data = (await response.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
  };

  return {
    access_token: data.access_token,
    token_type: data.token_type,
    expires_in: data.expires_in,
    scope: data.scope,
    refresh_token: '', // S2S OAuth has no refresh token
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

function isTokenExpired(tokens: ZoomTokens): boolean {
  if (!tokens.expires_at) return true;
  // Refresh 5 minutes before expiry
  return Date.now() > tokens.expires_at - 5 * 60 * 1000;
}

// Get a valid access token, fetching a new one if expired
export async function getValidAccessToken(): Promise<string> {
  validateConfig();

  if (cachedToken && !isTokenExpired(cachedToken)) {
    return cachedToken.access_token;
  }

  cachedToken = await fetchServerToServerToken();
  return cachedToken.access_token;
}

// No-op: S2S OAuth has no stored tokens to clear
export async function logout(): Promise<void> {
  cachedToken = null;
  console.error('Server-to-Server OAuth does not store tokens. Cache cleared.');
}
