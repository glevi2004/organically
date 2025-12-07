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

  // Only include defined values (Firestore doesn't accept undefined)
  const userDoc: Record<string, unknown> = {
    userId,
    email: userData.email,
    createdAt: now,
    updatedAt: now,
  };

  if (userData.displayName) {
    userDoc.displayName = userData.displayName;
  }
  if (userData.photoURL) {
    userDoc.photoURL = userData.photoURL;
  }

  await setDoc(userRef, userDoc);
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
  updates: Partial<Omit<UserProfile, "id" | "createdAt">>,
  email?: string
): Promise<void> {
  const userRef = doc(db, "users", userId);

  // Check if user exists first
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    // Document exists, use updateDoc
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } else if (email) {
    // Document doesn't exist, create it with email (required by security rules)
    await setDoc(userRef, {
      ...updates,
      userId,
      email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } else {
    // Can't create without email - log warning but don't throw
    console.warn("Cannot create user profile without email, skipping update");
  }
}

export async function checkUserExists(userId: string): Promise<boolean> {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  return userSnap.exists();
}
