import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import PocketBase from "pocketbase";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
// See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your middleware
export default authMiddleware({
  publicRoutes: ["/sign-in", "/sign-up", "/_next/static", "/favicon.ico"],
  async afterAuth(auth, req) {
    // Handle public routes
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/sign-in', req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Handle onboarding redirect
    if (auth.userId && req.nextUrl.pathname === '/dashboard/onboarding') {
      try {
        const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
        const records = await pb.collection('clients').getList(1, 1, {
          filter: `clerk_id = "${auth.userId}"`,
        });

        if (records.items.length > 0 && records.items[0].session_id) {
          const dashboardUrl = new URL('/dashboard', req.url);
          const response = NextResponse.redirect(dashboardUrl);
          return response;
        }
      } catch (error) {
        console.error('Error checking client:', error);
      }
    }

    // Continue with the request without modifying headers
    return NextResponse.next();
  },
});

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)"
  ],
}; 