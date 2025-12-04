import { Profile } from "@/types/profile";

/**
 * Builds a dynamic system prompt from profile data
 * This context is injected into the LangChain agent to personalize responses
 */
export function buildProfileContext(profile: Profile): string {
  const sections: string[] = [];

  // Base identity
  sections.push(
    `You are an AI assistant for "${profile.name}" on Organically, a social media management platform.`
  );

  // Brand/Personal Description
  if (profile.description) {
    sections.push(`\n## About the Creator\n${profile.description}`);
  }

  // Niche/Categories
  if (profile.niche && profile.niche.length > 0) {
    const nicheLabels = profile.niche.map(formatNicheLabel).join(", ");
    sections.push(`\n## Content Niche\nFocuses on: ${nicheLabels}`);
  }

  // Brand Voice
  if (profile.brandVoice) {
    sections.push(`\n## Brand Voice & Tone\n${profile.brandVoice}`);
  }

  // Values & Mission
  if (profile.valuesMission) {
    sections.push(`\n## Values & Mission\n${profile.valuesMission}`);
  }

  // Platforms
  if (profile.platforms && profile.platforms.length > 0) {
    const platformLabels = profile.platforms
      .map(formatPlatformLabel)
      .join(", ");
    sections.push(`\n## Active Platforms\n${platformLabels}`);
  }

  // Consistency Level
  if (profile.consistencyLevel) {
    const consistencyDescription = getConsistencyDescription(
      profile.consistencyLevel
    );
    sections.push(`\n## Posting Schedule\n${consistencyDescription}`);
  }

  // Target Audience
  if (profile.targetAudience) {
    const audienceDescription = buildAudienceDescription(
      profile.targetAudience
    );
    if (audienceDescription) {
      sections.push(`\n## Target Audience\n${audienceDescription}`);
    }
  }

  // Content Types
  if (profile.contentTypes && profile.contentTypes.length > 0) {
    const contentLabels = profile.contentTypes
      .map(formatContentTypeLabel)
      .join(", ");
    sections.push(`\n## Content Types\nCreates: ${contentLabels}`);
  }

  // Instructions for the AI
  sections.push(`\n## Your Role
You help this creator with:
- Creating and scheduling social media posts tailored to their brand voice
- Generating content ideas aligned with their niche and audience
- Social media strategy recommendations
- Platform-specific best practices

Always consider the creator's brand voice, target audience, and active platforms when providing suggestions.
Be concise, friendly, and actionable.`);

  return sections.join("\n");
}

/**
 * Format niche identifiers to readable labels
 */
function formatNicheLabel(niche: string): string {
  const labels: Record<string, string> = {
    fitness: "Fitness & Health",
    tech: "Technology",
    lifestyle: "Lifestyle",
    business: "Business & Entrepreneurship",
    education: "Education",
    entertainment: "Entertainment",
    food: "Food & Cooking",
    travel: "Travel",
    fashion: "Fashion & Beauty",
    gaming: "Gaming",
    music: "Music",
    art: "Art & Design",
  };
  return labels[niche] || niche;
}

/**
 * Format platform identifiers to readable labels
 */
function formatPlatformLabel(platform: string): string {
  const labels: Record<string, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
    x: "X (Twitter)",
    linkedin: "LinkedIn",
    threads: "Threads",
    facebook: "Facebook",
    pinterest: "Pinterest",
  };
  return labels[platform] || platform;
}

/**
 * Get description for consistency level
 */
function getConsistencyDescription(
  level: "casual" | "steady" | "aggressive"
): string {
  const descriptions: Record<string, string> = {
    casual: "Casual posting (about 3 posts per week)",
    steady: "Steady posting (1-2 posts per day)",
    aggressive: "Aggressive posting (3-6 posts per day)",
  };
  return descriptions[level] || level;
}

/**
 * Format content type identifiers to readable labels
 */
function formatContentTypeLabel(contentType: string): string {
  const labels: Record<string, string> = {
    short_form_video: "Short-form Videos",
    long_form_video: "Long-form Videos",
    stories: "Stories",
    carousels: "Carousels",
    text_posts: "Text Posts",
    podcasts: "Podcasts",
    reels: "Reels",
    live: "Live Streams",
  };
  return labels[contentType] || contentType;
}

/**
 * Build audience description from target audience data
 */
function buildAudienceDescription(targetAudience: {
  ageRanges?: string[];
  genders?: string[];
}): string {
  const parts: string[] = [];

  if (targetAudience.ageRanges && targetAudience.ageRanges.length > 0) {
    const ageLabels: Record<string, string> = {
      gen_z: "Gen Z (18-25)",
      millennials: "Millennials (26-40)",
      gen_x: "Gen X (41-56)",
      boomers: "Boomers (57+)",
    };
    const ages = targetAudience.ageRanges
      .map((age) => ageLabels[age] || age)
      .join(", ");
    parts.push(`Age groups: ${ages}`);
  }

  if (
    targetAudience.genders &&
    targetAudience.genders.length > 0 &&
    !targetAudience.genders.includes("all")
  ) {
    const genderLabels: Record<string, string> = {
      male: "Male",
      female: "Female",
      other: "Other",
    };
    const genders = targetAudience.genders
      .map((g) => genderLabels[g] || g)
      .join(", ");
    parts.push(`Gender focus: ${genders}`);
  }

  return parts.join("\n");
}
