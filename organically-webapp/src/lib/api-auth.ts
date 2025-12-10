import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/firebase/firebaseAdmin";

// ============================================================================
// API Route Authentication & Authorization Helpers
// Used by API routes that are called by external services (webhooks, OAuth)
// For client-to-server communication, use Server Actions instead
// ============================================================================

/**
 * Authenticated user information extracted from Firebase token
 */
export interface AuthenticatedUser {
  userId: string;
  email?: string;
}

/**
 * Result type for authentication - either success or error response
 */
export type AuthResult = AuthenticatedUser | NextResponse;

/**
 * Verify Firebase ID token from Authorization header
 * Used by API routes that need authentication
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "Missing or invalid Authorization header" },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return {
      userId: decodedToken.uid,
      email: decodedToken.email,
    };
  } catch (error) {
    console.error("[API Auth] Token verification failed:", error);
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}

/**
 * Check if a user is a member of an organization
 */
export async function verifyOrganizationMembership(
  userId: string,
  organizationId: string
): Promise<boolean> {
  try {
    const orgDoc = await adminDb
      .collection("organizations")
      .doc(organizationId)
      .get();

    if (!orgDoc.exists) return false;
    const users = orgDoc.data()?.users as string[] | undefined;
    return users?.includes(userId) ?? false;
  } catch (error) {
    console.error("[API Auth] Organization membership check failed:", error);
    return false;
  }
}

/**
 * Check if a user owns a post
 */
export async function verifyPostOwnership(
  userId: string,
  postId: string
): Promise<boolean> {
  try {
    const postDoc = await adminDb.collection("posts").doc(postId).get();

    if (!postDoc.exists) return false;
    return postDoc.data()?.userId === userId;
  } catch (error) {
    console.error("[API Auth] Post ownership check failed:", error);
    return false;
  }
}

/**
 * Type guard to check if auth result is an error response
 */
export function isAuthError(result: AuthResult): result is NextResponse {
  return result instanceof NextResponse;
}
