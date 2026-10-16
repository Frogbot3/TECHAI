import { connectToDatabase } from "@/lib/mongodb";
import {
  CUSTOMER_SESSION_COOKIE,
  setSessionCookie,
  signSession,
} from "@/lib/auth";
import { escapeRegex } from "@/lib/query";
import { toClientUser } from "@/lib/serializers";
import User from "@/models/User";
import EmailOtp from "@/models/EmailOtp";
import {
  EMAIL_OTP_MAX_ATTEMPTS,
  emailOtpDigest,
  emailOtpRateLimit,
  emailOtpResponse,
  logEmailOtpFailure,
  matchesEmailOtp,
  normalizeOtpEmail,
} from "@/lib/email-otp";

export const runtime = "nodejs";
const invalid = () =>
  emailOtpResponse(
    400,
    "Invalid, expired or exhausted verification code. Please request a new one.",
  );

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = normalizeOtpEmail(body?.email);
    const otp = typeof body?.otp === "string" ? body.otp.trim() : "";
    if (!email || !/^\d{6}$/.test(otp))
      return emailOtpResponse(
        400,
        "Enter a valid email address and 6-digit verification code.",
      );
    await connectToDatabase();
    const retryAfter = await emailOtpRateLimit(req, email, "verify");
    if (retryAfter)
      return emailOtpResponse(
        429,
        "Too many verification requests. Please try again later.",
        { retryAfter },
      );

    // Reserve each attempt atomically: parallel guesses cannot exceed five.
    // Legacy User.emailOtpHash values are deliberately never accepted.
    const challenge = await EmailOtp.findOneAndUpdate(
      {
        _id: emailOtpDigest(email),
        status: "sent",
        expiresAt: { $gt: new Date() },
        attempts: { $lt: EMAIL_OTP_MAX_ATTEMPTS },
      },
      { $inc: { attempts: 1 } },
      { new: true },
    );
    if (!challenge) return invalid();
    if (
      !matchesEmailOtp(
        challenge.hash,
        emailOtpDigest(email + ":" + challenge.challengeId + ":" + otp),
      )
    )
      return invalid();

    // Exactly one verifier can consume a code and proceed to create a session.
    const consumed = await EmailOtp.updateOne(
      {
        _id: challenge._id,
        challengeId: challenge.challengeId,
        status: "sent",
        expiresAt: { $gt: new Date() },
      },
      { $set: { status: "consumed", hash: null } },
    );
    if (consumed.modifiedCount !== 1) return invalid();

    const query = {
      email: { $regex: `^${escapeRegex(email)}$`, $options: "i" },
    };
    const matches = await User.find(query).limit(2);
    if (matches.length > 1)
      return emailOtpResponse(
        409,
        "This account needs support assistance before signing in.",
      );
    let dbUser = matches[0];
    if (!dbUser) {
      try {
        // Only verified ownership may create a customer; no unverified name hint.
        dbUser = await User.create({
          email,
          provider: "email",
          role: "customer",
          lastLoginAt: new Date(),
        });
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
        // A simultaneous Google/other verified signup may have created it.
        dbUser = await User.findOne(query);
        if (!dbUser) throw new Error("account_creation_failed");
      }
    } else {
      // Preserve provider, Firebase/Google IDs, verified phone, name and email.
      dbUser = await User.findByIdAndUpdate(
        dbUser._id,
        { $set: { lastLoginAt: new Date() } },
        { new: true },
      );
    }
    if (!dbUser) throw new Error("account_missing");
    const user = toClientUser(dbUser);
    const token = signSession({
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: "customer",
    });
    const response = emailOtpResponse(
      200,
      "Email verified successfully. Welcome to TECH AI!",
      { user },
    );
    setSessionCookie(response, CUSTOMER_SESSION_COOKIE, token);
    return response;
  } catch {
    logEmailOtpFailure("verify");
    return emailOtpResponse(
      503,
      "We could not complete sign-in. Please request a new code and try again.",
    );
  }
}
