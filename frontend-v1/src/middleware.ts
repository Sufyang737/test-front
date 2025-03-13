import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default function middleware(request: Request) {
  // Get the pathname
  const pathname = new URL(request.url).pathname;

  // Clone the response and add the pathname to headers
  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);

  // Call Clerk middleware
  return clerkMiddleware()(request, response);
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
}; 