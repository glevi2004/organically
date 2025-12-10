// Instagram Graph API Service
// Docs: https://developers.facebook.com/docs/instagram-basic-display-api

import { decryptToken } from "@/lib/encryption";
import { Channel } from "@/types/organization";
import {
  InstagramProfile,
  InstagramMedia,
  InstagramMediaResponse,
  ContainerStatus,
  ContainerResponse,
  ContainerStatusResponse,
  PublishResponse,
  InstagramComment,
  CommentReplyResponse,
  MessageResponse,
} from "@/types/instagram";

// Re-export types for backwards compatibility
export type {
  InstagramProfile,
  InstagramMedia,
  InstagramMediaResponse,
  ContainerStatus,
  ContainerResponse,
  ContainerStatusResponse,
  PublishResponse,
  InstagramComment,
  CommentReplyResponse,
  MessageResponse,
};

const INSTAGRAM_GRAPH_URL = "https://graph.instagram.com";

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

// ============================================
// Content Publishing API
// Docs: https://developers.facebook.com/docs/instagram-platform/content-publishing
// ============================================

/**
 * Create a media container for a single image post
 */
export async function createImageContainer(
  accessToken: string,
  igUserId: string,
  imageUrl: string,
  caption?: string
): Promise<ContainerResponse> {
  const body: Record<string, string> = {
    image_url: imageUrl,
  };

  if (caption) {
    body.caption = caption;
  }

  const response = await fetch(`${INSTAGRAM_GRAPH_URL}/${igUserId}/media`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Instagram create image container error:", error);
    throw new Error(
      error.error?.error_user_msg ||
        "The media is not ready for publishing, please wait for a moment"
    );
  }

  return response.json();
}

/**
 * Create a media container for a video/reel post
 */
export async function createVideoContainer(
  accessToken: string,
  igUserId: string,
  videoUrl: string,
  caption?: string,
  mediaType: "REELS" | "VIDEO" = "REELS"
): Promise<ContainerResponse> {
  const body: Record<string, string> = {
    video_url: videoUrl,
    media_type: mediaType,
  };

  if (caption) {
    body.caption = caption;
  }

  const response = await fetch(`${INSTAGRAM_GRAPH_URL}/${igUserId}/media`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Instagram create video container error:", error);
    throw new Error(
      error.error?.error_user_msg ||
        "The media is not ready for publishing, please wait for a moment"
    );
  }

  return response.json();
}

/**
 * Create a carousel item container (for images in a carousel)
 * Note: Carousel items don't have captions - caption goes on the carousel container
 */
export async function createCarouselItemContainer(
  accessToken: string,
  igUserId: string,
  mediaUrl: string,
  mediaType: "image" | "video"
): Promise<ContainerResponse> {
  const body: Record<string, string | boolean> = {
    is_carousel_item: true,
  };

  if (mediaType === "image") {
    body.image_url = mediaUrl;
  } else {
    body.video_url = mediaUrl;
    body.media_type = "VIDEO";
  }

  const response = await fetch(`${INSTAGRAM_GRAPH_URL}/${igUserId}/media`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Instagram create carousel item error:", error);
    throw new Error(
      error.error?.error_user_msg ||
        "The media is not ready for publishing, please wait for a moment"
    );
  }

  return response.json();
}

/**
 * Create a carousel container with multiple media items
 */
export async function createCarouselContainer(
  accessToken: string,
  igUserId: string,
  childrenIds: string[],
  caption?: string
): Promise<ContainerResponse> {
  const body: Record<string, string> = {
    media_type: "CAROUSEL",
    children: childrenIds.join(","),
  };

  if (caption) {
    body.caption = caption;
  }

  const response = await fetch(`${INSTAGRAM_GRAPH_URL}/${igUserId}/media`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Instagram create carousel container error:", error);
    throw new Error(
      error.error?.error_user_msg ||
        "The media is not ready for publishing, please wait for a moment"
    );
  }

  return response.json();
}

/**
 * Check the status of a media container (useful for video processing)
 */
