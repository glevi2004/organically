"use server";

import { adminAuth, adminDb } from "@/firebase/firebaseAdmin";
import { decryptToken } from "@/lib/encryption";
import { inngest } from "@/inngest/client";
import { Post } from "@/types/post";
import { Channel, Organization } from "@/types/organization";
import { InstagramMedia } from "@/types/instagram";
import {
  createImageContainer,
  createVideoContainer,
  createCarouselItemContainer,
  createCarouselContainer,
  waitForContainerReady,
  publishMediaContainer,
  getInstagramMedia,
} from "@/services/instagramService";
import { FieldValue } from "firebase-admin/firestore";

// ============================================================================
// Server Actions for Instagram Operations
// These run on the server and are called directly from client components.
// No fetch() calls needed - Next.js handles the RPC.
// ============================================================================

interface ActionResult<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * Verify the user's Firebase ID token
 * Returns userId on success, throws on failure
 */
async function verifyToken(idToken: string): Promise<string> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error("[Server Action] Token verification failed:", error);
    throw new Error("Unauthorized");
  }
}

/**
 * Verify the user is a member of the organization
 */
async function verifyOrgMembership(
  userId: string,
  organizationId: string
): Promise<Organization> {
  const orgDoc = await adminDb
    .collection("organizations")
    .doc(organizationId)
    .get();

  if (!orgDoc.exists) {
    throw new Error("Organization not found");
  }

  const org = { id: orgDoc.id, ...orgDoc.data() } as Organization;

  if (!org.users?.includes(userId)) {
    throw new Error("You don't have access to this organization");
  }

  return org;
}

/**
 * Verify the user owns the post
 */
async function verifyPostOwnership(
  userId: string,
  postId: string
): Promise<Post> {
  const postDoc = await adminDb.collection("posts").doc(postId).get();

  if (!postDoc.exists) {
    throw new Error("Post not found");
  }

  const post = { id: postDoc.id, ...postDoc.data() } as Post;

  if (post.userId !== userId) {
    throw new Error("You don't have access to this post");
  }

  return post;
}

// ============================================================================
// PUBLISH TO INSTAGRAM
// ============================================================================

