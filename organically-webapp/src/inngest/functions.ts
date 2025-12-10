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
  replyToComment,
  sendPrivateReply,
  sendDirectMessage,
} from "@/services/instagramService";
import { FieldValue } from "firebase-admin/firestore";
import {
  TriggerNodeData,
  ActionNodeData,
  DelayNodeData,
} from "@/types/workflow";
import {
  InstagramWebhookEventData,
  AutomationProcessingData,
} from "@/types/instagram";
import {
  matchesKeywords,
  matchesPostFilter,
} from "@/services/automationService";

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

// ============================================================================
// Instagram Webhook Processing
// Types imported from @/types/instagram
// ============================================================================

/**
 * Process Instagram webhooks for automations
 * Triggered when a comment or DM is received
 */
export const processInstagramWebhook = inngest.createFunction(
  {
    id: "process-instagram-webhook",
    retries: 3,
  },
  { event: "instagram/webhook.received" },
  async ({ event, step }) => {
    const data = event.data as InstagramWebhookEventData;
    const {
      type,
      organizationId,
      channelId,
      senderId,
      text,
      commentId,
      mediaId,
    } = data;

    // Step 1: Find active automations for this channel
    const automations = await step.run("find-automations", async () => {
      const automationsSnapshot = await adminDb
        .collection("organizations")
        .doc(organizationId)
        .collection("automations")
        .where("channelId", "==", channelId)
        .where("isActive", "==", true)
        .get();

      // Extract only the fields we need for processing (JSON-serializable)
      return automationsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          channelId: data.channelId as string,
          isActive: data.isActive as boolean,
          nodes: (
            data.nodes as Array<{
              id: string;
              type: string;
              data: Record<string, unknown>;
            }>
          ).map((n) => ({
            id: n.id,
            type: n.type,
            data: n.data,
          })),
        } as AutomationProcessingData;
      });
    });

    if (automations.length === 0) {
      return {
        success: true,
        message: "No active automations found for this channel",
        triggered: 0,
      };
    }

    // Step 2: Find matching automations based on trigger type and keywords
    const matchingAutomations = await step.run("match-keywords", async () => {
      const matches: Array<{
        automationId: string;
        trigger: TriggerNodeData;
        action: ActionNodeData;
        delay?: DelayNodeData;
      }> = [];

      for (const automation of automations) {
        // Find the trigger node
        const triggerNode = automation.nodes.find((n) => n.type === "trigger");
        if (!triggerNode) continue;

        const triggerData = triggerNode.data as Record<string, unknown>;
        if (triggerData.nodeType !== "trigger") continue;

        const trigger = triggerData as unknown as TriggerNodeData;

        // Check if trigger type matches the event type
        const eventMatchesTrigger =
          (type === "message" && trigger.type === "direct_message") ||
          (type === "comment" && trigger.type === "post_comment");

        if (!eventMatchesTrigger) continue;

        // For comment triggers, check post filter
        if (type === "comment" && trigger.type === "post_comment") {
          if (!matchesPostFilter(mediaId || "", trigger.postIds)) {
            continue;
          }
        }

        // Check keyword matching
        const keywords = trigger.keywords || [];
        const matchType = trigger.matchType || "contains";
        const caseSensitive = trigger.caseSensitive || false;

        if (!matchesKeywords(text, keywords, matchType, caseSensitive)) {
          continue;
        }

        // Find the action node
        const actionNode = automation.nodes.find((n) => n.type === "action");
        if (!actionNode) continue;

        const actionData = actionNode.data as Record<string, unknown>;
        if (actionData.nodeType !== "action") continue;

        const action = actionData as unknown as ActionNodeData;

        // Find optional delay node
        const delayNode = automation.nodes.find((n) => n.type === "delay");
        let delay: DelayNodeData | undefined;
        if (delayNode) {
          const delayData = delayNode.data as Record<string, unknown>;
          if (delayData.nodeType === "delay") {
            delay = delayData as unknown as DelayNodeData;
          }
        }

        matches.push({
          automationId: automation.id,
          trigger,
          action,
          delay,
        });
      }

      return matches;
    });

    if (matchingAutomations.length === 0) {
      return {
        success: true,
        message: "No automations matched the message",
        triggered: 0,
      };
    }

    // Step 3: Get Instagram credentials
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
          (c: Channel) => c.id === channelId && c.provider === "instagram"
        );

        if (!instagramChannel) {
          throw new Error("Instagram channel not found");
        }

        return {
          accessToken: decryptToken(instagramChannel.accessToken),
          igUserId: instagramChannel.providerAccountId,
        };
      }
    );

    // Step 4: Process each matching automation
    const results: Array<{
      automationId: string;
      success: boolean;
      error?: string;
    }> = [];

    for (const match of matchingAutomations) {
      const { automationId, action, delay } = match;

      try {
        // Apply delay if configured
        if (delay && delay.duration > 0) {
          const delayMs = convertDelayToMs(delay.duration, delay.unit);
          await step.sleep(`delay-${automationId}`, delayMs);
        }

        // Generate the response message
        const responseMessage = await step.run(
          `generate-response-${automationId}`,
          async () => {
            // For now, use the template directly
            // TODO: Add AI response generation if messageTemplate contains {{ai}}
            let message = action.messageTemplate || "Thanks for your message!";

            // Replace placeholders
            message = message.replace(/\{\{message\}\}/g, text);
            message = message.replace(
              /\{\{username\}\}/g,
              data.senderUsername || "there"
            );

            return message;
          }
        );

        // Send the response based on action type
        await step.run(`send-response-${automationId}`, async () => {
          switch (action.type) {
            case "send_message":
              // Send DM to the user
              if (type === "comment" && commentId) {
                // For comments, use private reply (DM with comment context)
                await sendPrivateReply(
                  accessToken,
                  igUserId,
                  commentId,
                  responseMessage
                );
              } else {
                // For DMs, send a direct message back
                await sendDirectMessage(
                  accessToken,
                  igUserId,
                  senderId,
                  responseMessage
                );
              }
              break;

            case "reply_comment":
              // Reply publicly to the comment
              if (commentId) {
                await replyToComment(accessToken, commentId, responseMessage);
              }
              break;

            default:
              console.warn(`Unknown action type: ${action.type}`);
          }
        });

        // Update automation stats
        await step.run(`update-stats-${automationId}`, async () => {
          await adminDb
            .collection("organizations")
            .doc(organizationId)
            .collection("automations")
            .doc(automationId)
            .update({
              triggerCount: FieldValue.increment(1),
              lastTriggeredAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });
        });

        results.push({ automationId, success: true });
      } catch (error) {
        console.error(`Error processing automation ${automationId}:`, error);
        results.push({
          automationId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: true,
      message: `Processed ${matchingAutomations.length} automations`,
      triggered: results.filter((r) => r.success).length,
      results,
    };
  }
);

/**
 * Convert delay duration to milliseconds
 */
function convertDelayToMs(
  duration: number,
  unit: "seconds" | "minutes" | "hours" | "days"
): number {
  switch (unit) {
    case "seconds":
      return duration * 1000;
    case "minutes":
      return duration * 60 * 1000;
    case "hours":
      return duration * 60 * 60 * 1000;
    case "days":
      return duration * 24 * 60 * 60 * 1000;
    default:
      return duration * 1000;
  }
}

// Export all functions as an array for easy registration
export const functions = [publishScheduledPost, processInstagramWebhook];
