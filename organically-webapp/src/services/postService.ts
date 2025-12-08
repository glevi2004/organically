import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  deleteDoc,
  updateDoc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { Post, CreatePostInput, PostStatus, PostMedia } from "@/types/post";
import { deleteAllPostMedia, deletePostMedia } from "@/services/postMediaService";

const POSTS_COLLECTION = "posts";

/**
 * Create a new post
 */
export async function createPost(input: CreatePostInput): Promise<Post> {
  try {
    // Validate platforms array
    if (!input.platforms || input.platforms.length === 0) {
      throw new Error("At least one platform must be selected");
    }

    const postId = doc(collection(db, POSTS_COLLECTION)).id;
    const now = new Date();

    // Get existing posts count for this status to set order
    const existingPosts = await getDocs(
      query(
        collection(db, POSTS_COLLECTION),
        where("organizationId", "==", input.organizationId),
        where("status", "==", input.status || "idea")
      )
    );
    const order = existingPosts.size;

    const post: Post = {
      id: postId,
      organizationId: input.organizationId,
      userId: input.userId,
      content: input.content,
      platforms: input.platforms,
      status: input.status || "idea",
      order,
      createdAt: now,
      updatedAt: now,
      ...(input.scheduledDate && { scheduledDate: input.scheduledDate }),
      ...(input.hooks && { hooks: input.hooks }),
      ...(input.hashtags && { hashtags: input.hashtags }),
      ...(input.media && input.media.length > 0 && { media: input.media }),
    };

    // Build Firestore document, filtering out undefined values
    const firestoreDoc: Record<string, any> = {
      id: post.id,
      organizationId: post.organizationId,
      userId: post.userId,
      content: post.content,
      platforms: post.platforms,
      status: post.status,
      order: post.order,
      createdAt: Timestamp.fromDate(post.createdAt),
      updatedAt: Timestamp.fromDate(post.updatedAt),
      scheduledDate: post.scheduledDate
        ? Timestamp.fromDate(post.scheduledDate)
        : null,
      postedDate: null,
    };

    // Only add optional fields if they have values
    if (post.hooks) firestoreDoc.hooks = post.hooks;
    if (post.hashtags) firestoreDoc.hashtags = post.hashtags;
    if (post.media && post.media.length > 0) firestoreDoc.media = post.media;

    await setDoc(doc(db, POSTS_COLLECTION, postId), firestoreDoc);

    return post;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}

/**
 * Get a post by ID
 */
export async function getPost(postId: string): Promise<Post | null> {
  try {
    const docRef = doc(db, POSTS_COLLECTION, postId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      order: data.order ?? 0,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      scheduledDate: data.scheduledDate?.toDate(),
      postedDate: data.postedDate?.toDate(),
    } as Post;
  } catch (error) {
    console.error("Error getting post:", error);
    throw error;
  }
}

/**
 * Get all posts for an organization
 */
export async function getPostsByOrganization(organizationId: string): Promise<Post[]> {
  try {
    const q = query(
      collection(db, POSTS_COLLECTION),
      where("organizationId", "==", organizationId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        order: data.order ?? 0,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        scheduledDate: data.scheduledDate?.toDate(),
        postedDate: data.postedDate?.toDate(),
      } as Post);
    });

    return posts;
  } catch (error) {
    console.error("Error getting posts:", error);
    throw error;
  }
}

/**
 * Get posts for a specific date range
 */
export async function getPostsByDateRange(
  organizationId: string,
  startDate: Date,
  endDate: Date
): Promise<Post[]> {
  try {
    const q = query(
      collection(db, POSTS_COLLECTION),
      where("organizationId", "==", organizationId),
      where("scheduledDate", ">=", Timestamp.fromDate(startDate)),
      where("scheduledDate", "<=", Timestamp.fromDate(endDate)),
      orderBy("scheduledDate", "asc")
    );

    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
        order: data.order ?? 0,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        scheduledDate: data.scheduledDate?.toDate(),
        postedDate: data.postedDate?.toDate(),
      } as Post);
    });

    return posts;
  } catch (error) {
    console.error("Error getting posts by date range:", error);
    throw error;
  }
}

/**
 * Helper to remove undefined values from an object (recursively for arrays)
 */
function removeUndefinedValues(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedValues);
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, removeUndefinedValues(value)])
    );
  }
  return obj;
}

/**
 * Update a post
 */
export async function updatePost(
  postId: string,
  updates: Partial<Omit<Post, "id" | "organizationId" | "userId" | "createdAt">>
): Promise<void> {
  try {
    const docRef = doc(db, POSTS_COLLECTION, postId);

    // Filter out undefined values - Firestore doesn't accept them
    // This also handles nested objects and arrays (like media)
    const filteredUpdates = removeUndefinedValues(updates);

    const updateData: any = {
      ...filteredUpdates,
      updatedAt: Timestamp.fromDate(new Date()),
    };

    // Convert dates to Timestamps
    if (updates.scheduledDate !== undefined) {
      updateData.scheduledDate = updates.scheduledDate
        ? Timestamp.fromDate(updates.scheduledDate)
        : null;
    }

    if (updates.postedDate !== undefined) {
      updateData.postedDate = updates.postedDate
        ? Timestamp.fromDate(updates.postedDate)
        : null;
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating post:", error);
    throw error;
  }
}

/**
 * Delete a post and its associated media from storage
 */
export async function deletePost(postId: string): Promise<void> {
  try {
    // First, get the post to retrieve organizationId and media
    const post = await getPost(postId);
    
    if (post) {
      // Delete all media files from storage
      try {
        await deleteAllPostMedia(post.organizationId, postId);
      } catch (mediaError) {
        // Log but don't fail the delete if media cleanup fails
        console.warn("Failed to delete post media from storage:", mediaError);
      }
    }

    // Delete the post document
    await deleteDoc(doc(db, POSTS_COLLECTION, postId));
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
}

/**
 * Update post status
 */
export async function updatePostStatus(
  postId: string,
  status: PostStatus
): Promise<void> {
  try {
    await updatePost(postId, { status });

    // If marking as posted, set postedDate
    if (status === "posted") {
      await updatePost(postId, { postedDate: new Date() });
    }
  } catch (error) {
    console.error("Error updating post status:", error);
    throw error;
  }
}

/**
 * Update a single post's order
 */
export async function updatePostOrder(
  postId: string,
  order: number
): Promise<void> {
  try {
    await updatePost(postId, { order });
  } catch (error) {
    console.error("Error updating post order:", error);
    throw error;
  }
}

/**
 * Batch update post orders (used after drag and drop)
 */
export async function reorderPosts(
  posts: Array<{ id: string; order: number; status?: PostStatus }>
): Promise<void> {
  try {
    const batch = writeBatch(db);
    const now = Timestamp.fromDate(new Date());

    for (const post of posts) {
      const docRef = doc(db, POSTS_COLLECTION, post.id);
      const updateData: any = {
        order: post.order,
        updatedAt: now,
      };

      // If status is provided, update it as well
      if (post.status !== undefined) {
        updateData.status = post.status;

        // If marking as posted, set postedDate
        if (post.status === "posted") {
          updateData.postedDate = now;
        }
      }

      batch.update(docRef, updateData);
    }

    await batch.commit();
  } catch (error) {
    console.error("Error reordering posts:", error);
    throw error;
  }
}
