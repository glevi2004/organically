import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { UserProfile } from "@/types/user";

export async function createUserProfile(
  userId: string,
  userData: {
    email: string;
    displayName?: string;
    photoURL?: string;
  }
): Promise<void> {
  const userRef = doc(db, "users", userId);
  const now = Timestamp.now();

  await setDoc(userRef, {
    id: userId,
    email: userData.email,
    displayName: userData.displayName || null,
    photoURL: userData.photoURL || null,
    createdAt: now,
    updatedAt: now,
    onboardingCompleted: false,
  });
}

export async function getUserProfile(
  userId: string
): Promise<UserProfile | null> {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }

  return userSnap.data() as UserProfile;
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserProfile, "id" | "createdAt">>
): Promise<void> {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function checkUserExists(userId: string): Promise<boolean> {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists();
}

