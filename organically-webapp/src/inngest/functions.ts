import { inngest } from "./client";
import { adminDb } from "@/firebase/firebaseAdmin";
import { decryptToken } from "@/lib/encryption";
import { Post } from "@/types/post";
import { Channel, Organization } from "@/types/organization";
import {
  createImageContainer,
  createVideoContainer,
  createCarouselItemContainer,
  createCarouselContainer,
  waitForContainerReady,
  publishMediaContainer,
} from "@/services/instagramService";
import { FieldValue } from "firebase-admin/firestore";

/**
 * Publishes a scheduled post to Instagram
 * This function is triggered by Inngest at the scheduled time
 */
export const publishScheduledPost = inngest.createFunction(
  {
    id: "publish-scheduled-post",
    retries: 3,
  },
  { event: "post/schedule-publish" },
  async ({ event, step }) => {
    const { postId, organizationId, scheduledDate } = event.data;

    // Step 1: Fetch the post
    const post = await step.run("fetch-post", async () => {
      const postDoc = await adminDb.collection("posts").doc(postId).get();

      if (!postDoc.exists) {
        throw new Error(`Post ${postId} not found`);
      }

      const postData = { id: postDoc.id, ...postDoc.data() } as Post;

      // Validate post can be published
      if (postData.status === "posted") {
        // Already published, skip silently
        return null;
      }

      // Check if post was cancelled (status changed from "ready")
      if (postData.status !== "ready") {
        // Post was cancelled or changed, skip silently
        return null;
      }

      // Check if the scheduled date matches (handles re-scheduling)
      // If user rescheduled the post, the old event's scheduledDate won't match
      if (scheduledDate && postData.scheduledDate) {
        const eventTime = new Date(scheduledDate).getTime();
        const postTime =
          postData.scheduledDate instanceof Date
            ? postData.scheduledDate.getTime()
            : new Date(postData.scheduledDate).getTime();

        // Allow 1 minute tolerance for timing differences
        if (Math.abs(eventTime - postTime) > 60000) {
          // Scheduled date was changed, skip this old event
          return null;
        }
      }

      if (!postData.media || postData.media.length === 0) {
        throw new Error("Post must have at least one media item");
      }

      return postData;
    });

    // If post was cancelled or already published, skip
    if (!post) {
      return {
        success: false,
        postId,
        message: "Post was cancelled, rescheduled, or already published",
      };
    }

    // Step 2: Get organization and Instagram channel
    const { accessToken, igUserId } = await step.run(
      "get-instagram-credentials",
      async () => {
        const orgDoc = await adminDb
          .collection("organizations")
          .doc(organizationId)
          .get();

        if (!orgDoc.exists) {
          throw new Error(`Organization ${organizationId} not found`);
        }

        const org = { id: orgDoc.id, ...orgDoc.data() } as Organization;

        const instagramChannel = org.channels?.find(
          (c: Channel) => c.provider === "instagram" && c.isActive
        );

        if (!instagramChannel) {
          throw new Error("No Instagram account connected");
        }

        return {
          accessToken: decryptToken(instagramChannel.accessToken),
          igUserId: instagramChannel.providerAccountId,
        };
      }
    );

    // Step 3: Create media containers
    const finalContainerId = await step.run("create-containers", async () => {
      const media = post.media!;
      const caption = post.content || "";

      if (media.length === 1) {
        // Single media post
        const item = media[0];
        if (item.type === "image") {
          const container = await createImageContainer(
            accessToken,
            igUserId,
            item.url,
            caption
          );
          return container.id;
        } else {
          // Video
          const container = await createVideoContainer(
            accessToken,
            igUserId,
            item.url,
            caption,
            "REELS"
          );
          await waitForContainerReady(accessToken, container.id);
          return container.id;
        }
      } else {
        // Carousel post
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

        return carouselContainer.id;
      }
    });

    // Step 4: Publish to Instagram
    const publishResult = await step.run("publish-to-instagram", async () => {
      return await publishMediaContainer(
        accessToken,
        igUserId,
        finalContainerId
      );
    });

    // Step 5: Update post in Firestore
    await step.run("update-post-status", async () => {
      await adminDb.collection("posts").doc(postId).update({
        status: "posted",
        instagramMediaId: publishResult.id,
        publishedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return {
      success: true,
      postId,
      instagramMediaId: publishResult.id,
      message: "Successfully published scheduled post to Instagram",
    };
  }
);

// Export all functions as an array for easy registration
export const functions = [publishScheduledPost];
