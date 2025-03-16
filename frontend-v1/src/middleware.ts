import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export default authMiddleware({
  // Ensure the middleware runs on the dashboard routes
  afterAuth(auth, req) {
    // Handle custom logic after authentication
    const headers = new Headers(req.headers);
    const response = NextResponse.next({
      request: {
        headers: headers,
      },
    });
    return response;
  },
});

export const config = {
  matcher: [
    // Protect all routes under /dashboard
    "/dashboard/:path*",
    // Protect all API routes
    "/api/:path*",
    /*
     * Match all request paths except for the ones starting with:
     * - _next
     * - static (static files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!static|.*\\..*|_next|favicon.ico).*)",
  ],
}; 