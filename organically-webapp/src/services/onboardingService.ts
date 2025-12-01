import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { Workspace } from "@/types/workspace";

/**
 * Save onboarding progress for a workspace
 */
export async function saveOnboardingProgress(
  workspaceId: string,
  step: number,
  data: Partial<Workspace>
): Promise<void> {
  const workspaceRef = doc(db, "workspaces", workspaceId);

  await updateDoc(workspaceRef, {
    ...data,
    onboardingStep: step,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get onboarding data for a workspace
 */
export async function getOnboardingData(
  workspaceId: string
): Promise<Workspace | null> {
  const workspaceRef = doc(db, "workspaces", workspaceId);
  const workspaceSnap = await getDoc(workspaceRef);

  if (!workspaceSnap.exists()) {
    return null;
  }

  return workspaceSnap.data() as Workspace;
}

/**
 * Mark onboarding as complete
 */
export async function completeOnboarding(workspaceId: string): Promise<void> {
  const workspaceRef = doc(db, "workspaces", workspaceId);

  await updateDoc(workspaceRef, {
    onboardingCompleted: true,
    onboardingStep: 8,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update workspace with onboarding-specific data
 */
export async function updateWorkspaceOnboarding(
  workspaceId: string,
  step: number,
  data: Partial<Workspace>
): Promise<void> {
  await saveOnboardingProgress(workspaceId, step, data);
}
