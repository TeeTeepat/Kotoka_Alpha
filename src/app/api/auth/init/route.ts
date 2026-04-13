import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { cookies } from "next/headers";

export async function GET() {
  const session = await auth();
  return NextResponse.json({
    authenticated: !!session?.user,
    user: session?.user ?? null,
  });
}

export async function POST() {
  // For NextAuth, user creation is automatic via Prisma adapter
  // This endpoint exists for backward compatibility but doesn't need
  // to create anonymous users anymore
  const session = await auth();

  return NextResponse.json({
    authenticated: !!session?.user,
    user: session?.user ?? null,
  });
}
