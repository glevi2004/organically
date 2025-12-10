import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ============================================================================
// Next.js Middleware - Shallow Auth Check
//
// This runs on the Edge runtime and provides a fast first-layer check.
// It only verifies the PRESENCE of a Bearer token, not its validity.
// Actual token verification happens in:
// - API routes (for webhook/external calls)
// - Server Actions (for client-initiated operations)
// ============================================================================

/**
 * API routes that don't require authentication
 * These are called by external services, not our frontend
 */
const PUBLIC_API_ROUTES = [
  "/api/webhooks/instagram", // Meta webhook callbacks
  "/api/auth/instagram", // OAuth initiation and callback
  "/api/user-data-deletion", // Meta data deletion callback
  "/api/inngest", // Inngest webhook handler
];

/**
 * Public pages accessible without authentication
 */
const PUBLIC_PAGES = ["/", "/privacy", "/terms", "/data-deletion", "/auth"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public pages
  for (const page of PUBLIC_PAGES) {
    if (pathname === page || pathname.startsWith(`${page}/`)) {
      return NextResponse.next();
    }
  }

  // For API routes, check if public or requires auth
  if (pathname.startsWith("/api/")) {
    // Allow public API routes (webhooks, OAuth, etc.)
    for (const route of PUBLIC_API_ROUTES) {
      if (pathname.startsWith(route)) {
        return NextResponse.next();
      }
    }

    // Protected API routes require Bearer token (shallow check)
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Missing Authorization header with Bearer token",
        },
        { status: 401 }
      );
    }

    // Token present - let route handler verify it
    return NextResponse.next();
  }

  // All other routes pass through
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match API routes
    "/api/:path*",
    // Exclude static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

