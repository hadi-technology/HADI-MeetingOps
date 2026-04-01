// User OAuth Configuration
// ZOOM_USER_ID: your Zoom user ID (shown after visiting ZOOM_AUTH_URL/zoom/authorize)
// ZOOM_AUTH_URL: base URL of the HADI Auth Worker

export const ZOOM_USER_ID = process.env.ZOOM_USER_ID || '';
export const ZOOM_AUTH_URL = process.env.ZOOM_AUTH_URL || 'https://auth.haditechnology.com';

export const ZOOM_API_BASE_URL = 'https://api.zoom.us/v2';

/**
 * Validate that required env vars are present before the first token fetch.
 */
export function validateConfig(): void {
  if (!ZOOM_USER_ID) {
    const authorizeUrl = `${ZOOM_AUTH_URL}/zoom/authorize`;
    throw new Error(
      `Missing required environment variable: ZOOM_USER_ID.\n` +
      `1. Open this URL in your browser to connect your Zoom account:\n   ${authorizeUrl}\n` +
      `2. Copy the Zoom User ID shown on the success page.\n` +
      `3. Add ZOOM_USER_ID to your MCP server config and restart.`
    );
  }
}

// Kept for token-store compatibility
export const KEYCHAIN_SERVICE = 'zoom-mcp';
export const KEYCHAIN_ACCOUNT = 'oauth-tokens';
export const CONFIG_DIR = '.config/zoom-mcp';
export const TOKENS_FILE = 'tokens.json';
