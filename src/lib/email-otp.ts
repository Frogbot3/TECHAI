import { createHmac, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import { NextResponse } from "next/server";
import { getJwtSecret } from "@/lib/auth";
import LoginAttempt from "@/models/LoginAttempt";

export const EMAIL_OTP_EXPIRY_MS = 10 * 60 * 1000;
export const EMAIL_OTP_COOLDOWN_MS = 60 * 1000;
export const EMAIL_OTP_MAX_ATTEMPTS = 5;

export function normalizeOtpEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 &&
    /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(
      email,
    )
    ? email
    : null;
}

export function emailOtpDigest(value: string): string {
  return createHmac("sha256", getJwtSecret())
    .update(`email-otp-v2:${value}`)
    .digest("hex");
}

export function matchesEmailOtp(stored: unknown, expected: string): boolean {
  if (typeof stored !== "string" || !/^[a-f0-9]{64}$/.test(stored))
    return false;
  return timingSafeEqual(
    Buffer.from(stored, "hex"),
    Buffer.from(expected, "hex"),
  );
}

export function emailOtpResponse(
  status: number,
  message: string,
  extra: Record<string, unknown> = {},
) {
  return NextResponse.json(
    { success: status === 200, message, ...extra },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...(extra.retryAfter
          ? { "Retry-After": String(extra.retryAfter) }
          : {}),
      },
    },
  );
}

// Never log raw exceptions, Resend messages, request bodies, identifiers or hashes.
export function logEmailOtpFailure(
  stage: "configuration" | "send" | "verify" | "delivery" | "activation",
  error?: unknown,
) {
  const name = (error as { name?: unknown } | null)?.name;
  const known = [
    "validation_error",
    "missing_api_key",
    "invalid_api_Key",
    "restricted_api_key",
    "rate_limit_exceeded",
    "daily_quota_exceeded",
    "monthly_quota_exceeded",
    "application_error",
    "internal_server_error",
  ];
  console.error("Email OTP failure", {
    stage,
    reason:
      typeof name === "string" && known.includes(name)
        ? name
        : "request_failed",
  });
}

export function emailOtpDeliveryConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.OTP_SENDER_EMAIL?.trim();
  const address = from?.match(/^(?:[^<>\r\n]+<([^<>]+)>|([^<>\s]+))$/);
  const mailbox = normalizeOtpEmail(address?.[1] || address?.[2]);
  if (!apiKey || apiKey.includes("your_resend") || !from || !mailbox)
    throw new Error("email_otp_configuration");
  const testSender = mailbox.endsWith("@resend.dev");
  const testEmail = normalizeOtpEmail(process.env.RESEND_TEST_EMAIL);
  // Resend independently enforces that this mailbox belongs to its account.
  if (
    (testSender && mailbox !== "onboarding@resend.dev") ||
    ((testSender || process.env.RESEND_TEST_EMAIL) && !testEmail)
  ) {
    throw new Error("email_otp_test_configuration");
  }
  return { apiKey, from, testEmail };
}

async function budget(
  key: string,
  limit: number,
  duration: number,
  now: number,
) {
  const window = Math.floor(now / duration);
  const _id = `email-otp:${key}:${window}`;
  let entry;
  try {
    entry = await LoginAttempt.findOneAndUpdate(
      { _id },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt: new Date((window + 2) * duration) },
      },
      { upsert: true, new: true },
    );
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    entry = await LoginAttempt.findOneAndUpdate(
      { _id },
      { $inc: { count: 1 } },
      { new: true },
    );
  }
  return entry && entry.count <= limit
    ? 0
    : Math.max(1, Math.ceil(((window + 1) * duration - now) / 1000));
}

export async function emailOtpRateLimit(
  req: Request,
  email: string,
  action: "send" | "verify",
) {
  const now = Date.now(),
    send = action === "send";
  // Only trust Vercel's platform-controlled header on Vercel. Else share a source
  // bucket instead of letting arbitrary X-Forwarded-For values bypass limits.
  const forwarded =
    process.env.VERCEL === "1"
      ? req.headers.get("x-vercel-forwarded-for")?.trim()
      : null;
  const source = forwarded && isIP(forwarded) ? forwarded : "shared-source";
  const checks: [string, number, number][] = [
    [`${action}:global`, send ? 50 : 300, send ? 3600000 : 900000],
    [`${action}:source:${emailOtpDigest(source)}`, send ? 10 : 30, 900000],
    [
      `${action}:email:${emailOtpDigest(email)}`,
      send ? 5 : 30,
      send ? 3600000 : 900000,
    ],
  ];
  for (const [key, limit, duration] of checks) {
    const retryAfter = await budget(key, limit, duration, now);
    if (retryAfter) return retryAfter;
  }
  return 0;
}
