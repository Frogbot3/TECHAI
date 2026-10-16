import { randomInt, randomUUID } from "node:crypto";
import { Resend } from "resend";
import { connectToDatabase } from "@/lib/mongodb";
import EmailOtp from "@/models/EmailOtp";
import {
  EMAIL_OTP_COOLDOWN_MS,
  EMAIL_OTP_EXPIRY_MS,
  emailOtpDeliveryConfig,
  emailOtpDigest,
  emailOtpRateLimit,
  emailOtpResponse,
  logEmailOtpFailure,
  normalizeOtpEmail,
} from "@/lib/email-otp";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let challenge: { _id: string; challengeId: string } | undefined;
  try {
    const body = await req.json().catch(() => null);
    const email = normalizeOtpEmail(body?.email);
    if (!email)
      return emailOtpResponse(
        400,
        "Enter a valid email address to receive the verification code.",
      );
    let config;
    try {
      config = emailOtpDeliveryConfig();
    } catch {
      logEmailOtpFailure("configuration");
      return emailOtpResponse(
        503,
        "Email sign-in is not configured. Please contact the store.",
      );
    }
    if (config.testEmail && email !== config.testEmail) {
      return emailOtpResponse(
        403,
        "Demo email sign-in is limited to the configured Resend test recipient.",
      );
    }
    await connectToDatabase();
    const retryAfter = await emailOtpRateLimit(req, email, "send");
    if (retryAfter)
      return emailOtpResponse(
        429,
        "Too many code requests. Please try again later.",
        { retryAfter },
      );

    const now = new Date();
    const _id = emailOtpDigest(email),
      challengeId = randomUUID();
    const otp = randomInt(100000, 1000000).toString();
    // The _id unique index makes the cooldown atomic, including the first send.
    try {
      await EmailOtp.findOneAndUpdate(
        {
          _id,
          lastRequestedAt: {
            $lte: new Date(now.getTime() - EMAIL_OTP_COOLDOWN_MS),
          },
        },
        {
          $set: {
            challengeId,
            hash: emailOtpDigest(email + ":" + challengeId + ":" + otp),
            status: "pending",
            attempts: 0,
            lastRequestedAt: now,
            expiresAt: new Date(now.getTime() + EMAIL_OTP_EXPIRY_MS),
          },
        },
        { upsert: true, new: true },
      );
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
      return emailOtpResponse(
        429,
        "Please wait before requesting another code.",
        { retryAfter: 60 },
      );
    }
    challenge = { _id, challengeId };
    const resend = new Resend(config.apiKey);
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let result;
    try {
      result = await Promise.race([
        resend.emails.send({
          from: config.from,
          to: email,
          subject: "Your TECH AI Verification Code",
          text:
            "Your TECH AI verification code is " +
            otp +
            ". It expires in 10 minutes. Never share this code.",
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
        }),
        new Promise<never>((_, reject) => {
          timeout = setTimeout(
            () => reject(new Error("delivery_timeout")),
            15000,
          );
        }),
      ]);
    } finally {
      if (timeout) clearTimeout(timeout);
    }
    const { data, error } = result;
    if (error || !data?.id) {
      logEmailOtpFailure("delivery", error);
      await EmailOtp.updateOne(
        { ...challenge, status: "pending" },
        { $set: { status: "failed", hash: null } },
      );
      return emailOtpResponse(
        502,
        "We could not send your verification email. Please try again later.",
      );
    }
    // API acceptance is not proof of inbox delivery. Only accepted sends become
    // verifiable; late responses cannot reactivate a replaced/expired challenge.
    const activated = await EmailOtp.updateOne(
      { ...challenge, status: "pending", expiresAt: { $gt: new Date() } },
      { $set: { status: "sent" } },
    );
    if (activated.modifiedCount !== 1) {
      logEmailOtpFailure("activation");
      return emailOtpResponse(
        503,
        "The code request expired or was replaced. Please request a new code.",
      );
    }
    return emailOtpResponse(
      200,
      "Verification email accepted for sending. Check your inbox and spam folder.",
      { delivery: "accepted" },
    );
  } catch {
    // Pending challenges are unverifiable even if this cleanup also fails.
    if (challenge) {
      try {
        await EmailOtp.updateOne(
          { ...challenge, status: "pending" },
          { $set: { status: "failed", hash: null } },
        );
      } catch {
        /* Fail closed; never activate a failed send. */
      }
    }
    logEmailOtpFailure("send");
    return emailOtpResponse(
      503,
      "We could not send your verification email. Please try again later.",
    );
  }
}
