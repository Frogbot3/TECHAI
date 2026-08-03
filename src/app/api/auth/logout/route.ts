import { NextResponse } from "next/server";
import { clearSessionCookie, CUSTOMER_SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearSessionCookie(response, CUSTOMER_SESSION_COOKIE);
  return response;
}