export async function publishToInstagram(
  idToken: string,
  postId: string,
  organizationId: string
): Promise<ActionResult<{ instagramMediaId: string }>> {
  try {
    // 1. Verify authentication
    const userId = await verifyToken(idToken);

    // 2. Verify ownership
    const [org, post] = await Promise.all([
      verifyOrgMembership(userId, organizationId),
      verifyPostOwnership(userId, postId),
    ]);

    // 3. Validate post
    if (!post.media || post.media.length === 0) {
      return {
        success: false,
        error: "Post must have at least one media item",
      };
    }

    if (post.status === "posted") {
      return { success: false, error: "Post has already been published" };
    }

    // 4. Get Instagram channel
    const instagramChannel = org.channels?.find(
      (c: Channel) => c.provider === "instagram" && c.isActive
    );

    if (!instagramChannel) {
      return { success: false, error: "No Instagram account connected" };
    }

    // 5. Decrypt access token
    const accessToken = decryptToken(instagramChannel.accessToken);
    const igUserId = instagramChannel.providerAccountId;

    // 6. Create containers based on media count
    const media = post.media;
    const caption = post.content || "";
    let finalContainerId: string;

    if (media.length === 1) {
      const item = media[0];
      if (item.type === "image") {
        const container = await createImageContainer(
          accessToken,
          igUserId,
          item.url,
          caption
        );
        finalContainerId = container.id;
      } else {
        const container = await createVideoContainer(
          accessToken,
          igUserId,
          item.url,
          caption,
          "REELS"
        );
        await waitForContainerReady(accessToken, container.id);
        finalContainerId = container.id;
      }
    } else {
      const childIds: string[] = [];

      for (const item of media) {
        const container = await createCarouselItemContainer(
          accessToken,
          igUserId,
          item.url,
          item.type
        );

        if (item.type === "video") {
          await waitForContainerReady(accessToken, container.id);
        }

        childIds.push(container.id);
      }

      const carouselContainer = await createCarouselContainer(
        accessToken,
        igUserId,
        childIds,
        caption
      );
      finalContainerId = carouselContainer.id;
    }

    // 7. Publish the container
    const publishResult = await publishMediaContainer(
      accessToken,
      igUserId,
      finalContainerId
    );

    // 8. Update post in Firestore
    await adminDb.collection("posts").doc(postId).update({
      status: "posted",
      instagramMediaId: publishResult.id,
      publishedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      data: { instagramMediaId: publishResult.id },
    };
  } catch (error) {
    console.error("[publishToInstagram] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to publish",
    };
  }
}

// ============================================================================
// SCHEDULE POST
// ============================================================================

export async function schedulePost(
  idToken: string,
  postId: string,
  organizationId: string,
  scheduledDate: string
): Promise<ActionResult<{ scheduledDate: string }>> {
  try {
    // 1. Verify authentication
    const userId = await verifyToken(idToken);

    // 2. Verify ownership
    const [, post] = await Promise.all([
      verifyOrgMembership(userId, organizationId),
      verifyPostOwnership(userId, postId),
    ]);

    // 3. Validate
    const scheduledTime = new Date(scheduledDate);

    if (scheduledTime.getTime() <= Date.now()) {
      return { success: false, error: "Scheduled time must be in the future" };
    }

    if (!post.media || post.media.length === 0) {
      return {
        success: false,
        error: "Post must have at least one media item",
      };
    }

    if (post.status === "posted") {
      return { success: false, error: "Post has already been published" };
    }

    // 4. Send to Inngest
    await inngest.send({
      name: "post/schedule-publish",
      data: {
        postId,
        organizationId,
        scheduledDate: scheduledTime.toISOString(),
      },
      ts: scheduledTime.getTime(),
    });

    // 5. Update post status
    await adminDb.collection("posts").doc(postId).update({
      status: "ready",
      scheduledDate: scheduledTime,
      updatedAt: new Date(),
    });

    return {
      success: true,
      data: { scheduledDate: scheduledTime.toISOString() },
    };
  } catch (error) {
    console.error("[schedulePost] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to schedule",
    };
  }
}

// ============================================================================
// CANCEL SCHEDULED POST
// ============================================================================

export async function cancelScheduledPost(
  idToken: string,
  postId: string
): Promise<ActionResult> {
  try {
    // 1. Verify authentication
    const userId = await verifyToken(idToken);

    // 2. Verify ownership
    await verifyPostOwnership(userId, postId);

    // 3. Update post status back to draft
    await adminDb.collection("posts").doc(postId).update({
      status: "draft",
      scheduledDate: null,
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error("[cancelScheduledPost] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to cancel",
    };
  }
}

// ============================================================================
// GET INSTAGRAM POSTS (for workflow trigger node)
// ============================================================================

interface InstagramPostData {
  id: string;
  caption: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
}

export async function getInstagramPostsForChannel(
  idToken: string,
  channelId: string,
  limit: number = 25
): Promise<ActionResult<{ posts: InstagramPostData[] }>> {
  try {
    // 1. Verify authentication
    const userId = await verifyToken(idToken);

    // 2. Find the organization with this channel (user is a member)
    const orgsSnapshot = await adminDb
      .collection("organizations")
      .where("users", "array-contains", userId)
      .get();

    let targetChannel: Channel | null = null;

    for (const orgDoc of orgsSnapshot.docs) {
      const org = { id: orgDoc.id, ...orgDoc.data() } as Organization;
      const channel = org.channels?.find((c: Channel) => c.id === channelId);

      if (channel && channel.isActive) {
        targetChannel = channel;
        break;
      }
    }

    if (!targetChannel) {
      return { success: false, error: "Channel not found or not active" };
    }

    // 3. Fetch Instagram posts
    const mediaResponse = await getInstagramMedia(targetChannel, limit);

    // 4. Format response
    const posts = mediaResponse.data.map((media: InstagramMedia) => ({
      id: media.id,
      caption: media.caption || "",
      media_type: media.media_type,
      thumbnail_url: media.thumbnail_url || media.media_url,
      permalink: media.permalink,
      timestamp: media.timestamp,
    }));

    return { success: true, data: { posts } };
  } catch (error) {
    console.error("[getInstagramPostsForChannel] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch posts",
    };
  }
}
