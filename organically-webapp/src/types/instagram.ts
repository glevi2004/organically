// ============================================================================
// Instagram API Types
// ============================================================================

/**
 * Instagram user profile information
 */
export interface InstagramProfile {
  id: string;
  username: string;
  account_type: "PERSONAL" | "CREATOR" | "BUSINESS";
  media_count?: number;
}

/**
 * Instagram media item (post/reel)
 */
export interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}

/**
 * Paginated response for Instagram media
 */
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

// ============================================================================
// Content Publishing Types
// ============================================================================

/**
 * Status of a media container during publishing
 */
export type ContainerStatus =
  | "EXPIRED"
  | "ERROR"
  | "FINISHED"
  | "IN_PROGRESS"
  | "PUBLISHED";

/**
 * Response when creating a media container
 */
export interface ContainerResponse {
  id: string;
}

/**
 * Response when checking container status
 */
export interface ContainerStatusResponse {
  status_code: ContainerStatus;
  id: string;
}

/**
 * Response when publishing media
 */
export interface PublishResponse {
  id: string;
}

// ============================================================================
// Comment & Messaging Types
// ============================================================================

/**
 * Instagram comment details
 */
export interface InstagramComment {
  id: string;
  text: string;
  timestamp: string;
  username?: string;
  from?: {
    id: string;
    username: string;
  };
  media?: {
    id: string;
  };
}

/**
 * Response when replying to a comment
 */
export interface CommentReplyResponse {
  id: string;
}

/**
 * Response when sending a message
 */
export interface MessageResponse {
  recipient_id: string;
  message_id: string;
}

// ============================================================================
// Webhook Payload Types
// ============================================================================

/**
 * Top-level Instagram webhook payload from Meta
 */
export interface InstagramWebhookPayload {
  object: "instagram";
  entry?: WebhookEntry[];
}

/**
 * Individual entry in the webhook payload
 */
export interface WebhookEntry {
  id: string; // Instagram account ID
  time: number;
  changes?: WebhookChange[];
  messaging?: MessagingWebhookEntry[];
}

/**
 * Change notification (for comments, mentions, etc.)
 */
export interface WebhookChange {
  field: "comments" | "mentions" | "story_insights";
  value: CommentWebhookValue;
}

/**
 * Comment webhook value details
 */
export interface CommentWebhookValue {
  id?: string;
  text?: string;
  from?: {
    id: string;
    username: string;
  };
  media?: {
    id: string;
  };
  parent_id?: string; // If this is a reply to another comment
}

/**
 * Messaging webhook entry
 */
export interface MessagingWebhookEntry {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    is_echo?: boolean; // True if this message was sent by us (to prevent loops)
    is_deleted?: boolean; // True if this is an unsend notification
    attachments?: Array<{
      type: string;
      payload: { url: string };
    }>;
  };
}

// ============================================================================
// Inngest Event Types
// ============================================================================

/**
 * Data payload for instagram/webhook.received Inngest event
 */
export interface InstagramWebhookEventData {
  type: "comment" | "message";
  organizationId: string;
  channelId: string;
  senderId: string;
  senderUsername: string;
  text: string;
  commentId?: string;
  mediaId?: string;
  timestamp: number;
}

/**
 * Simplified automation data for Inngest processing
 * Uses a simplified type because Inngest requires JSON-serializable data
 */
export interface AutomationProcessingData {
  id: string;
  channelId: string;
  isActive: boolean;
  nodes: Array<{
    id: string;
    type: string;
    data: Record<string, unknown>;
  }>;
}

