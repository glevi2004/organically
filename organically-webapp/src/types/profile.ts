import { Timestamp } from "firebase/firestore";

export interface Profile {
  id: string;
  name: string;
  imageUrl?: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Onboarding completion tracking
  onboardingCompleted: boolean;
  onboardingStep: number; // Track progress (0-5)

  // Step 2: Platforms (multi-select)
  platforms?: string[]; // ['instagram', 'tiktok', 'youtube', 'x', 'linkedin', 'threads']

  // Step 3: Consistency Level
  consistencyLevel?: "casual" | "steady" | "aggressive"; // casual = 3/week, steady = 1-2/day, aggressive = 3-6/day

  // Step 4: Audience
  targetAudience?: {
    ageRanges?: string[]; // ['gen_z', 'millennials', 'gen_x', 'boomers']
    genders?: string[]; // ['all', 'male', 'female', 'other']
  };

  // Step 5: Content Types
  contentTypes?: string[]; // ['short_form_video', 'long_form_video', 'stories', 'carousels', 'text_posts', 'podcasts']
}
