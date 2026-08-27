/**
 * /api/auth/firebase-verify
 *
 * Receives a Firebase ID token from the client (after Google Sign-In or
 * Phone OTP verification via Firebase). Verifies the token server-side
 * using Google's public key endpoint (no firebase-admin SDK required).
 * Upserts / links the MongoDB user and issues the secure HTTP-only session cookie.
 *
 * SECURITY NOTES:
 * - The idToken is verified cryptographically against Google's JWKS; never trust raw UIDs from client.
 * - Firebase Admin credentials are NOT required (uses Google's public certs endpoint).
 * - The resulting session is a standard JWT stored in an HTTP-only cookie — same system as before.
 */

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CUSTOMER_SESSION_COOKIE, setSessionCookie, signSession } from "@/lib/auth";
import { toClientUser } from "@/lib/serializers";
import User from "@/models/User";

// ─────────────────────────────────────────────────────────────────────────────
// Firebase Token Verification (using Google's public certs — no Admin SDK)
// ─────────────────────────────────────────────────────────────────────────────

interface FirebaseTokenPayload {
  uid: string;
  sub: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  phone_number?: string;
  firebase?: {
    identities?: {
      phone?: string[];
      email?: string[];
      "google.com"?: string[];
    };
    sign_in_provider?: string;
  };
}

/**
 * Verifies a Firebase ID token using Google's public key endpoint.
 * Returns the decoded payload or throws on invalid token.
 */
async function verifyFirebaseToken(idToken: string): Promise<FirebaseTokenPayload> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("Firebase project ID not configured");

  // Decode the JWT header to find the kid (key ID)
  const parts = idToken.split(".");
  if (parts.length !== 3) throw new Error("Invalid token format");

  const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as FirebaseTokenPayload;

  // Validate basic claims
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) throw new Error("Token expired");
  if (payload.iat > now + 5) throw new Error("Token used before issued");
  if (payload.aud !== projectId) throw new Error("Token audience mismatch");
  if (!payload.iss?.startsWith("https://securetoken.google.com/")) throw new Error("Invalid token issuer");
  if (!payload.sub) throw new Error("Missing subject");

  // Fetch Google's public keys
  const certsResp = await fetch(
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
    { next: { revalidate: 3600 } }
  );
  if (!certsResp.ok) throw new Error("Failed to fetch Google public certs");
  const certs = await certsResp.json() as Record<string, string>;

  const certPem = certs[header.kid];
  if (!certPem) throw new Error("Unknown key ID in token");

  // Import the certificate as a Web Crypto key
  const pemBody = certPem
    .replace(/-----BEGIN CERTIFICATE-----/g, "")
    .replace(/-----END CERTIFICATE-----/g, "")
    .replace(/\s/g, "");
  const derBuffer = Buffer.from(pemBody, "base64");

  const cryptoKey = await crypto.subtle.importKey(
    "spki",
    derBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  // Build the signed data (header.payload)
  const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  const signature = Buffer.from(parts[2], "base64url");

  const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", cryptoKey, signature, signedData);
  if (!valid) throw new Error("Token signature verification failed");

  return payload;
}

// ─────────────────────────────────────────────────────────────────────────────
// POST Handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { idToken } = body;

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { success: false, message: "Authentication token is required." },
        { status: 400 }
      );
    }

    // Verify the Firebase ID token
    let payload: FirebaseTokenPayload;
    try {
      payload = await verifyFirebaseToken(idToken);
    } catch (err: any) {
      console.error("Firebase token verification failed:", err?.message);
      return NextResponse.json(
        { success: false, message: "Authentication failed. Please try signing in again." },
        { status: 401 }
      );
    }

    const firebaseUid = payload.uid || payload.sub;
    const signInProvider = payload.firebase?.sign_in_provider || "unknown";
    const firebaseEmail = payload.email || "";
    const emailVerified = payload.email_verified || false;
    const firebasePhone = payload.phone_number || "";
    const firebaseName = payload.name || "";
    const firebasePicture = payload.picture || "";

    await connectToDatabase();

    // ── Build lookup: prefer firebaseUid, then fall back to verified email/phone ──
    const orConditions: Record<string, any>[] = [{ firebaseUid }];
    if (emailVerified && firebaseEmail) {
      orConditions.push({ email: { $regex: `^${firebaseEmail}$`, $options: "i" } });
    }
    if (firebasePhone) {
      orConditions.push({ phone: firebasePhone.replace(/^\+91/, "") });
      orConditions.push({ phone: firebasePhone });
    }

    const existingUser = await User.findOne({ $or: orConditions });

    // Determine provider mapping
    let providerField: "google" | "phone" | "email" = "email";
    if (signInProvider === "google.com") providerField = "google";
    else if (signInProvider === "phone") providerField = "phone";

    let dbUser;
    if (existingUser) {
      // Link Firebase UID to existing record; merge any new data
      const updateSet: Record<string, any> = {
        firebaseUid,
        lastLoginAt: new Date(),
        provider: providerField,
      };
      if (firebaseName && !existingUser.name) updateSet.name = firebaseName;
      if (firebasePicture && !existingUser.avatar) updateSet.avatar = firebasePicture;
      if (emailVerified && firebaseEmail && !existingUser.email) updateSet.email = firebaseEmail;
      if (firebasePhone && !existingUser.phone) {
        updateSet.phone = firebasePhone.replace(/^\+91/, "");
      }

      dbUser = await User.findByIdAndUpdate(existingUser._id, { $set: updateSet }, { new: true });
    } else {
      // New user — create MongoDB record
      const phone = firebasePhone ? firebasePhone.replace(/^\+91/, "") : "";
      dbUser = await User.create({
        firebaseUid,
        name: firebaseName || (firebaseEmail ? firebaseEmail.split("@")[0] : "Tech AI Customer"),
        email: emailVerified ? firebaseEmail : "",
        phone: signInProvider === "phone" ? phone : `google:${firebaseUid}`,
        avatar: firebasePicture || "",
        googleId: signInProvider === "google.com" ? firebaseUid : "",
        provider: providerField,
        lastLoginAt: new Date(),
      });
    }

    if (!dbUser) {
      return NextResponse.json({ success: false, message: "User account could not be created." }, { status: 500 });
    }

    const clientUser = toClientUser(dbUser);
    const sessionToken = signSession({
      id: clientUser.id,
      phone: clientUser.phone,
      email: clientUser.email,
      name: clientUser.name,
      role: "customer",
    });

    const response = NextResponse.json({
      success: true,
      message: "Signed in successfully.",
      user: clientUser,
    });
    setSessionCookie(response, CUSTOMER_SESSION_COOKIE, sessionToken);
    return response;
  } catch (error) {
    console.error("firebase-verify endpoint error:", error);
    return NextResponse.json(
      { success: false, message: "Server error during authentication. Please try again." },
      { status: 500 }
    );
  }
}
