import { Timestamp } from "firebase/firestore";

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon: string; // emoji
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Onboarding completion tracking
  onboardingCompleted: boolean;
  onboardingStep: number; // Track progress (0-8)
  
  // Step 2: Project Type
  projectType?: 'personal_brand' | 'business' | 'agency' | 'creator' | 'nonprofit' | 'other';
  projectTypeOther?: string;
  
  // Step 3: Platforms
  platforms?: string[]; // ['instagram', 'tiktok', 'youtube', 'x', 'linkedin']
  primaryPlatform?: string;
  
  // Step 4: Growth Goals
  growthGoals?: string[]; // ['followers', 'engagement', 'brand_awareness', 'sales', 'leads', 'community']
  followerGoal?: string; // '1k', '10k', '100k', '1m', 'custom'
  timeframe?: string; // '3_months', '6_months', '1_year', 'no_rush'
  
  // Step 5: Content Types
  contentTypes?: string[]; // ['short_form', 'long_form', 'reels', 'stories', 'carousels', 'live', 'threads']
  contentFormats?: string[]; // ['educational', 'entertaining', 'inspirational', 'promotional', 'behind_scenes']
  
  // Step 6: Target Audience
  targetAudience?: {
    ageRange?: string; // '18-24', '25-34', '35-44', '45-54', '55+'
    gender?: string; // 'all', 'male', 'female', 'non_binary'
    interests?: string[];
    painPoints?: string[];
  };
  
  // Step 7: Content Themes
  contentThemes?: string[]; // Topics/niches the workspace will cover
  brandVoice?: string; // 'professional', 'casual', 'humorous', 'inspirational', 'educational'
  
  // Step 8: Posting Schedule
  postingFrequency?: {
    instagram?: number; // posts per week
    tiktok?: number;
    youtube?: number;
    x?: number;
    linkedin?: number;
  };
  preferredPostingTimes?: string[]; // ['morning', 'afternoon', 'evening', 'night']
  
  // Generated content plan (from AI)
  initialContentPlan?: {
    generated: boolean;
    generatedAt?: Timestamp;
    strategy?: string;
    suggestedTopics?: string[];
    contentPillars?: string[];
  };
}

