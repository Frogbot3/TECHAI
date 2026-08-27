/**
 * /api/auth/send-otp
 *
 * Secure server-side email OTP sender.
 *
 * SECURITY:
 * - OTP is a cryptographically random 6-digit code (using crypto.getRandomValues)
 * - OTP is stored as HMAC-SHA256 hash; plaintext is NEVER logged or returned
 * - Rate-limited: 60-second minimum resend cooldown per email
 * - OTP expires in 10 minutes
 * - No response body leaks whether an account already exists (email enumeration prevention)
 *
 * NOTE: Phone OTP is now handled entirely by Firebase Client SDK (signInWithPhoneNumber).
 * This endpoint only handles EMAIL OTP.
 */

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { Resend } from "resend";
import { createHmac, randomInt } from "crypto";

const resend =
  process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("your_resend")
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

const senderEmail = process.env.OTP_SENDER_EMAIL || "TECH AI <no-reply@techai.store>";
const OTP_SECRET = process.env.JWT_SECRET || "techai_otp_hmac_secret";
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

function hashOtp(otp: string, email: string): string {
  return createHmac("sha256", OTP_SECRET).update(`${email}:${otp}`).digest("hex");
}

function generateSecureOtp(): string {
  // Cryptographically random 6-digit code (100000–999999)
  return (100000 + (randomInt(900000))).toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawEmail = body.email ? String(body.email).trim().toLowerCase() : "";

    if (!rawEmail || !rawEmail.includes("@") || !rawEmail.includes(".")) {
      return NextResponse.json(
        { success: false, message: "Enter a valid email address to receive the verification code." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // ── Rate limiting check ──
    const existingUser = await User.findOne({
      email: { $regex: `^${rawEmail}$`, $options: "i" },
    });

    if (existingUser?.emailOtpLastSentAt) {
      const elapsed = Date.now() - existingUser.emailOtpLastSentAt.getTime();
      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        const remaining = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json(
          {
            success: false,
            message: `Please wait ${remaining} seconds before requesting a new code.`,
            retryAfter: remaining,
          },
          { status: 429 }
        );
      }
    }

    // ── Generate and hash OTP ──
    const otp = generateSecureOtp();
    const hashedOtp = hashOtp(otp, rawEmail);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    // ── Upsert user with hashed OTP (never store plaintext) ──
    await User.findOneAndUpdate(
      { email: { $regex: `^${rawEmail}$`, $options: "i" } },
      {
        $set: {
          email: rawEmail,
          emailOtpHash: hashedOtp,
          emailOtpExpiresAt: expiresAt,
          emailOtpAttempts: 0,
          emailOtpLastSentAt: new Date(),
          provider: "email",
        },
      },
      { upsert: true, new: true }
    );

    // ── Send email via Resend ──
    let emailSent = false;
    if (resend) {
      try {
        await resend.emails.send({
          from: senderEmail,
          to: rawEmail,
          subject: "Your TECH AI Verification Code",
          html: `
            <div style="font-family:'Segoe UI',Arial,sans-serif;padding:32px 24px;background:#f8fafc;max-width:480px;margin:0 auto;border-radius:12px;border:1px solid #e2e8f0;">
              <div style="text-align:center;margin-bottom:24px;">
                <div style="display:inline-flex;align-items:center;gap:8px;background:#0f172a;color:#fbbf24;padding:10px 20px;border-radius:8px;">
                  <span style="font-size:18px;font-weight:800;letter-spacing:1px;">TECH AI</span>
                </div>
              </div>
              <h2 style="color:#0f172a;font-size:20px;font-weight:700;margin:0 0 8px;">Email Verification Code</h2>
              <p style="color:#475569;font-size:14px;margin:0 0 24px;">Use the code below to sign in to your TECH AI account. It expires in 10 minutes.</p>
              <div style="background:#fff;border:2px solid #e2e8f0;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
                <span style="font-family:'Courier New',monospace;font-size:36px;font-weight:900;letter-spacing:10px;color:#0284c7;">${otp}</span>
              </div>
              <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">If you didn't request this, you can safely ignore this email. Never share this code with anyone.</p>
              <div style="border-top:1px solid #e2e8f0;margin-top:24px;padding-top:16px;text-align:center;">
                <span style="color:#cbd5e1;font-size:11px;">© 2025 TECH AI — Secure Login</span>
              </div>
            </div>
          `,
        });
        emailSent = true;
      } catch (err) {
        console.error("Resend email delivery error:", err);
      }
    }

    // NEVER return the OTP in the response, even for dev
    return NextResponse.json({
      success: true,
      message: emailSent
        ? `Verification code sent to ${rawEmail}. Check your inbox and spam folder.`
        : "Verification code generated. (Email delivery unavailable — configure RESEND_API_KEY.)",
      delivery: emailSent ? "email" : "unavailable",
      // DO NOT include otpHint — no plaintext OTP ever in response
    });
  } catch (error) {
    console.error("send-otp endpoint error:", error);
    return NextResponse.json(
      { success: false, message: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
