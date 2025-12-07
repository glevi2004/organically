import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { Organization, Channel, ChannelProvider, NewChannel } from "@/types/organization";
import { deleteOrganizationImage } from "./imageUploadService";

// Generate a unique channel ID
function generateChannelId(): string {
  return `ch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function createOrganization(
  userId: string,
  organizationData: {
    name: string;
    imageUrl?: string;
  }
): Promise<string> {
  const organizationsRef = collection(db, "organizations");
  const newOrganizationRef = doc(organizationsRef);
  const now = Timestamp.now();

  const organization: Partial<Organization> = {
    id: newOrganizationRef.id,
    name: organizationData.name,
    userId,
    createdAt: now,
    updatedAt: now,
    onboardingCompleted: false,
    onboardingStep: 1,
    channels: [], // Initialize with empty channels array
  };

  // Only add imageUrl if it exists
  if (organizationData.imageUrl) {
    organization.imageUrl = organizationData.imageUrl;
  }

  await setDoc(newOrganizationRef, organization);
  return newOrganizationRef.id;
}

export async function getUserOrganizations(userId: string): Promise<Organization[]> {
  const organizationsRef = collection(db, "organizations");
  const q = query(
    organizationsRef,
    where("userId", "==", userId),
    orderBy("createdAt", "asc")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Organization);
}

export async function getOrganization(organizationId: string): Promise<Organization | null> {
  const organizationRef = doc(db, "organizations", organizationId);
  const organizationSnap = await getDoc(organizationRef);

  if (!organizationSnap.exists()) {
    return null;
  }

  return organizationSnap.data() as Organization;
}

export async function updateOrganization(
  organizationId: string,
  updates: Partial<Omit<Organization, "id" | "userId" | "createdAt">>
): Promise<void> {
  const organizationRef = doc(db, "organizations", organizationId);

  // If updating imageUrl, delete old image first
  if (updates.imageUrl !== undefined) {
    const currentOrganization = await getOrganization(organizationId);
    if (
      currentOrganization?.imageUrl &&
      currentOrganization.imageUrl !== updates.imageUrl
    ) {
      // Delete old image in the background (don't wait or fail if it errors)
      deleteOrganizationImage(currentOrganization.imageUrl).catch((err) =>
        console.warn("Failed to delete old organization image:", err)
      );
    }
  }

  // Filter out undefined values for Firestore
  const cleanUpdates: Record<string, unknown> = { updatedAt: serverTimestamp() };
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanUpdates[key] = value;
    }
  });

  await updateDoc(organizationRef, cleanUpdates);
}

export async function deleteOrganization(organizationId: string): Promise<void> {
  const organizationRef = doc(db, "organizations", organizationId);
  await deleteDoc(organizationRef);
}

/**
 * Update organization with onboarding-specific data
 */
export async function updateOrganizationOnboarding(
  organizationId: string,
  step: number,
  data: Partial<Organization>
): Promise<void> {
  const organizationRef = doc(db, "organizations", organizationId);
  
  // Filter out undefined values for Firestore
  const cleanData: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanData[key] = value;
    }
  });

  await updateDoc(organizationRef, {
    ...cleanData,
    onboardingStep: step,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Mark onboarding as complete for an organization
 */
export async function markOnboardingComplete(organizationId: string): Promise<void> {
  const organizationRef = doc(db, "organizations", organizationId);
  await updateDoc(organizationRef, {
    onboardingCompleted: true,
    onboardingStep: 5,
    updatedAt: serverTimestamp(),
  });
}

// ============================================================================
// CHANNEL MANAGEMENT (Multi-account support)
// ============================================================================

/**
 * Add a new channel to an organization
 * Returns the generated channel ID
 */
export async function addChannel(
  organizationId: string,
  channelData: NewChannel
): Promise<string> {
  const organizationRef = doc(db, "organizations", organizationId);
  const channelId = generateChannelId();

  const channel: Channel = {
    ...channelData,
    id: channelId,
  } as Channel;

  await updateDoc(organizationRef, {
    channels: arrayUnion(channel),
    updatedAt: serverTimestamp(),
  });

  return channelId;
}

/**
 * Update an existing channel
 * Note: This removes the old channel and adds the updated one
 */
export async function updateChannel(
  organizationId: string,
  channelId: string,
  updates: Partial<Channel>
): Promise<void> {
  const organization = await getOrganization(organizationId);
  if (!organization?.channels) {
    throw new Error("Organization or channels not found");
  }

  const channelIndex = organization.channels.findIndex((c) => c.id === channelId);
  if (channelIndex === -1) {
    throw new Error("Channel not found");
  }

  const oldChannel = organization.channels[channelIndex];
  const updatedChannel = { ...oldChannel, ...updates } as Channel;

  // Update the channels array
  const newChannels = [...organization.channels];
  newChannels[channelIndex] = updatedChannel;

  const organizationRef = doc(db, "organizations", organizationId);
  await updateDoc(organizationRef, {
    channels: newChannels,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Remove a channel from an organization
 */
export async function removeChannel(
  organizationId: string,
  channelId: string
): Promise<void> {
  const organization = await getOrganization(organizationId);
  if (!organization?.channels) {
    throw new Error("Organization or channels not found");
  }

  const channelToRemove = organization.channels.find((c) => c.id === channelId);
  if (!channelToRemove) {
    throw new Error("Channel not found");
  }

  const organizationRef = doc(db, "organizations", organizationId);
  await updateDoc(organizationRef, {
    channels: arrayRemove(channelToRemove),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get all channels for a specific provider
 */
export async function getChannelsByProvider(
  organizationId: string,
  provider: ChannelProvider
): Promise<Channel[]> {
  const organization = await getOrganization(organizationId);
  if (!organization?.channels) return [];
  return organization.channels.filter((c) => c.provider === provider);
}

/**
 * Check if a provider account is already connected
 * (Prevents duplicate connections of the same account)
 */
export async function isProviderAccountConnected(
  organizationId: string,
  provider: ChannelProvider,
  providerAccountId: string
): Promise<boolean> {
  const organization = await getOrganization(organizationId);
  if (!organization?.channels) return false;
  return organization.channels.some(
    (c) => c.provider === provider && c.providerAccountId === providerAccountId
  );
}

/**
 * Toggle a channel's active status
 */
export async function toggleChannelActive(
  organizationId: string,
  channelId: string
): Promise<void> {
  const organization = await getOrganization(organizationId);
  if (!organization?.channels) {
    throw new Error("Organization or channels not found");
  }

  const channel = organization.channels.find((c) => c.id === channelId);
  if (!channel) {
    throw new Error("Channel not found");
  }

  await updateChannel(organizationId, channelId, { isActive: !channel.isActive });
}
