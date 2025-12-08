import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";
import { storage } from "@/firebase/firebaseConfig";
import { PostMedia, MediaType } from "@/types/post";
import { nanoid } from "nanoid";

// File size limits
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 250 * 1024 * 1024; // 250MB

// Allowed MIME types
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm"];

/**
 * Get the media type from a file
 */
function getMediaType(file: File): MediaType | null {
  if (ALLOWED_IMAGE_TYPES.includes(file.type)) return "image";
  if (ALLOWED_VIDEO_TYPES.includes(file.type)) return "video";
  return null;
}

/**
 * Validate a media file
 */
export function validateMediaFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const mediaType = getMediaType(file);

  if (!mediaType) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF, MP4, QuickTime, WebM`,
    };
  }

  const maxSize = mediaType === "video" ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  const maxSizeMB = maxSize / (1024 * 1024);

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large (${(file.size / (1024 * 1024)).toFixed(
        1
      )}MB). Max size for ${mediaType}s: ${maxSizeMB}MB`,
    };
  }

  return { valid: true };
}

/**
 * Get video duration from a file
 * Returns duration in seconds
 */
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("video/")) {
      reject(new Error("File is not a video"));
      return;
    }

    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Failed to load video metadata"));
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Generate a video thumbnail from a file
 * Returns a data URL
 */
export function generateVideoThumbnail(
  file: File,
  seekTime: number = 1
): Promise<string | undefined> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      video.currentTime = Math.min(seekTime, video.duration);
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } else {
        resolve(undefined);
      }
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      resolve(undefined);
      URL.revokeObjectURL(video.src);
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Upload a single media file to Firebase Storage
 */
export async function uploadPostMedia(
  organizationId: string,
  postId: string,
  file: File,
  order: number
): Promise<PostMedia> {
  // Validate file
  const validation = validateMediaFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const mediaType = getMediaType(file);
  if (!mediaType) {
    throw new Error("Invalid media type");
  }

  // Generate unique filename
  const timestamp = Date.now();
  const uniqueId = nanoid(6);
  const extension =
    file.name.split(".").pop()?.toLowerCase() ||
    (mediaType === "video" ? "mp4" : "jpg");
  const fileName = `${timestamp}_${uniqueId}_${order}.${extension}`;

  // Storage path: post-media/{organizationId}/{postId}/{fileName}
  const storagePath = `post-media/${organizationId}/${postId}/${fileName}`;
  const storageRef = ref(storage, storagePath);

  try {
    // Upload file
    await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        order: order.toString(),
      },
    });

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);

    // Get video duration if applicable
    let duration: number | undefined;
    if (mediaType === "video") {
      try {
        duration = await getVideoDuration(file);
      } catch {
        // Duration is optional, don't fail the upload
      }
    }

    // Build result without undefined values (Firestore doesn't accept them)
    const result: PostMedia = {
      id: nanoid(),
      url: downloadURL,
      type: mediaType,
      order,
      storagePath,
    };

    // Only add duration if defined
    if (duration !== undefined) {
      result.duration = duration;
    }

    return result;
  } catch (error) {
    console.error("Error uploading media:", error);
    throw new Error("Failed to upload media. Please try again.");
  }
}

/**
 * Upload multiple media files
 * Returns uploaded media in order
 */
export async function uploadPostMediaBatch(
  organizationId: string,
  postId: string,
  files: Array<{ file: File; order: number }>
): Promise<PostMedia[]> {
  // Upload all files in parallel
  const uploadPromises = files.map(({ file, order }) =>
    uploadPostMedia(organizationId, postId, file, order)
  );

  const results = await Promise.all(uploadPromises);

  // Sort by order
  return results.sort((a, b) => a.order - b.order);
}

/**
 * Delete a single media file from storage
 */
export async function deletePostMedia(mediaUrlOrPath: string): Promise<void> {
  try {
    let storagePath: string;

    // Check if it's a storage path or a URL
    if (mediaUrlOrPath.startsWith("post-media/")) {
      storagePath = mediaUrlOrPath;
    } else {
      // Extract storage path from URL
      const url = new URL(mediaUrlOrPath);
      const pathMatch = url.pathname.match(/\/o\/(.+?)(\?|$)/);

      if (!pathMatch?.[1]) {
        console.warn("Could not extract storage path from URL");
        return;
      }

      storagePath = decodeURIComponent(pathMatch[1]);
    }

    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error: any) {
    // Don't throw error if file doesn't exist
    if (error.code === "storage/object-not-found") {
      console.warn("Media file already deleted or doesn't exist");
      return;
    }
    console.error("Error deleting media:", error);
    throw error;
  }
}

/**
 * Delete all media files for a post
 */
export async function deleteAllPostMedia(
  organizationId: string,
  postId: string
): Promise<void> {
  const folderPath = `post-media/${organizationId}/${postId}`;
  const folderRef = ref(storage, folderPath);

  try {
    const listResult = await listAll(folderRef);

    // Delete all files in the folder
    const deletePromises = listResult.items.map((itemRef) =>
      deleteObject(itemRef).catch((error) => {
        console.warn(`Failed to delete ${itemRef.fullPath}:`, error);
      })
    );

    await Promise.all(deletePromises);
  } catch (error: any) {
    // Folder might not exist if no media was uploaded
    if (error.code === "storage/object-not-found") {
      return;
    }
    console.error("Error deleting post media folder:", error);
  }
}

/**
 * Check if a media URL is a blob URL (local/temporary)
 */
export function isLocalBlobUrl(url: string): boolean {
  return url.startsWith("blob:");
}

/**
 * Check if a media URL is from Firebase Storage
 */
export function isFirebaseStorageUrl(url: string): boolean {
  return url.includes("firebasestorage.googleapis.com");
}
