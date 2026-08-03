import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, clearSessionCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response, ADMIN_SESSION_COOKIE);
  return response;
}