export async function checkContainerStatus(
  accessToken: string,
  containerId: string
): Promise<ContainerStatusResponse> {
  const response = await fetch(
    `${INSTAGRAM_GRAPH_URL}/${containerId}?fields=status_code`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("Instagram check container status error:", error);
    throw new Error(
      error.error?.error_user_msg ||
        "The media is not ready for publishing, please wait for a moment"
    );
  }

  return response.json();
}

/**
 * Wait for a container to be ready (polls status until FINISHED or error)
 * Recommended: poll once per minute for up to 5 minutes
 */
export async function waitForContainerReady(
  accessToken: string,
  containerId: string,
  maxAttempts = 10,
  intervalMs = 30000 // 30 seconds
): Promise<ContainerStatusResponse> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await checkContainerStatus(accessToken, containerId);

    if (status.status_code === "FINISHED") {
      return status;
    }

    if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
      throw new Error(`Container failed with status: ${status.status_code}`);
    }

    // Wait before next attempt
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  throw new Error("Container processing timed out");
}

/**
 * Publish a media container to Instagram
 */
export async function publishMediaContainer(
  accessToken: string,
  igUserId: string,
  containerId: string
): Promise<PublishResponse> {
  const response = await fetch(
    `${INSTAGRAM_GRAPH_URL}/${igUserId}/media_publish`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        creation_id: containerId,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("Instagram publish error:", error);
    throw new Error(
      error.error?.error_user_msg ||
        "The media is not ready for publishing, please wait for a moment"
    );
  }

  return response.json();
}

/**
 * Check the publishing rate limit for an account
 * Instagram accounts are limited to 100 API-published posts within a 24-hour period
 */
export async function checkPublishingLimit(
  accessToken: string,
  igUserId: string
): Promise<{ quota_usage: number; config: { quota_total: number } }> {
  const response = await fetch(
    `${INSTAGRAM_GRAPH_URL}/${igUserId}/content_publishing_limit`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("Instagram rate limit check error:", error);
    throw new Error(error.error?.message || "Failed to check publishing limit");
  }

  return response.json();
}

// ============================================
// Comment & Messaging API
// Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
// ============================================

/**
 * Get details of a specific comment
 */
export async function getComment(
  accessToken: string,
  commentId: string
): Promise<InstagramComment> {
  const response = await fetch(
    `${INSTAGRAM_GRAPH_URL}/${commentId}?fields=id,text,timestamp,username,from{id,username},media{id}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("Instagram get comment error:", error);
    throw new Error(error.error?.message || "Failed to get comment");
  }

  return response.json();
}

/**
 * Reply to a comment (public - visible on the post)
 * Uses POST /{comment-id}/replies
 */
export async function replyToComment(
  accessToken: string,
  commentId: string,
  message: string
): Promise<CommentReplyResponse> {
  const response = await fetch(`${INSTAGRAM_GRAPH_URL}/${commentId}/replies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      message,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Instagram reply to comment error:", error);
    throw new Error(error.error?.message || "Failed to reply to comment");
  }

  return response.json();
}

/**
 * Send a private reply to a commenter (DM with comment context)
 * This sends a DM to the user who left a comment
 * Uses POST /{ig-user-id}/messages with recipient.comment_id
 */
export async function sendPrivateReply(
  accessToken: string,
  igUserId: string,
  commentId: string,
  message: string
): Promise<MessageResponse> {
  const response = await fetch(`${INSTAGRAM_GRAPH_URL}/${igUserId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      recipient: {
        comment_id: commentId,
      },
      message: {
        text: message,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Instagram send private reply error:", error);
    throw new Error(error.error?.message || "Failed to send private reply");
  }

  return response.json();
}

/**
 * Send a direct message to a user
 * Uses POST /{ig-user-id}/messages with recipient.id
 */
export async function sendDirectMessage(
  accessToken: string,
  igUserId: string,
  recipientId: string,
  message: string
): Promise<MessageResponse> {
  const response = await fetch(`${INSTAGRAM_GRAPH_URL}/${igUserId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      recipient: {
        id: recipientId,
      },
      message: {
        text: message,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error("Instagram send DM error:", error);
    throw new Error(error.error?.message || "Failed to send direct message");
  }

  return response.json();
}
