import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";
import { adminDb } from "@/firebase/firebaseAdmin";
import { Post } from "@/types/post";

interface ScheduleRequestBody {
  postId: string;
  organizationId: string;
  scheduledDate: string; // ISO date string
}

export async function POST(request: NextRequest) {
  try {
    const body: ScheduleRequestBody = await request.json();
    const { postId, organizationId, scheduledDate } = body;

    if (!postId || !organizationId || !scheduledDate) {
      return NextResponse.json(
        { error: "postId, organizationId, and scheduledDate are required" },
        { status: 400 }
      );
    }

    const scheduledTime = new Date(scheduledDate);

    // Validate scheduled time is in the future
    if (scheduledTime.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: "Scheduled time must be in the future" },
        { status: 400 }
      );
    }

    // Verify post exists and has media
    const postDoc = await adminDb.collection("posts").doc(postId).get();
    if (!postDoc.exists) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const post = { id: postDoc.id, ...postDoc.data() } as Post;

    if (!post.media || post.media.length === 0) {
      return NextResponse.json(
        { error: "Post must have at least one media item to schedule" },
        { status: 400 }
      );
    }

    if (post.status === "posted") {
      return NextResponse.json(
        { error: "Post has already been published" },
        { status: 400 }
      );
    }

    // Send event to Inngest with the scheduled time
    // The `ts` parameter tells Inngest when to run the function
    // We also pass the scheduledDate so Inngest can verify it matches (handles re-scheduling)
    console.log("[Schedule API] Sending event to Inngest:", {
      postId,
      organizationId,
      scheduledDate: scheduledTime.toISOString(),
      ts: scheduledTime.getTime(),
    });

    const sendResult = await inngest.send({
      name: "post/schedule-publish",
      data: {
        postId,
        organizationId,
        scheduledDate: scheduledTime.toISOString(),
      },
      ts: scheduledTime.getTime(),
    });

    console.log("[Schedule API] Inngest send result:", sendResult);

    // Update post status to "ready" and store the scheduled date
    await adminDb.collection("posts").doc(postId).update({
      status: "ready",
      scheduledDate: scheduledTime,
      updatedAt: new Date(),
    });

    console.log("[Schedule API] Post updated to ready status");

    return NextResponse.json({
      success: true,
      message: `Post scheduled for ${scheduledTime.toISOString()}`,
      scheduledDate: scheduledTime.toISOString(),
    });
  } catch (error) {
    console.error("Schedule post error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to schedule post",
      },
      { status: 500 }
    );
  }
}

// Cancel a scheduled post
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { error: "postId is required" },
        { status: 400 }
      );
    }

    // Update post status back to draft
    await adminDb.collection("posts").doc(postId).update({
      status: "draft",
      scheduledDate: null,
      updatedAt: new Date(),
    });

    // Note: Inngest doesn't have a built-in way to cancel scheduled events
    // The function will run but will see the post is no longer "ready" status
    // and will skip publishing

    return NextResponse.json({
      success: true,
      message: "Scheduled post cancelled",
    });
  } catch (error) {
    console.error("Cancel scheduled post error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to cancel scheduled post",
      },
      { status: 500 }
    );
  }
}
