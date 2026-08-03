import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";

export async function GET() {
  const session = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
  return NextResponse.json({ success: !!session && session.role === "admin" });
}
