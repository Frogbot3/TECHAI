/**
 * DEPRECATED — Legacy Google OAuth callback handler
 *
 * This route has been superseded by Firebase Authentication.
 * Firebase handles Google OAuth entirely on the client side; the Firebase ID token
 * is then verified server-side at /api/auth/firebase-verify.
 *
 * This file is kept as a tombstone to gracefully redirect any stale requests.
 */

import { NextResponse } from "next/server";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.redirect(new URL("/", appUrl));
}
