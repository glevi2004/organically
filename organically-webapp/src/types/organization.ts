import { Timestamp } from "firebase/firestore";

// Channel provider type - Instagram only
export type ChannelProvider = "instagram";

// Channel interface for Instagram
export interface Channel {
  id: string;
  provider: ChannelProvider;
  providerAccountId: string;
  accountName: string;
  accountType?: string; // 'PERSONAL', 'CREATOR', 'BUSINESS'
  accessToken: string; // Encrypted
  tokenExpiresAt?: Date | Timestamp | number;
  isActive: boolean;
  connectedAt: Date | Timestamp | number;
  label?: string;
  profileImageUrl?: string | null;
}

// Helper type for creating new channels (without id, which is generated)
export type NewChannel = Omit<Channel, "id">;

export interface Organization {
  id: string;
  name: string;
  imageUrl?: string;
  users: string[]; // Array of user IDs who have access
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Onboarding completion tracking
  onboardingCompleted: boolean;
  onboardingStep: number;

  // Content Generation Fields
  description?: string;

  // Connected Instagram channels
  channels?: Channel[];
}

// Utility function to get Instagram channels
export function getInstagramChannels(
  channels: Channel[] | undefined
): Channel[] {
  if (!channels) return [];
  return channels.filter((c) => c.provider === "instagram");
}

// Utility function to find a channel by provider account ID
export function findChannelByProviderId(
  channels: Channel[] | undefined,
  providerAccountId: string
): Channel | undefined {
  if (!channels) return undefined;
  return channels.find((c) => c.providerAccountId === providerAccountId);
}
