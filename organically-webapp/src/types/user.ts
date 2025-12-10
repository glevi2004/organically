import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  id: string; // matches Firebase Auth UID
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  onboardingCompleted: boolean;
  // Legal compliance
  termsAcceptedAt?: Date | Timestamp;
  privacyAcceptedAt?: Date | Timestamp;
}
