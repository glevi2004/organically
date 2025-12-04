import { PostType, PostPlatform } from "@/types/post";

export const POST_TYPES: Array<{
  id: PostType;
  label: string;
  description: string;
}> = [
  {
    id: "short-video",
    label: "Short Video",
    description: "TikToks, Reels, Shorts",
  },
  {
    id: "long-video",
    label: "Long Video",
    description: "YouTube videos, tutorials",
  },
  {
    id: "thread",
    label: "Thread",
    description: "Twitter/X or LinkedIn threads",
  },
];

const ALL_PLATFORMS: PostPlatform[] = [
  "instagram",
  "tiktok",
  "youtube",
  "x",
  "linkedin",
];

const THREAD_PLATFORMS: PostPlatform[] = ["x", "linkedin"];

/**
 * Get allowed platforms for a given post type
 * @param type - The post type, or undefined for default (all platforms)
 * @returns Array of allowed platforms
 */
export function getAllowedPlatformsForType(
  type: PostType | undefined
): PostPlatform[] {
  if (!type) {
    return ALL_PLATFORMS;
  }

  switch (type) {
    case "thread":
      return THREAD_PLATFORMS;
    case "short-video":
    case "long-video":
      return ALL_PLATFORMS;
    default:
      return ALL_PLATFORMS;
  }
}

