/**
 * DEPRECATED — Legacy Google OAuth redirect handler
 *
 * This route has been superseded by Firebase Authentication (Google Sign-In via popup).
 * Firebase handles Google OAuth entirely on the client side; the Firebase ID token
 * is then verified server-side at /api/auth/firebase-verify.
 *
 * This file is kept as a tombstone to return a clear error if the old URL is hit
 * (e.g., from a cached redirect or old client).
 */

import { NextResponse } from "next/server";

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  // Redirect to home — Firebase Google popup handles sign-in now
  return NextResponse.redirect(new URL("/", appUrl));
}
