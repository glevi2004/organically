import OAuth from "oauth-1.0a";
import crypto from "crypto";

// Twitter OAuth 1.0a configuration
const TWITTER_API_BASE = "https://api.twitter.com";

// Initialize OAuth 1.0a client
function getOAuthClient() {
  // Support both naming conventions
  const consumerKey = process.env.X_API_KEY!;
  const consumerSecret = process.env.X_API_SECRET!;

  if (!consumerKey || !consumerSecret) {
    throw new Error(
      "Missing Twitter/X credentials. Set X_API_KEY and X_API_SECRET (or TWITTER_CONSUMER_KEY and TWITTER_CONSUMER_SECRET) in environment variables."
    );
  }

  return new OAuth({
    consumer: {
      key: consumerKey,
      secret: consumerSecret,
    },
    signature_method: "HMAC-SHA1",
    hash_function(baseString, key) {
      return crypto.createHmac("sha1", key).update(baseString).digest("base64");
    },
  });
}

// Generate OAuth authorization header
function getAuthHeader(
  oauth: OAuth,
  requestData: { url: string; method: string },
  token?: { key: string; secret: string }
) {
  return oauth.toHeader(oauth.authorize(requestData, token));
}

/**
 * Step 1: Request a request token from Twitter
 * POST oauth/request_token
 */
export async function getRequestToken(callbackUrl: string): Promise<{
  oauth_token: string;
  oauth_token_secret: string;
  oauth_callback_confirmed: string;
}> {
  const oauth = getOAuthClient();
  const url = `${TWITTER_API_BASE}/oauth/request_token`;

  // oauth_callback MUST be included in the data for signature generation
  const requestData = {
    url,
    method: "POST",
    data: {
      oauth_callback: callbackUrl,
    },
  };

  // Generate the authorization header with oauth_callback included in signature
  const authHeader = oauth.toHeader(oauth.authorize(requestData));

  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...authHeader,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Twitter request token error:", errorText);
    throw new Error(`Failed to get request token: ${response.status}`);
  }

  const responseText = await response.text();
  const params = new URLSearchParams(responseText);

  return {
    oauth_token: params.get("oauth_token") || "",
    oauth_token_secret: params.get("oauth_token_secret") || "",
    oauth_callback_confirmed: params.get("oauth_callback_confirmed") || "",
  };
}

/**
 * Step 2: Generate the authorization URL to redirect the user
 * GET oauth/authorize
 */
export function getAuthorizationUrl(oauthToken: string): string {
  return `${TWITTER_API_BASE}/oauth/authorize?oauth_token=${oauthToken}`;
}

/**
 * Step 3: Exchange the request token for an access token
 * POST oauth/access_token
 */
export async function getAccessToken(
  oauthToken: string,
  oauthTokenSecret: string,
  oauthVerifier: string
): Promise<{
  oauth_token: string;
  oauth_token_secret: string;
  user_id: string;
  screen_name: string;
}> {
  const oauth = getOAuthClient();
  const url = `${TWITTER_API_BASE}/oauth/access_token`;

  const requestData = {
    url,
    method: "POST",
  };

  const token = {
    key: oauthToken,
    secret: oauthTokenSecret,
  };

  const authHeader = getAuthHeader(oauth, requestData, token);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      ...authHeader,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `oauth_verifier=${encodeURIComponent(oauthVerifier)}`,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Twitter access token error:", errorText);
    throw new Error(`Failed to get access token: ${response.status}`);
  }

  const responseText = await response.text();
  const params = new URLSearchParams(responseText);

  return {
    oauth_token: params.get("oauth_token") || "",
    oauth_token_secret: params.get("oauth_token_secret") || "",
    user_id: params.get("user_id") || "",
    screen_name: params.get("screen_name") || "",
  };
}

/**
 * Verify credentials - Get the authenticated user's info
 * GET account/verify_credentials
 */
export async function verifyCredentials(
  accessToken: string,
  accessTokenSecret: string
): Promise<{
  id_str: string;
  name: string;
  screen_name: string;
  profile_image_url_https: string;
}> {
  const oauth = getOAuthClient();
  const url = `${TWITTER_API_BASE}/1.1/account/verify_credentials.json`;

  const requestData = {
    url,
    method: "GET",
  };

  const token = {
    key: accessToken,
    secret: accessTokenSecret,
  };

  const authHeader = getAuthHeader(oauth, requestData, token);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...authHeader,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Twitter verify credentials error:", errorText);
    throw new Error(`Failed to verify credentials: ${response.status}`);
  }

  return response.json();
}

/**
 * Helper to make authenticated Twitter API requests (OAuth 1.0a)
 * Tokens should be plain text (already decrypted)
 */
export async function makeAuthenticatedRequest(
  url: string,
  method: "GET" | "POST" | "DELETE",
  accessToken: string,
  accessTokenSecret: string,
  body?: Record<string, unknown>
): Promise<Response> {
  const oauth = getOAuthClient();

  const requestData = {
    url,
    method,
  };

  const token = {
    key: accessToken,
    secret: accessTokenSecret,
  };

  const authHeader = getAuthHeader(oauth, requestData, token);

  const headers: Record<string, string> = {
    ...authHeader,
  };

  if (body) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper to make authenticated request with encrypted tokens
 * This decrypts the tokens before making the request
 */
export async function makeAuthenticatedRequestWithEncryptedTokens(
  url: string,
  method: "GET" | "POST" | "DELETE",
  encryptedAccessToken: string,
  encryptedAccessTokenSecret: string,
  body?: Record<string, unknown>
): Promise<Response> {
  // Import decrypt dynamically to avoid client-side issues
  const { decrypt } = await import("@/lib/encryption");

  const accessToken = decrypt(encryptedAccessToken);
  const accessTokenSecret = decrypt(encryptedAccessTokenSecret);

  return makeAuthenticatedRequest(
    url,
    method,
    accessToken,
    accessTokenSecret,
    body
  );
}
