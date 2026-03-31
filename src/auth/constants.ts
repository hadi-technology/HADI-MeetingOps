// Server-to-Server OAuth Configuration
// All values come from the Zoom Server-to-Server OAuth app in Zoom Marketplace.

export const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID || '';
export const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID || '';
export const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET || '';

export const ZOOM_TOKEN_URL = 'https://zoom.us/oauth/token';
export const ZOOM_API_BASE_URL = 'https://api.zoom.us/v2';

/**
 * Validate that all required Server-to-Server OAuth credentials are present.
 * Called before the first token fetch, not at import time.
 */
export function validateConfig(): void {
  const missing: string[] = [];
  if (!ZOOM_ACCOUNT_ID) missing.push('ZOOM_ACCOUNT_ID');
  if (!ZOOM_CLIENT_ID) missing.push('ZOOM_CLIENT_ID');
  if (!ZOOM_CLIENT_SECRET) missing.push('ZOOM_CLIENT_SECRET');
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      'Set these from your Zoom Server-to-Server OAuth app in the Zoom Marketplace.'
    );
  }
}

// Keychain constants kept for token-store compatibility (token-store is no longer used
// by S2S auth but may still be imported elsewhere)
export const KEYCHAIN_SERVICE = 'zoom-mcp';
export const KEYCHAIN_ACCOUNT = 'oauth-tokens';
export const CONFIG_DIR = '.config/zoom-mcp';
export const TOKENS_FILE = 'tokens.json';
