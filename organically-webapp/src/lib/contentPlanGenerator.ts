import { Workspace } from "@/types/workspace";
import { Timestamp } from "firebase/firestore";

interface ContentPlan {
  generated: boolean;
  generatedAt: Timestamp;
  strategy: string;
  suggestedTopics: string[];
  contentPillars: string[];
}

/**
 * Generate a content plan based on workspace onboarding data
 * This is a rule-based system that will be replaced with AI in the future
 */
export function generateContentPlan(workspace: Workspace): ContentPlan {
  const contentPillars = generateContentPillars(workspace);
  const suggestedTopics = generateTopicIdeas(workspace, contentPillars);
  const strategy = generateStrategy(workspace);

  return {
    generated: true,
    generatedAt: Timestamp.now(),
    strategy,
    suggestedTopics,
    contentPillars,
  };
}

/**
 * Generate 3-5 content pillars based on themes and goals
 */
function generateContentPillars(workspace: Workspace): string[] {
  const pillars: string[] = [];
  
  // Use content themes as primary pillars
  if (workspace.contentThemes && workspace.contentThemes.length > 0) {
    pillars.push(...workspace.contentThemes.slice(0, 3));
  }
  
  // Add goal-based pillars if we don't have enough
  if (pillars.length < 3 && workspace.growthGoals) {
    if (workspace.growthGoals.includes("engagement")) {
      pillars.push("Community Engagement");
    }
    if (workspace.growthGoals.includes("brand_awareness") && pillars.length < 3) {
      pillars.push("Brand Stories");
    }
    if (workspace.growthGoals.includes("sales") && pillars.length < 3) {
      pillars.push("Product Showcases");
    }
  }
  
  // Add audience pain point pillars
  if (pillars.length < 3 && workspace.targetAudience?.painPoints && workspace.targetAudience.painPoints.length > 0) {
    pillars.push(`Solving: ${workspace.targetAudience.painPoints[0]}`);
  }
  
  // Default pillars if still empty
  if (pillars.length === 0) {
    pillars.push("Educational Content", "Behind the Scenes", "Community Building");
  }
  
  return pillars.slice(0, 5);
}

/**
 * Generate 10-15 topic ideas based on workspace data
 */
function generateTopicIdeas(workspace: Workspace, pillars: string[]): string[] {
  const topics: string[] = [];
  
  // Generate topics from content formats
  if (workspace.contentFormats) {
    if (workspace.contentFormats.includes("educational")) {
      topics.push(
        `How to get started with ${workspace.contentThemes?.[0] || "your niche"}`,
        `Top 5 mistakes to avoid in ${workspace.contentThemes?.[0] || "your field"}`,
        `Beginner's guide to ${workspace.contentThemes?.[0] || "success"}`
      );
    }
    if (workspace.contentFormats.includes("inspirational")) {
      topics.push(
        "My journey and lessons learned",
        "Overcoming challenges in the industry",
        "Success stories from the community"
      );
    }
    if (workspace.contentFormats.includes("behind_scenes")) {
      topics.push(
        "A day in the life",
        "How I create content",
        "Tools and resources I use daily"
      );
    }
  }
  
  // Generate topics from growth goals
  if (workspace.growthGoals) {
    if (workspace.growthGoals.includes("engagement")) {
      topics.push(
        "Q&A session with my audience",
        "Poll: What content do you want to see?",
        "Community spotlight features"
      );
    }
    if (workspace.growthGoals.includes("sales")) {
      topics.push(
        "Product/service benefits breakdown",
        "Customer success stories",
        "Before & after transformations"
      );
    }
  }
  
  // Generate topics from platforms
  if (workspace.platforms) {
    if (workspace.platforms.includes("instagram") || workspace.platforms.includes("tiktok")) {
      topics.push(
        "Trending audio/challenge participation",
        "Quick tips in 60 seconds",
        "Behind-the-scenes reels"
      );
    }
    if (workspace.platforms.includes("youtube")) {
      topics.push(
        "In-depth tutorial series",
        "Weekly Q&A videos",
        "Product/tool reviews"
      );
    }
  }
  
  // Add pillar-based topics
  pillars.forEach((pillar) => {
    topics.push(`${pillar}: Weekly roundup`, `${pillar}: Expert tips`);
  });
  
  // Remove duplicates and limit
  return [...new Set(topics)].slice(0, 15);
}

/**
 * Generate a content strategy summary
 */
function generateStrategy(workspace: Workspace): string {
  const parts: string[] = [];
  
  // Opening
  parts.push(`Welcome to your personalized content strategy for ${workspace.name}!`);
  parts.push("");
  
  // Project type context
  if (workspace.projectType) {
    const projectTypeLabels: Record<string, string> = {
      personal_brand: "personal brand",
      business: "business",
      agency: "agency",
      creator: "content creation journey",
      nonprofit: "nonprofit mission",
      other: "project",
    };
    parts.push(`As a ${projectTypeLabels[workspace.projectType] || "creator"}, your content will focus on building authentic connections and delivering value.`);
    parts.push("");
  }
  
  // Platform strategy
  if (workspace.platforms && workspace.platforms.length > 0) {
    parts.push(`**Platform Focus:**`);
    parts.push(`You'll be creating content for ${workspace.platforms.length} platform${workspace.platforms.length > 1 ? "s" : ""}: ${workspace.platforms.join(", ")}.`);
    if (workspace.primaryPlatform) {
      parts.push(`Your primary focus will be on ${workspace.primaryPlatform}, where you'll post most frequently.`);
    }
    parts.push("");
  }
  
  // Content types
  if (workspace.contentTypes && workspace.contentTypes.length > 0) {
    parts.push(`**Content Types:**`);
    parts.push(`Mix of ${workspace.contentTypes.join(", ")} to keep your audience engaged.`);
    parts.push("");
  }
  
  // Brand voice
  if (workspace.brandVoice) {
    const voiceLabels: Record<string, string> = {
      professional: "professional and authoritative",
      casual: "casual and friendly",
      humorous: "fun and entertaining",
      inspirational: "motivating and uplifting",
      educational: "informative and teaching-focused",
    };
    parts.push(`**Brand Voice:**`);
    parts.push(`Maintain a ${voiceLabels[workspace.brandVoice] || "authentic"} tone across all content.`);
    parts.push("");
  }
  
  // Goals
  if (workspace.growthGoals && workspace.growthGoals.length > 0) {
    parts.push(`**Growth Goals:**`);
    workspace.growthGoals.forEach((goal) => {
      const goalLabels: Record<string, string> = {
        followers: "Grow your follower base",
        engagement: "Increase audience engagement",
        brand_awareness: "Build brand awareness",
        sales: "Drive sales and conversions",
        leads: "Generate quality leads",
        community: "Build a strong community",
      };
      parts.push(`• ${goalLabels[goal] || goal}`);
    });
    parts.push("");
  }
  
  // Posting frequency
  if (workspace.postingFrequency && Object.keys(workspace.postingFrequency).length > 0) {
    parts.push(`**Posting Schedule:**`);
    Object.entries(workspace.postingFrequency).forEach(([platform, frequency]) => {
      if (frequency > 0) {
        parts.push(`• ${platform}: ${frequency} post${frequency > 1 ? "s" : ""} per week`);
      }
    });
    parts.push("");
  }
  
  // Next steps
  parts.push(`**Next Steps:**`);
  parts.push(`1. Review the suggested content pillars and topics below`);
  parts.push(`2. Start creating your first pieces of content`);
  parts.push(`3. Use the calendar to schedule your posts`);
  parts.push(`4. Track your analytics to see what resonates`);
  
  return parts.join("\n");
}

