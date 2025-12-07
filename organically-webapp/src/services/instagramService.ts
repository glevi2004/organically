// Instagram Graph API Service
// Docs: https://developers.facebook.com/docs/instagram-basic-display-api

import { decryptToken } from "@/lib/encryption";
import { Channel } from "@/types/organization";

const INSTAGRAM_GRAPH_URL = "https://graph.instagram.com";

export interface InstagramProfile {
  id: string;
  username: string;
  account_type: "PERSONAL" | "CREATOR" | "BUSINESS";
  media_count?: number;
}

export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}

export interface InstagramMediaResponse {
  data: InstagramMedia[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

/**
 * Get the decrypted access token from a channel
 */
function getAccessToken(channel: Channel): string {
  if (!channel.accessToken) {
    throw new Error("Channel has no access token");
  }
  return decryptToken(channel.accessToken);
}

/**
 * Check if the token is expired or about to expire (within 7 days)
 */
export function isTokenExpiring(channel: Channel, daysThreshold = 7): boolean {
  if (!channel.tokenExpiresAt) return true;

  let expiresAt: Date;

  if (channel.tokenExpiresAt instanceof Date) {
    expiresAt = channel.tokenExpiresAt;
  } else if (typeof channel.tokenExpiresAt === "number") {
    expiresAt = new Date(channel.tokenExpiresAt);
  } else if (
    typeof channel.tokenExpiresAt === "object" &&
    "toDate" in channel.tokenExpiresAt
  ) {
    // Firebase Timestamp
    expiresAt = channel.tokenExpiresAt.toDate();
  } else {
    return true; // Unknown format, assume expiring
  }

  const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;
  return expiresAt.getTime() - Date.now() < thresholdMs;
}

/**
 * Get the Instagram user profile
 */
export async function getInstagramProfile(
  channel: Channel
): Promise<InstagramProfile> {
  const accessToken = getAccessToken(channel);

  const response = await fetch(
    `${INSTAGRAM_GRAPH_URL}/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("Instagram API error:", error);
    throw new Error(
      error.error?.message || "Failed to fetch Instagram profile"
    );
  }

  return response.json();
}

/**
 * Get user's Instagram media/posts
 */
export async function getInstagramMedia(
  channel: Channel,
  limit = 10,
  after?: string
): Promise<InstagramMediaResponse> {
  const accessToken = getAccessToken(channel);

  let url = `${INSTAGRAM_GRAPH_URL}/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=${limit}&access_token=${accessToken}`;

  if (after) {
    url += `&after=${after}`;
  }

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    console.error("Instagram API error:", error);
    throw new Error(error.error?.message || "Failed to fetch Instagram media");
  }

  return response.json();
}

/**
 * Get a specific media item by ID
 */
export async function getInstagramMediaById(
  channel: Channel,
  mediaId: string
): Promise<InstagramMedia> {
  const accessToken = getAccessToken(channel);

  const response = await fetch(
    `${INSTAGRAM_GRAPH_URL}/${mediaId}?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("Instagram API error:", error);
    throw new Error(error.error?.message || "Failed to fetch Instagram media");
  }

  return response.json();
}

/**
 * Refresh a long-lived token (must be done before it expires)
 * Long-lived tokens are valid for 60 days
 * Can only refresh tokens that are at least 24 hours old
 */
export async function refreshInstagramToken(channel: Channel): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {
  const accessToken = getAccessToken(channel);

  const response = await fetch(
    `${INSTAGRAM_GRAPH_URL}/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("Instagram token refresh error:", error);
    throw new Error(
      error.error?.message || "Failed to refresh Instagram token"
    );
  }

  return response.json();
}

/**
 * Verify if a token is still valid
 */
export async function verifyInstagramToken(channel: Channel): Promise<boolean> {
  try {
    await getInstagramProfile(channel);
    return true;
  } catch {
    return false;
  }
}
