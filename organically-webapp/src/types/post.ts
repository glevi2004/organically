export type PostStatus = "idea" | "draft" | "ready" | "posted";

export type PostType = "short-video" | "long-video" | "thread";

export type PostPlatform =
  | "instagram"
  | "tiktok"
  | "youtube"
  | "x"
  | "linkedin";

export interface Post {
  id: string;
  profileId: string;
  userId: string;
  title: string;
  content: string; // Markdown content
  platforms: PostPlatform[]; // Multiple platforms (required, min 1)
  type?: PostType; // Optional post type
  status: PostStatus;
  order: number; // Position within the status column
  scheduledDate?: Date;
  postedDate?: Date;
  hooks?: string[];
  hashtags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostInput {
  profileId: string;
  userId: string;
  title: string;
  content: string; // Markdown content
  platforms: PostPlatform[]; // Multiple platforms (required, min 1)
  type?: PostType; // Optional post type
  status?: PostStatus;
  scheduledDate?: Date;
  hooks?: string[];
  hashtags?: string[];
}
