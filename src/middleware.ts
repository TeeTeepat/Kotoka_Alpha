import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Protect all routes except Next.js internals, static assets, and auth pages
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo\\.png|Koko|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico|.*\\.gif|.*\\.webp).*)",
  ],
};
