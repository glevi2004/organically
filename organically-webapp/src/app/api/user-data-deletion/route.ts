import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/firebase/firebaseAdmin";

// ============================================================================
// Meta Data Deletion Callback
//
// Meta sends a POST request to this endpoint when a user requests deletion
// of their data through Facebook/Instagram settings.
//
// Docs: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
// ============================================================================

/**
 * Verify the signed request from Meta
 */
function parseSignedRequest(
  signedRequest: string,
  appSecret: string
): { user_id: string } | null {
  try {
    const [encodedSig, payload] = signedRequest.split(".");

    if (!encodedSig || !payload) {
      return null;
    }

    // Decode the signature
    const sig = Buffer.from(
      encodedSig.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    );

    // Decode the payload
    const data = JSON.parse(
      Buffer.from(
        payload.replace(/-/g, "+").replace(/_/g, "/"),
        "base64"
      ).toString("utf8")
    );

    // Verify signature
    const expectedSig = crypto
      .createHmac("sha256", appSecret)
      .update(payload)
      .digest();

    if (!crypto.timingSafeEqual(sig, expectedSig)) {
      console.error("Data deletion: signature verification failed");
      return null;
    }

    return data;
  } catch (error) {
    console.error("Data deletion: failed to parse signed request", error);
    return null;
  }
}

/**
 * Generate a unique confirmation code for tracking deletion
 */
function generateConfirmationCode(): string {
  return `del_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
}

/**
 * POST - Handle data deletion callback from Meta
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const signedRequest = formData.get("signed_request");

    if (!signedRequest || typeof signedRequest !== "string") {
      return NextResponse.json(
        { error: "Missing signed_request" },
        { status: 400 }
      );
    }

    const appSecret = process.env.INSTAGRAM_APP_SECRET;
    if (!appSecret) {
      console.error("Data deletion: INSTAGRAM_APP_SECRET not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Parse and verify the signed request
    const data = parseSignedRequest(signedRequest, appSecret);
    if (!data || !data.user_id) {
      return NextResponse.json(
        { error: "Invalid signed request" },
        { status: 400 }
      );
    }

    const igUserId = data.user_id;
    const confirmationCode = generateConfirmationCode();

    console.log(`Data deletion requested for Instagram user: ${igUserId}`);

    // Find and process organizations with this Instagram account
    const orgsSnapshot = await adminDb.collection("organizations").get();
    let deletedCount = 0;

    for (const orgDoc of orgsSnapshot.docs) {
      const orgData = orgDoc.data();
      const channels = orgData.channels || [];

      // Find Instagram channels matching this user ID
      const updatedChannels = channels.filter(
        (channel: { provider: string; providerAccountId: string }) => {
          if (
            channel.provider === "instagram" &&
            channel.providerAccountId === igUserId
          ) {
            deletedCount++;
            return false; // Remove this channel
          }
          return true;
        }
      );

      // If we removed any channels, update the document
      if (updatedChannels.length !== channels.length) {
        await orgDoc.ref.update({ channels: updatedChannels });
        console.log(
          `Removed Instagram channel from organization: ${orgDoc.id}`
        );
      }
    }

    // Store deletion request for status tracking
    await adminDb
      .collection("data_deletion_requests")
      .doc(confirmationCode)
      .set({
        igUserId,
        confirmationCode,
        status: "completed",
        channelsRemoved: deletedCount,
        requestedAt: new Date(),
        completedAt: new Date(),
      });

    // Build the confirmation URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const statusUrl = `${baseUrl}/data-deletion?code=${confirmationCode}`;

    // Return response in Meta's expected format
    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error("Data deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET - Simple health check
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    endpoint: "user-data-deletion",
    description: "This endpoint handles data deletion callbacks from Meta",
  });
}
