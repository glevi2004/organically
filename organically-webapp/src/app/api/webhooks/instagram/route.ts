import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/firebase/firebaseAdmin";
import { inngest } from "@/inngest/client";
import { Organization } from "@/types/organization";

// ============================================================================
// Instagram Webhook Handler
// Receives real-time notifications for comments and direct messages
// ============================================================================

/**
 * GET - Meta Webhook Verification
 * Called by Meta when setting up the webhook subscription
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Check if this is a subscription verification request
  if (mode === "subscribe") {
    // Verify the token matches our secret
    // Uses INSTAGRAM_TOKEN env var (set in Meta App Dashboard as the Verify Token)
    const verifyToken = process.env.INSTAGRAM_TOKEN;

    if (!verifyToken) {
      console.error("INSTAGRAM_TOKEN not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (token === verifyToken) {
      // Token matches, return the challenge to confirm subscription
      console.log("Instagram webhook verified successfully");
      return new NextResponse(challenge, { status: 200 });
    } else {
      console.error("Instagram webhook verification failed: token mismatch");
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 403 }
      );
    }
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

/**
 * Verify the webhook signature from Meta
 * Uses HMAC-SHA256 with the app secret
 */
function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature) {
    return false;
  }

  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  if (!appSecret) {
    console.error("INSTAGRAM_APP_SECRET not configured");
    return false;
  }

  // Signature format: sha256=<hash>
  const expectedSignature = crypto
    .createHmac("sha256", appSecret)
    .update(payload, "utf8")
    .digest("hex");

  const receivedSignature = signature.replace("sha256=", "");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(receivedSignature, "hex")
  );
}

/**
 * Find organization by Instagram account ID
 */
async function findOrganizationByInstagramId(
  igUserId: string
): Promise<{ organizationId: string; channelId: string } | null> {
  // Query all organizations that have an Instagram channel with this providerAccountId
  const orgsSnapshot = await adminDb.collection("organizations").get();

  for (const orgDoc of orgsSnapshot.docs) {
    const org = { id: orgDoc.id, ...orgDoc.data() } as Organization;

    const instagramChannel = org.channels?.find(
      (c) => c.provider === "instagram" && c.providerAccountId === igUserId
    );

    if (instagramChannel) {
      return {
        organizationId: org.id,
        channelId: instagramChannel.id,
      };
    }
  }

  return null;
}

/**
 * POST - Receive Webhook Events
 * Called by Meta when comments or DMs are received
 */
export async function POST(request: NextRequest) {
  // Get the raw body for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");

  // Verify the signature
  if (!verifySignature(rawBody, signature)) {
    console.error("Instagram webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Parse the webhook payload
  let payload: InstagramWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error("Failed to parse webhook payload");
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Process each entry (there could be multiple)
  const processingPromises: Promise<void>[] = [];

  for (const entry of payload.entry || []) {
    // Process comments
    for (const change of entry.changes || []) {
      if (change.field === "comments" && change.value) {
        processingPromises.push(processCommentWebhook(entry.id, change.value));
      }
    }

    // Process direct messages
    for (const messaging of entry.messaging || []) {
      // Skip echo messages (messages sent by us) to prevent infinite loops
      if (messaging.message?.is_echo) {
        console.log("Skipping echo message (sent by us)");
        continue;
      }
      // Skip deleted/unsend notifications
      if (messaging.message?.is_deleted) {
        console.log("Skipping deleted message notification");
        continue;
      }
      if (messaging.message?.text) {
        processingPromises.push(processMessageWebhook(messaging));
      }
    }
  }

  // Fire and forget - Meta requires response within 2 seconds
  // Don't await these, let Inngest handle the async processing
  Promise.all(processingPromises).catch((error) => {
    console.error("Error processing webhook events:", error);
  });

  // Return 200 immediately to acknowledge receipt
  return NextResponse.json({ received: true }, { status: 200 });
}

/**
 * Process a comment webhook event
 */
async function processCommentWebhook(
  igUserId: string,
  commentData: CommentWebhookValue
): Promise<void> {
  // Only process new comments, not edits or deletes
  if (!commentData.id || !commentData.text) {
    return;
  }

  // Find the organization this Instagram account belongs to
  const orgInfo = await findOrganizationByInstagramId(igUserId);

  if (!orgInfo) {
    console.log(`No organization found for Instagram ID: ${igUserId}`);
    return;
  }

  // Send event to Inngest for processing
  await inngest.send({
    name: "instagram/webhook.received",
    data: {
      type: "comment" as const,
      organizationId: orgInfo.organizationId,
      channelId: orgInfo.channelId,
      senderId: commentData.from?.id || "",
      senderUsername: commentData.from?.username || "",
      text: commentData.text,
      commentId: commentData.id,
      mediaId: commentData.media?.id || "",
      timestamp: Date.now(),
    },
  });
}

/**
 * Process a direct message webhook event
 */
async function processMessageWebhook(
  messaging: MessagingWebhookEntry
): Promise<void> {
  const { sender, recipient, message } = messaging;

  if (!message?.text || !sender?.id || !recipient?.id) {
    return;
  }

  // The recipient is our Instagram account
  const orgInfo = await findOrganizationByInstagramId(recipient.id);

  if (!orgInfo) {
    console.log(`No organization found for Instagram ID: ${recipient.id}`);
    return;
  }

  // Send event to Inngest for processing
  await inngest.send({
    name: "instagram/webhook.received",
    data: {
      type: "message" as const,
      organizationId: orgInfo.organizationId,
      channelId: orgInfo.channelId,
      senderId: sender.id,
      senderUsername: "", // DMs don't include username in webhook
      text: message.text,
      timestamp: Date.now(),
    },
  });
}

// ============================================================================
// Webhook Payload Types
// ============================================================================

interface InstagramWebhookPayload {
  object: "instagram";
  entry?: WebhookEntry[];
}

interface WebhookEntry {
  id: string; // Instagram account ID
  time: number;
  changes?: WebhookChange[];
  messaging?: MessagingWebhookEntry[];
}

interface WebhookChange {
  field: "comments" | "mentions" | "story_insights";
  value: CommentWebhookValue;
}

interface CommentWebhookValue {
  id?: string;
  text?: string;
  from?: {
    id: string;
    username: string;
  };
  media?: {
    id: string;
  };
  parent_id?: string; // If this is a reply to another comment
}

interface MessagingWebhookEntry {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    is_echo?: boolean; // True if this message was sent by us (to prevent loops)
    is_deleted?: boolean; // True if this is an unsend notification
    attachments?: Array<{
      type: string;
      payload: { url: string };
    }>;
  };
}
