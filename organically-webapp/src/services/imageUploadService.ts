import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/firebase/firebaseConfig";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

/**
 * Upload a profile image to Firebase Storage
 */
export async function uploadProfileImage(
  userId: string,
  profileId: string,
  file: File
): Promise<string> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      "Invalid file type. Please upload a JPEG, PNG, WEBP, or GIF image."
    );
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      "File size too large. Please upload an image smaller than 5MB."
    );
  }

  // Generate storage path
  const fileExtension = file.name.split(".").pop() || "jpg";
  const storagePath = `profile-images/${userId}/${profileId}/avatar.${fileExtension}`;
  const storageRef = ref(storage, storagePath);

  try {
    // Upload file
    await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile image:", error);
    throw new Error("Failed to upload image. Please try again.");
  }
}

/**
 * Delete a profile image from Firebase Storage
 */
export async function deleteProfileImage(imageUrl: string): Promise<void> {
  try {
    // Extract storage path from URL
    // Firebase Storage URLs format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media&token={token}
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+?)(\?|$)/);

    if (!pathMatch || !pathMatch[1]) {
      console.warn("Could not extract storage path from URL");
      return;
    }

    // Decode the path (it's URL encoded)
    const storagePath = decodeURIComponent(pathMatch[1]);
    const storageRef = ref(storage, storagePath);

    // Delete the file
    await deleteObject(storageRef);
  } catch (error: any) {
    // Don't throw error if file doesn't exist
    if (error.code === "storage/object-not-found") {
      console.warn("Image already deleted or doesn't exist");
      return;
    }
    console.error("Error deleting profile image:", error);
    // Don't throw - we don't want to block operations if deletion fails
  }
}

/**
 * Get the default profile image URL
 * Using a placeholder service for now
 */
export function getDefaultProfileImageUrl(): string {
  // Using a neutral gradient as default
  return "https://ui-avatars.com/api/?name=User&background=10b981&color=fff&size=200";
}

/**
 * Validate if a file is a valid image
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Please upload a JPEG, PNG, WEBP, or GIF image.",
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "File size too large. Please upload an image smaller than 5MB.",
    };
  }

  return { valid: true };
}

