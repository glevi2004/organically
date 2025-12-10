import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/firebase/firebaseAdmin";

/**
 * GET - Check the status of a data deletion request
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Missing confirmation code" },
      { status: 400 }
    );
  }

  try {
    const docRef = adminDb.collection("data_deletion_requests").doc(code);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: "Deletion request not found" },
        { status: 404 }
      );
    }

    const data = docSnap.data();

    return NextResponse.json({
      confirmationCode: data?.confirmationCode,
      status: data?.status,
      requestedAt:
        data?.requestedAt?.toDate?.()?.toISOString() || data?.requestedAt,
      completedAt:
        data?.completedAt?.toDate?.()?.toISOString() || data?.completedAt,
      channelsRemoved: data?.channelsRemoved,
    });
  } catch (error) {
    console.error("Error checking deletion status:", error);
    return NextResponse.json(
      { error: "Failed to check status" },
      { status: 500 }
    );
  }
}
