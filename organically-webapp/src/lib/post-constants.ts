import { PostType, PostPlatform } from "@/types/post";

export const POST_TYPES: Array<{
  id: PostType;
  label: string;
  description: string;
}> = [
  {
    id: "reel",
    label: "Reel",
    description: "Short-form vertical video",
  },
  {
    id: "carousel",
    label: "Carousel",
    description: "Multi-image swipeable post",
  },
  {
    id: "story",
    label: "Story",
    description: "24-hour temporary content",
  },
  {
    id: "post",
    label: "Post",
    description: "Single image or video post",
  },
];

const ALL_PLATFORMS: PostPlatform[] = ["instagram"];

/**
 * Get allowed platforms for a given post type
 * @param type - The post type, or undefined for default (all platforms)
 * @returns Array of allowed platforms
 */
export function getAllowedPlatformsForType(
  type: PostType | undefined
): PostPlatform[] {
  // All post types are for Instagram
  return ALL_PLATFORMS;
}
