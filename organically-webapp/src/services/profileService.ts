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
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { Profile } from "@/types/profile";
import { deleteProfileImage } from "./imageUploadService";

export async function createProfile(
  userId: string,
  profileData: {
    name: string;
    imageUrl?: string;
  }
): Promise<string> {
  const profilesRef = collection(db, "profiles");
  const newProfileRef = doc(profilesRef);
  const now = Timestamp.now();

  const profile: Partial<Profile> = {
    id: newProfileRef.id,
    name: profileData.name,
    userId,
    createdAt: now,
    updatedAt: now,
    onboardingCompleted: false,
    onboardingStep: 1,
  };

  // Only add imageUrl if it exists
  if (profileData.imageUrl) {
    profile.imageUrl = profileData.imageUrl;
  }

  await setDoc(newProfileRef, profile);
  return newProfileRef.id;
}

export async function getUserProfiles(userId: string): Promise<Profile[]> {
  const profilesRef = collection(db, "profiles");
  const q = query(
    profilesRef,
    where("userId", "==", userId),
    orderBy("createdAt", "asc")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Profile);
}

export async function getProfile(profileId: string): Promise<Profile | null> {
  const profileRef = doc(db, "profiles", profileId);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    return null;
  }

  return profileSnap.data() as Profile;
}

export async function updateProfile(
  profileId: string,
  updates: Partial<Omit<Profile, "id" | "userId" | "createdAt">>
): Promise<void> {
  const profileRef = doc(db, "profiles", profileId);

  // If updating imageUrl, delete old image first
  if (updates.imageUrl !== undefined) {
    const currentProfile = await getProfile(profileId);
    if (
      currentProfile?.imageUrl &&
      currentProfile.imageUrl !== updates.imageUrl
    ) {
      // Delete old image in the background (don't wait or fail if it errors)
      deleteProfileImage(currentProfile.imageUrl).catch((err) =>
        console.warn("Failed to delete old profile image:", err)
      );
    }
  }

  // Filter out undefined values for Firestore
  const cleanUpdates: Record<string, any> = { updatedAt: serverTimestamp() };
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanUpdates[key] = value;
    }
  });

  await updateDoc(profileRef, cleanUpdates);
}

export async function deleteProfile(profileId: string): Promise<void> {
  const profileRef = doc(db, "profiles", profileId);
  await deleteDoc(profileRef);
}

/**
 * Update profile with onboarding-specific data
 */
export async function updateProfileOnboarding(
  profileId: string,
  step: number,
  data: Partial<Profile>
): Promise<void> {
  const profileRef = doc(db, "profiles", profileId);
  await updateDoc(profileRef, {
    ...data,
    onboardingStep: step,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Mark onboarding as complete for a profile
 */
export async function markOnboardingComplete(profileId: string): Promise<void> {
  const profileRef = doc(db, "profiles", profileId);
  await updateDoc(profileRef, {
    onboardingCompleted: true,
    onboardingStep: 5,
    updatedAt: serverTimestamp(),
  });
}
