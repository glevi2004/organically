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
  Timestamp,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { Post, CreatePostInput, PostStatus } from "@/types/post";

const POSTS_COLLECTION = "posts";

/**
 * Create a new post
 */
export async function createPost(input: CreatePostInput): Promise<Post> {
  try {
    const postId = doc(collection(db, POSTS_COLLECTION)).id;
    const now = new Date();

    const post: Post = {
      id: postId,
      ...input,
      status: input.status || "idea",
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, POSTS_COLLECTION, postId), {
      ...post,
      createdAt: Timestamp.fromDate(post.createdAt),
      updatedAt: Timestamp.fromDate(post.updatedAt),
      scheduledDate: post.scheduledDate
        ? Timestamp.fromDate(post.scheduledDate)
        : null,
      postedDate: post.postedDate ? Timestamp.fromDate(post.postedDate) : null,
    });

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
 * Get all posts for a profile
 */
export async function getPostsByProfile(profileId: string): Promise<Post[]> {
  try {
    const q = query(
      collection(db, POSTS_COLLECTION),
      where("profileId", "==", profileId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const posts: Post[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        ...data,
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
  profileId: string,
  startDate: Date,
  endDate: Date
): Promise<Post[]> {
  try {
    const q = query(
      collection(db, POSTS_COLLECTION),
      where("profileId", "==", profileId),
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
 * Update a post
 */
export async function updatePost(
  postId: string,
  updates: Partial<Omit<Post, "id" | "profileId" | "userId" | "createdAt">>
): Promise<void> {
  try {
    const docRef = doc(db, POSTS_COLLECTION, postId);

    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date()),
    };

    if (updates.scheduledDate) {
      updateData.scheduledDate = Timestamp.fromDate(updates.scheduledDate);
    }

    if (updates.postedDate) {
      updateData.postedDate = Timestamp.fromDate(updates.postedDate);
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating post:", error);
    throw error;
  }
}

/**
 * Delete a post
 */
export async function deletePost(postId: string): Promise<void> {
  try {
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
