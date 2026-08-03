import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const senderEmail = process.env.OTP_SENDER_EMAIL || "TECH AI <no-reply@techai.store>";

export async function POST(req: Request) {
  try {
    const { phone, email, name } = await req.json();
    const normalizedPhone = String(phone || "").replace(/\D/g, "");
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (normalizedPhone.length !== 10) {
      return NextResponse.json({ success: false, message: "Enter a valid 10-digit phone number." }, { status: 400 });
    }

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return NextResponse.json({ success: false, message: "Enter a valid email address to receive the OTP." }, { status: 400 });
    }

    if (!resend && process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { success: false, message: "Email OTP service is not configured. Add RESEND_API_KEY and OTP_SENDER_EMAIL." },
        { status: 500 }
      );
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await connectToDatabase();
    await User.findOneAndUpdate(
      { phone: normalizedPhone },
      {
        $set: {
          phone: normalizedPhone,
          email: normalizedEmail,
          name: name || "Tech AI Customer",
          provider: "phone",
          otp: generatedOtp,
          otpExpiresAt,
        },
      },
      { upsert: true, new: true }
    );

    let emailSent = false;
    if (resend) {
      await resend.emails.send({
        from: senderEmail,
        to: normalizedEmail,
        subject: "Your TECH AI verification code",
        html: `<div style="font-family:Arial,sans-serif;padding:24px;color:#111"><h2>TECH AI verification</h2><p>Your one-time password is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px;margin:20px 0">${generatedOtp}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p></div>`,
      });
      emailSent = true;
    }

    return NextResponse.json({
      success: true,
      message: emailSent ? `OTP sent to ${normalizedEmail}.` : "OTP created for local testing.",
      otpHint: process.env.NODE_ENV === "production" ? null : generatedOtp,
      delivery: emailSent ? "email" : "development",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error sending OTP." }, { status: 500 });
  }
}
