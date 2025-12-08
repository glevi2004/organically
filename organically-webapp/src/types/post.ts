export type PostStatus = "idea" | "draft" | "ready" | "posted";

export type PostType = "reel" | "carousel" | "story" | "post";

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
}

export interface Post {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  content: string; // Markdown content
  platforms: PostPlatform[]; // Instagram only
  type?: PostType; // Optional post type
  status: PostStatus;
  order: number; // Position within the status column
  media?: PostMedia[]; // Media attachments
  scheduledDate?: Date;
  postedDate?: Date;
  hooks?: string[];
  hashtags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostInput {
  organizationId: string;
  userId: string;
  title: string;
  content: string; // Markdown content
  platforms: PostPlatform[]; // Instagram only
  type?: PostType; // Optional post type
  status?: PostStatus;
  media?: PostMedia[]; // Media attachments
  scheduledDate?: Date;
  hooks?: string[];
  hashtags?: string[];
}
