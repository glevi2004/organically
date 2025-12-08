export type PostStatus = "idea" | "draft" | "ready" | "posted";

export type PostPlatform = "instagram";

export type MediaType = "image" | "video";

export interface PostMedia {
  id: string;
  url: string;
  type: MediaType;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  order: number;
  storagePath?: string; // Firebase Storage path for deletion
  duration?: number; // Video duration in seconds
}

// Extended type for local media with File reference (used during upload)
export interface LocalMedia extends PostMedia {
  file?: File; // Original file for upload
  isUploaded?: boolean; // Whether this media has been uploaded to storage
}

export interface Post {
  id: string;
  organizationId: string;
  userId: string;
  content: string; // Markdown content
  platforms: PostPlatform[]; // Instagram only
  status: PostStatus;
  order: number; // Position within the status column
  media?: PostMedia[]; // Media attachments
  scheduledDate?: Date;
  postedDate?: Date;
  hooks?: string[];
  hashtags?: string[];
  createdAt: Date;
  updatedAt: Date;
  // Instagram publishing fields
  instagramMediaId?: string; // Instagram media ID after publishing
  publishedAt?: Date; // When the post was published to Instagram
}

export interface CreatePostInput {
  organizationId: string;
  userId: string;
  content: string; // Markdown content
  platforms: PostPlatform[]; // Instagram only
  status?: PostStatus;
  media?: PostMedia[]; // Media attachments
  scheduledDate?: Date;
  hooks?: string[];
  hashtags?: string[];
}
