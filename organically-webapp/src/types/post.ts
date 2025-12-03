export type PostStatus = "idea" | "draft" | "ready" | "posted";

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
  content: string;
  platform: PostPlatform;
  status: PostStatus;
  scheduledDate?: Date;
  postedDate?: Date;
  hooks?: string[];
  hashtags?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostInput {
  profileId: string;
  userId: string;
  title: string;
  content: string;
  platform: PostPlatform;
  status?: PostStatus;
  scheduledDate?: Date;
  hooks?: string[];
  hashtags?: string[];
  notes?: string;
}
