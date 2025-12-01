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
import { Workspace } from "@/types/workspace";

export async function createWorkspace(
  userId: string,
  workspaceData: {
    name: string;
    description?: string;
    icon: string;
  }
): Promise<string> {
  const workspacesRef = collection(db, "workspaces");
  const newWorkspaceRef = doc(workspacesRef);
  const now = Timestamp.now();

  const workspace: Workspace = {
    id: newWorkspaceRef.id,
    name: workspaceData.name,
    description: workspaceData.description || "",
    icon: workspaceData.icon,
    userId,
    createdAt: now,
    updatedAt: now,
    onboardingCompleted: false,
    onboardingStep: 1,
  };

  await setDoc(newWorkspaceRef, workspace);
  return newWorkspaceRef.id;
}

export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  const workspacesRef = collection(db, "workspaces");
  const q = query(
    workspacesRef,
    where("userId", "==", userId),
    orderBy("createdAt", "asc")
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data() as Workspace);
}

export async function getWorkspace(
  workspaceId: string
): Promise<Workspace | null> {
  const workspaceRef = doc(db, "workspaces", workspaceId);
  const workspaceSnap = await getDoc(workspaceRef);

  if (!workspaceSnap.exists()) {
    return null;
  }

  return workspaceSnap.data() as Workspace;
}

export async function updateWorkspace(
  workspaceId: string,
  updates: Partial<Omit<Workspace, "id" | "userId" | "createdAt">>
): Promise<void> {
  const workspaceRef = doc(db, "workspaces", workspaceId);
  await updateDoc(workspaceRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const workspaceRef = doc(db, "workspaces", workspaceId);
  await deleteDoc(workspaceRef);
}

/**
 * Update workspace with onboarding-specific data
 */
export async function updateWorkspaceOnboarding(
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
 * Mark onboarding as complete for a workspace
 */
export async function markOnboardingComplete(
  workspaceId: string
): Promise<void> {
  const workspaceRef = doc(db, "workspaces", workspaceId);
  await updateDoc(workspaceRef, {
    onboardingCompleted: true,
    onboardingStep: 8,
    updatedAt: serverTimestamp(),
  });
}
