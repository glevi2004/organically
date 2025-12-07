import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminDb } from "@/firebase/firebaseAdmin";
import { encryptToken } from "@/lib/encryption";
import { FieldValue } from "firebase-admin/firestore";

// Get the correct base URL (handles ngrok/proxy scenarios)
function getBaseUrl(request: NextRequest): string {
  // First, check forwarded headers from ngrok/proxy (most reliable, no restart needed)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  // Fallback to request origin (works for direct access)
  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorReason = searchParams.get("error_reason");
  const errorDescription = searchParams.get("error_description");

  // Use our helper to get the correct base URL (handles ngrok)
  const baseUrl = getBaseUrl(request);

  console.log("🔍 OAuth Callback Debug:");
  console.log("  - baseUrl:", baseUrl);
  console.log(
    "  - state from URL:",
    state ? state.substring(0, 30) + "..." : "none"
  );
  console.log("  - code received:", code ? "yes" : "no");

  // Parse state to get organizationId FIRST (needed for all redirects)
  let organizationId: string = "";
  try {
    if (state) {
      const stateData = JSON.parse(Buffer.from(state, "base64").toString());
      organizationId = stateData.organizationId;
      console.log("  - organizationId:", organizationId);
    }
  } catch (e) {
    console.error("Failed to parse state:", e);
  }

  // Helper for redirects - always includes organization path when available
  const getRedirectUrl = (path: string, query: string) => {
    const orgPath = organizationId ? `/organization/${organizationId}` : "";
    return `${baseUrl}${orgPath}${path}?${query}`;
  };

  // Handle user denial or errors
  if (error) {
    console.error("Instagram OAuth error:", {
      error,
      errorReason,
      errorDescription,
    });
    return NextResponse.redirect(
      getRedirectUrl("/settings", "error=instagram_denied")
    );
  }

  // Verify state parameter
  const cookieStore = await cookies();
  const storedState = cookieStore.get("instagram_oauth_state")?.value;

  console.log("  - stored cookie:", storedState ? "found" : "NOT FOUND");
  console.log("  - states match:", state === storedState);

  // State validation with dev mode bypass for ngrok cookie issues
  const isDev = process.env.NODE_ENV === "development";
  if (!state || state !== storedState) {
    console.error("State validation failed:", {
      hasState: !!state,
      hasStoredState: !!storedState,
      match: state === storedState,
    });

    // In development, if we have a valid state with organizationId, proceed anyway
    // This works around ngrok's interstitial page breaking cookies
    if (isDev && state && organizationId) {
      console.warn(
        "⚠️ Skipping state validation in dev mode (ngrok cookie issue)"
      );
    } else {
      return NextResponse.redirect(
        getRedirectUrl("/settings", "error=invalid_state")
      );
    }
  }

  // Check required environment variables
  const instagramAppId = process.env.INSTAGRAM_APP_ID;
  const instagramAppSecret = process.env.INSTAGRAM_APP_SECRET;

  if (!instagramAppId || !instagramAppSecret) {
    console.error("Missing Instagram credentials in environment variables");
    return NextResponse.redirect(
      getRedirectUrl("/settings", "error=instagram_failed")
    );
  }

  try {
    // Get redirect_uri for token exchange - MUST match the one used in authorization
    // Extract from embedded OAuth URL (which has the correct ngrok URL with trailing slash)
    let redirectUri: string | undefined;

    if (process.env.INSTAGRAM_EMBEDDED_OAUTH) {
      try {
        const embeddedUrl = new URL(process.env.INSTAGRAM_EMBEDDED_OAUTH);
        redirectUri = embeddedUrl.searchParams.get("redirect_uri") || undefined;
      } catch {
        console.error("Failed to parse INSTAGRAM_EMBEDDED_OAUTH URL");
      }
    }

    // Fallback to env var or constructed URL
    if (!redirectUri) {
      redirectUri =
        process.env.INSTAGRAM_REDIRECT_URI ||
        `${baseUrl}/api/auth/instagram/callback/`;
    }

    console.log("🔗 Token exchange redirect_uri:", redirectUri);
    console.log(
      "🔗 Authorization code received:",
      code?.substring(0, 20) + "..."
    );

    // Step 1: Exchange code for short-lived access token
    const tokenResponse = await fetch(
      "https://api.instagram.com/oauth/access_token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: instagramAppId,
          client_secret: instagramAppSecret,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
          code: code!,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange failed:", errorData);
      throw new Error("Failed to exchange code for token");
    }

    const tokenData = await tokenResponse.json();
    console.log("✅ Token exchange successful");

    // Step 2: Exchange short-lived token for long-lived token (60 days)
    const longLivedResponse = await fetch(
      `https://graph.instagram.com/access_token?` +
        `grant_type=ig_exchange_token&` +
        `client_secret=${instagramAppSecret}&` +
        `access_token=${tokenData.access_token}`
    );

    if (!longLivedResponse.ok) {
      const errorData = await longLivedResponse.text();
      console.error("Long-lived token exchange failed:", errorData);
      throw new Error("Failed to get long-lived token");
    }

    const longLivedData = await longLivedResponse.json();
    console.log("✅ Long-lived token obtained");

    // Step 3: Get user profile info
    const profileResponse = await fetch(
      `https://graph.instagram.com/me?fields=user_id,username,account_type,profile_picture_url&access_token=${longLivedData.access_token}`
    );

    if (!profileResponse.ok) {
      const errorData = await profileResponse.text();
      console.error("Profile fetch failed:", errorData);
      throw new Error("Failed to get Instagram profile");
    }

    const profile = await profileResponse.json();
    console.log("✅ Profile fetched:", profile.username);

    // Encrypt the token before storing
    const encryptedToken = encryptToken(longLivedData.access_token);

    // Calculate expiration date (default 60 days if not provided)
    const expiresIn = longLivedData.expires_in || 5184000; // 60 days in seconds
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    // Create channel object
    const channel = {
      id: `ch_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      provider: "instagram",
      providerAccountId: profile.user_id || tokenData.user_id,
      accountName: profile.username,
      accountType: profile.account_type, // 'BUSINESS' or 'MEDIA_CREATOR'
      accessToken: encryptedToken,
      tokenExpiresAt: expiresAt,
      isActive: true,
      connectedAt: new Date(),
      profileImageUrl: profile.profile_picture_url || null,
    };

    // Add channel to organization
    const orgRef = adminDb.collection("organizations").doc(organizationId);
    await orgRef.update({
      channels: FieldValue.arrayUnion(channel),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log("✅ Channel saved to Firestore");

    // Clear OAuth state cookie
    cookieStore.delete("instagram_oauth_state");

    return NextResponse.redirect(
      getRedirectUrl("/settings", "success=instagram_connected")
    );
  } catch (error) {
    console.error("Instagram OAuth error:", error);
    return NextResponse.redirect(
      getRedirectUrl("/settings", "error=instagram_failed")
    );
  }
}
