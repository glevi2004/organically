import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const organizationId = searchParams.get("organizationId");

  if (!organizationId) {
    return NextResponse.json(
      { error: "Missing organizationId" },
      { status: 400 }
    );
  }

  // Check if Instagram Embedded OAuth URL is configured (recommended)
  const embeddedOAuthUrl = process.env.INSTAGRAM_EMBEDDED_OAUTH;

  if (!embeddedOAuthUrl) {
    console.error("INSTAGRAM_EMBEDDED_OAUTH environment variable is not set");
    return NextResponse.json(
      {
        error:
          "Instagram integration not configured. Please set INSTAGRAM_EMBEDDED_OAUTH in environment variables.",
      },
      { status: 500 }
    );
  }

  // Generate state parameter (includes organizationId for callback)
  const state = Buffer.from(
    JSON.stringify({
      organizationId,
      nonce: crypto.randomUUID(),
    })
  ).toString("base64");

  // Store state in cookie for verification
  const cookieStore = await cookies();
  cookieStore.set("instagram_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600, // 10 minutes
    sameSite: "lax",
  });

  // Use the embedded OAuth URL from Meta and append our state parameter
  const instagramAuthUrl = new URL(embeddedOAuthUrl);
  instagramAuthUrl.searchParams.set("state", state);

  console.log(
    "🔗 Redirecting to Instagram OAuth:",
    instagramAuthUrl.toString()
  );

  return NextResponse.redirect(instagramAuthUrl.toString());
}
