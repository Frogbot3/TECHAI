/**
 * /api/auth/verify-otp
 *
 * Secure server-side email OTP verifier.
 *
 * SECURITY:
 * - Uses constant-time HMAC comparison to prevent timing attacks
 * - Maximum 5 wrong attempts before OTP is invalidated
 * - OTP expiry enforced
 * - Session cookie issued on success (HTTP-only)
 *
 * NOTE: Phone OTP is now handled by Firebase Client SDK.
 * This endpoint only verifies EMAIL OTP.
 */

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CUSTOMER_SESSION_COOKIE, setSessionCookie, signSession } from "@/lib/auth";
import { toClientUser } from "@/lib/serializers";
import User from "@/models/User";
import { createHmac, timingSafeEqual } from "crypto";

const OTP_SECRET = process.env.JWT_SECRET || "techai_otp_hmac_secret";
const MAX_ATTEMPTS = 5;

function hashOtp(otp: string, email: string): string {
  return createHmac("sha256", OTP_SECRET).update(`${email}:${otp}`).digest("hex");
}

function safeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawEmail = body.email ? String(body.email).trim().toLowerCase() : "";
    const rawOtp = body.otp ? String(body.otp).trim() : "";
    const nameHint = body.name ? String(body.name).trim() : "";

    if (!rawEmail || !rawOtp) {
      return NextResponse.json(
        { success: false, message: "Email address and verification code are required." },
        { status: 400 }
      );
    }

    if (!/^\d{6}$/.test(rawOtp)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid 6-digit verification code." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const dbUser = await User.findOne({
      email: { $regex: `^${rawEmail}$`, $options: "i" },
    });

    // Generic error: do not reveal whether an account exists or OTP was sent
    if (!dbUser || !dbUser.emailOtpHash) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired verification code. Please request a new one." },
        { status: 400 }
      );
    }

    // Check expiry
    if (!dbUser.emailOtpExpiresAt || dbUser.emailOtpExpiresAt < new Date()) {
      // Invalidate the OTP
      await User.findByIdAndUpdate(dbUser._id, {
        $set: { emailOtpHash: null, emailOtpExpiresAt: null, emailOtpAttempts: 0 },
      });
      return NextResponse.json(
        { success: false, message: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check attempt limit
    if ((dbUser.emailOtpAttempts || 0) >= MAX_ATTEMPTS) {
      await User.findByIdAndUpdate(dbUser._id, {
        $set: { emailOtpHash: null, emailOtpExpiresAt: null, emailOtpAttempts: 0 },
      });
      return NextResponse.json(
        { success: false, message: "Too many incorrect attempts. Please request a new verification code." },
        { status: 429 }
      );
    }

    // Constant-time comparison of HMAC hashes
    const expectedHash = hashOtp(rawOtp, dbUser.email || rawEmail);
    const valid = safeCompare(dbUser.emailOtpHash, expectedHash);

    if (!valid) {
      await User.findByIdAndUpdate(dbUser._id, { $inc: { emailOtpAttempts: 1 } });
      const remaining = MAX_ATTEMPTS - ((dbUser.emailOtpAttempts || 0) + 1);
      return NextResponse.json(
        {
          success: false,
          message: remaining > 0
            ? `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
            : "Too many incorrect attempts. Please request a new code.",
        },
        { status: 400 }
      );
    }

    // ── Success: clear OTP fields, update user, issue session ──
    const updateData: Record<string, any> = {
      emailOtpHash: null,
      emailOtpExpiresAt: null,
      emailOtpAttempts: 0,
      emailOtpLastSentAt: null,
      provider: "email",
      lastLoginAt: new Date(),
    };
    if (nameHint && !dbUser.name) updateData.name = nameHint;

    const updatedUser = await User.findByIdAndUpdate(dbUser._id, { $set: updateData }, { new: true });

    const clientUser = toClientUser(updatedUser!);
    const sessionToken = signSession({
      id: clientUser.id,
      phone: clientUser.phone,
      email: clientUser.email,
      name: clientUser.name,
      role: "customer",
    });

    const response = NextResponse.json({
      success: true,
      message: "Email verified successfully. Welcome to TECH AI!",
      user: clientUser,
    });
    setSessionCookie(response, CUSTOMER_SESSION_COOKIE, sessionToken);
    return response;
  } catch (error) {
    console.error("verify-otp endpoint error:", error);
    return NextResponse.json(
      { success: false, message: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
