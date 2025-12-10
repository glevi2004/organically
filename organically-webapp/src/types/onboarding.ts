// ============================================================================
// Onboarding Types
// ============================================================================

/**
 * Data for the Terms acceptance step
 */
export interface StepTermsData {
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

/**
 * Data for the Organization Basics step
 */
export interface StepBasicsData {
  name: string;
  imageFile?: File | null;
  currentImageUrl?: string;
  description?: string;
}

// ============================================================================
// Data Deletion Types
// ============================================================================

/**
 * Status of a user data deletion request
 */
export interface DeletionStatus {
  confirmationCode: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  requestedAt: string;
  completedAt?: string;
  channelsRemoved?: number;
}
