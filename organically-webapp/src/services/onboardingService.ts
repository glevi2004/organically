import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { Organization } from "@/types/organization";

/**
 * Remove undefined values from an object (Firestore doesn't accept undefined)
 */
function removeUndefinedValues<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

/**
 * Save onboarding progress for an organization
 */
export async function saveOnboardingProgress(
  organizationId: string,
  step: number,
  data: Partial<Organization>
): Promise<void> {
  const organizationRef = doc(db, "organizations", organizationId);
  const cleanData = removeUndefinedValues(data);

  await updateDoc(organizationRef, {
    ...cleanData,
    onboardingStep: step,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get onboarding data for an organization
 */
export async function getOnboardingData(
  organizationId: string
): Promise<Organization | null> {
  const organizationRef = doc(db, "organizations", organizationId);
  const organizationSnap = await getDoc(organizationRef);

  if (!organizationSnap.exists()) {
    return null;
  }

  return organizationSnap.data() as Organization;
}

/**
 * Mark onboarding as complete
 */
export async function completeOnboarding(organizationId: string): Promise<void> {
  const organizationRef = doc(db, "organizations", organizationId);

  await updateDoc(organizationRef, {
    onboardingCompleted: true,
    onboardingStep: 1,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update organization with onboarding-specific data
 */
export async function updateOrganizationOnboarding(
  organizationId: string,
  step: number,
  data: Partial<Organization>
): Promise<void> {
  await saveOnboardingProgress(organizationId, step, data);
}
