import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/firebase/firebaseAdmin";
import { decryptToken } from "@/lib/encryption";
import { Channel, Organization } from "@/types/organization";
import { getInstagramMedia, InstagramMedia } from "@/services/instagramService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channelId");
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const after = searchParams.get("after") || undefined;

    if (!channelId) {
      return NextResponse.json(
        { error: "channelId is required" },
        { status: 400 }
      );
    }

    // Fetch all organizations to find the one with this channel
    // Note: In production, you might want to optimize this with a query
    const orgsSnapshot = await adminDb.collection("organizations").get();
    
    let targetChannel: Channel | null = null;
    let targetOrganization: Organization | null = null;

    for (const orgDoc of orgsSnapshot.docs) {
      const org = { id: orgDoc.id, ...orgDoc.data() } as Organization;
      const channel = org.channels?.find((c: Channel) => c.id === channelId);
      
      if (channel && channel.isActive) {
        targetChannel = channel;
        targetOrganization = org;
        break;
      }
    }

    if (!targetChannel || !targetOrganization) {
      return NextResponse.json(
        { error: "Channel not found or not active" },
        { status: 404 }
      );
    }

    // Fetch Instagram posts using the channel
    const mediaResponse = await getInstagramMedia(targetChannel, limit, after);

    // Format response
    const response = {
      data: mediaResponse.data.map((media: InstagramMedia) => ({
        id: media.id,
        caption: media.caption || "",
        media_type: media.media_type,
        thumbnail_url: media.thumbnail_url || media.media_url,
        permalink: media.permalink,
        timestamp: media.timestamp,
      })),
      paging: mediaResponse.paging,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching Instagram posts:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch Instagram posts",
      },
      { status: 500 }
    );
  }
}

