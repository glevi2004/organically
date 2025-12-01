import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { Profile } from "@/types/profile";

/**
 * Save onboarding progress for a profile
 */
export async function saveOnboardingProgress(
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
 * Get onboarding data for a profile
 */
export async function getOnboardingData(
  profileId: string
): Promise<Profile | null> {
  const profileRef = doc(db, "profiles", profileId);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    return null;
  }

  return profileSnap.data() as Profile;
}

/**
 * Mark onboarding as complete
 */
export async function completeOnboarding(profileId: string): Promise<void> {
  const profileRef = doc(db, "profiles", profileId);

  await updateDoc(profileRef, {
    onboardingCompleted: true,
    onboardingStep: 5,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update profile with onboarding-specific data
 */
export async function updateProfileOnboarding(
  profileId: string,
  step: number,
  data: Partial<Profile>
): Promise<void> {
  await saveOnboardingProgress(profileId, step, data);
}
