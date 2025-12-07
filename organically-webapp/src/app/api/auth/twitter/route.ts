import { NextRequest, NextResponse } from "next/server";
import { getRequestToken, getAuthorizationUrl } from "@/lib/twitter-oauth";
import { cookies } from "next/headers";
import crypto from "crypto";

/**
 * GET /api/auth/twitter
 *
 * Initiates the Twitter OAuth 1.0a 3-legged flow:
 * 1. Gets a request token from Twitter
 * 2. Stores the token secret in a secure cookie
 * 3. Redirects the user to Twitter for authorization
 */
export async function GET(request: NextRequest) {
  try {
    // Get the profileId and userId from query params
    const searchParams = request.nextUrl.searchParams;
    const profileId = searchParams.get("profileId");
    const userId = searchParams.get("userId");

    if (!profileId) {
      return NextResponse.json(
        { error: "Missing profileId parameter" },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    // Determine callback URL based on environment
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const callbackUrl = `${baseUrl}/api/auth/twitter/callback`;

    // Step 1: Get request token from Twitter
    const { oauth_token, oauth_token_secret, oauth_callback_confirmed } =
      await getRequestToken(callbackUrl);

    if (oauth_callback_confirmed !== "true") {
      return NextResponse.json(
        { error: "OAuth callback not confirmed" },
        { status: 500 }
      );
    }

    // Generate CSRF state token
    const state = crypto.randomBytes(16).toString("hex");

    // Store the token secret, profileId, userId, and state in secure HTTP-only cookies
    const cookieStore = await cookies();

    cookieStore.set("twitter_oauth_token_secret", oauth_token_secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes - temporary token
      path: "/",
    });

    cookieStore.set("twitter_oauth_profile_id", profileId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    });

    cookieStore.set("twitter_oauth_user_id", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    });

    cookieStore.set("twitter_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    });

    // Step 2: Redirect user to Twitter for authorization
    const authorizationUrl = getAuthorizationUrl(oauth_token);

    return NextResponse.redirect(authorizationUrl);
  } catch (error) {
    console.error("Twitter OAuth initiation error:", error);
    return NextResponse.json(
      {
        error: "Failed to initiate Twitter OAuth",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
