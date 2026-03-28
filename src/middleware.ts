import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Exclude API routes, Next.js internals, and static assets from middleware
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|logo\\.png|Koko|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)",
  ],
};
