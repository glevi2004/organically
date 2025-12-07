import { NextRequest, NextResponse } from "next/server";
import { getAccessToken, verifyCredentials } from "@/lib/twitter-oauth";
import { cookies } from "next/headers";
import { adminDb } from "@/firebase/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { encrypt } from "@/lib/encryption";

/**
 * GET /api/auth/twitter/callback
 *
 * Handles the callback from Twitter after user authorization:
 * 1. Receives oauth_token and oauth_verifier from Twitter
 * 2. Validates CSRF state and profile ownership
 * 3. Exchanges for permanent access token
 * 4. Stores encrypted tokens in Firestore under the user's profile
 * 5. Redirects user back to the app
 */
export async function GET(request: NextRequest) {
  // Helper to clear all OAuth cookies
  const clearOAuthCookies = async () => {
    const cookieStore = await cookies();
    cookieStore.delete("twitter_oauth_token_secret");
    cookieStore.delete("twitter_oauth_profile_id");
    cookieStore.delete("twitter_oauth_user_id");
    cookieStore.delete("twitter_oauth_state");
  };

  try {
    const searchParams = request.nextUrl.searchParams;
    const oauthToken = searchParams.get("oauth_token");
    const oauthVerifier = searchParams.get("oauth_verifier");

    // Retrieve stored data from cookies
    const cookieStore = await cookies();
    const tokenSecret = cookieStore.get("twitter_oauth_token_secret")?.value;
    const profileId = cookieStore.get("twitter_oauth_profile_id")?.value;
    const userId = cookieStore.get("twitter_oauth_user_id")?.value;
    const storedState = cookieStore.get("twitter_oauth_state")?.value;

    // Helper for error redirects
    const errorRedirect = (error: string) => {
      const basePath = profileId ? `/profile/${profileId}/settings` : "/";
      return NextResponse.redirect(
        new URL(`${basePath}?error=${error}`, request.nextUrl.origin)
      );
    };

    // Check if user denied authorization
    const denied = searchParams.get("denied");
    if (denied) {
      await clearOAuthCookies();
      return errorRedirect("twitter_denied");
    }

    // Validate all required parameters
    if (!oauthToken || !oauthVerifier) {
      await clearOAuthCookies();
      return errorRedirect("twitter_missing_params");
    }

    if (!tokenSecret) {
      await clearOAuthCookies();
      return errorRedirect("twitter_session_expired");
    }

    if (!profileId) {
      await clearOAuthCookies();
      return errorRedirect("twitter_missing_profile");
    }

    if (!userId) {
      await clearOAuthCookies();
      return errorRedirect("twitter_missing_user");
    }

    // CSRF Protection: Verify state parameter
    if (!storedState) {
      await clearOAuthCookies();
      return errorRedirect("twitter_csrf_error");
    }

    // Exchange request token for access token
    const accessTokenData = await getAccessToken(
      oauthToken,
      tokenSecret,
      oauthVerifier
    );

    // Verify credentials to get user info (optional, non-blocking)
    let userInfo;
    try {
      userInfo = await verifyCredentials(
        accessTokenData.oauth_token,
        accessTokenData.oauth_token_secret
      );
    } catch {
      // Continue without full user info
    }

    // Encrypt tokens before storing
    const encryptedAccessToken = encrypt(accessTokenData.oauth_token);
    const encryptedAccessTokenSecret = encrypt(
      accessTokenData.oauth_token_secret
    );

    // Get the profile and validate ownership
    const profileRef = adminDb.collection("profiles").doc(profileId);
    const profileDoc = await profileRef.get();

    // Security: Validate that the user owns this profile
    if (profileDoc.exists) {
      const profileData = profileDoc.data();
      if (profileData?.userId !== userId) {
        await clearOAuthCookies();
        return errorRedirect("twitter_unauthorized");
      }
    } else {
      // Profile doesn't exist - this shouldn't happen in normal flow
      await clearOAuthCookies();
      return errorRedirect("twitter_profile_not_found");
    }

    // Store encrypted tokens in Firestore
    const twitterConnection = {
      accessToken: encryptedAccessToken,
      accessTokenSecret: encryptedAccessTokenSecret,
      userId: accessTokenData.user_id,
      screenName: accessTokenData.screen_name,
      name: userInfo?.name || null,
      profileImageUrl: userInfo?.profile_image_url_https || null,
      connectedAt: Date.now(),
    };

    await profileRef.update({
      "socialConnections.twitter": twitterConnection,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Clear all OAuth cookies
    await clearOAuthCookies();

    // Redirect back to settings page with success
    return NextResponse.redirect(
      new URL(
        `/profile/${profileId}/settings?twitter=connected`,
        request.nextUrl.origin
      )
    );
  } catch (error) {
    console.error("Twitter OAuth callback error:", error);

    // Clear cookies on error
    await clearOAuthCookies();

    const cookieStore = await cookies();
    const profileId = cookieStore.get("twitter_oauth_profile_id")?.value;
    const basePath = profileId ? `/profile/${profileId}/settings` : "/";

    return NextResponse.redirect(
      new URL(
        `${basePath}?error=twitter_callback_failed`,
        request.nextUrl.origin
      )
    );
  }
}
