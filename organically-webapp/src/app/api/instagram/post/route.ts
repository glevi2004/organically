import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/firebase/firebaseAdmin";
import { decryptToken } from "@/lib/encryption";
import { Post, PostMedia } from "@/types/post";
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

interface PublishRequestBody {
  postId: string;
  organizationId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PublishRequestBody = await request.json();
    const { postId, organizationId } = body;

    if (!postId || !organizationId) {
      return NextResponse.json(
        { error: "postId and organizationId are required" },
        { status: 400 }
      );
    }

    // 1. Fetch post from Firestore
    const postDoc = await adminDb.collection("posts").doc(postId).get();
    if (!postDoc.exists) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const post = { id: postDoc.id, ...postDoc.data() } as Post;

    // Check if post has media
    if (!post.media || post.media.length === 0) {
      return NextResponse.json(
        { error: "Post must have at least one media item to publish" },
        { status: 400 }
      );
    }

    // Check if already posted
    if (post.status === "posted") {
      return NextResponse.json(
        { error: "Post has already been published" },
        { status: 400 }
      );
    }

    // 2. Fetch organization and get Instagram channel
    const orgDoc = await adminDb
      .collection("organizations")
      .doc(organizationId)
      .get();
    if (!orgDoc.exists) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const organization = { id: orgDoc.id, ...orgDoc.data() } as Organization;

    // Find active Instagram channel
    const instagramChannel = organization.channels?.find(
      (c: Channel) => c.provider === "instagram" && c.isActive
    );

    if (!instagramChannel) {
      return NextResponse.json(
        { error: "No Instagram account connected" },
        { status: 400 }
      );
    }

    // Decrypt access token
    const accessToken = decryptToken(instagramChannel.accessToken);
    const igUserId = instagramChannel.providerAccountId;

    // 3. Create containers based on media count
    const media = post.media;
    const caption = post.content || "";
    let finalContainerId: string;

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
        finalContainerId = container.id;
      } else {
        // Video - create container and wait for processing
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
      // Carousel post (multiple media)
      const childIds: string[] = [];

      for (const item of media) {
        const container = await createCarouselItemContainer(
          accessToken,
          igUserId,
          item.url,
          item.type
        );

        // For videos, wait for processing
        if (item.type === "video") {
          await waitForContainerReady(accessToken, container.id);
        }

        childIds.push(container.id);
      }

      // Create carousel container
      const carouselContainer = await createCarouselContainer(
        accessToken,
        igUserId,
        childIds,
        caption
      );
      finalContainerId = carouselContainer.id;
    }

    // 4. Publish the container
    const publishResult = await publishMediaContainer(
      accessToken,
      igUserId,
      finalContainerId
    );

    // 5. Update post in Firestore
    await adminDb
      .collection("posts")
      .doc(postId)
      .update({
        status: "posted",
        instagramMediaId: publishResult.id,
        publishedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({
      success: true,
      instagramMediaId: publishResult.id,
      message: "Successfully published to Instagram",
    });
  } catch (error) {
    console.error("Instagram publish error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to publish to Instagram",
      },
      { status: 500 }
    );
  }
}

