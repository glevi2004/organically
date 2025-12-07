import { Timestamp } from "firebase/firestore";

// Channel provider types - Instagram only
export type ChannelProvider = "instagram";

// Base channel interface - all channels have these fields
export interface BaseChannel {
  id: string; // Unique channel ID (generated)
  provider: ChannelProvider;
  label?: string; // User-defined label (e.g., "Personal", "Business")
  connectedAt: number;
  isActive: boolean; // For enabling/disabling without deletion
}

// Instagram-specific channel data
export interface InstagramChannel extends BaseChannel {
  provider: "instagram";
  accessToken: string; // Encrypted
  providerAccountId: string; // Instagram Business Account ID
  facebookPageId: string;
  username: string;
  displayName?: string | null;
  profileImageUrl?: string | null;
  expiresAt: number;
}

// Union type for all channels (Instagram only for now)
export type Channel = InstagramChannel;

// Helper type for creating new channels (without id, which is generated)
export type NewInstagramChannel = Omit<InstagramChannel, "id">;
export type NewChannel = Omit<Channel, "id">;

export interface Organization {
  id: string;
  name: string;
  imageUrl?: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Onboarding completion tracking
  onboardingCompleted: boolean;
  onboardingStep: number; // Track progress (0-1)

  // Content Generation Fields
  description?: string; // Brand/personal description (200-500 chars)
  brandVoice?: string; // Voice/Tone description (200-500 chars)
  valuesMission?: string; // Values/Mission description (200-500 chars)

  // Connected social media channels (Instagram only)
  channels?: Channel[];
}

// Utility function to get channels by provider
export function getChannelsByProvider<T extends Channel>(
  channels: Channel[] | undefined,
  provider: T["provider"]
): T[] {
  if (!channels) return [];
  return channels.filter((c) => c.provider === provider) as T[];
}

// Utility function to find a channel by provider account ID
export function findChannelByProviderId(
  channels: Channel[] | undefined,
  provider: ChannelProvider,
  providerAccountId: string
): Channel | undefined {
  if (!channels) return undefined;
  return channels.find(
    (c) => c.provider === provider && c.providerAccountId === providerAccountId
  );
}
