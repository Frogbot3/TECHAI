import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes("your_resend")
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const senderEmail = process.env.OTP_SENDER_EMAIL || "TECH AI <no-reply@techai.store>";

export async function POST(req: Request) {
  try {
    const { phone, email, name, method } = await req.json();
    const normalizedPhone = phone ? String(phone).replace(/\D/g, "") : "";
    const normalizedEmail = email ? String(email).trim().toLowerCase() : "";

    const isEmailMethod = method === "email" || (!normalizedPhone && Boolean(normalizedEmail));

    if (isEmailMethod) {
      if (!normalizedEmail || !normalizedEmail.includes("@")) {
        return NextResponse.json({ success: false, message: "Enter a valid email address to receive OTP." }, { status: 400 });
      }
    } else {
      if (normalizedPhone.length !== 10) {
        return NextResponse.json({ success: false, message: "Enter a valid 10-digit mobile number." }, { status: 400 });
      }
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await connectToDatabase();

    const query = isEmailMethod
      ? { email: { $regex: `^${normalizedEmail}$`, $options: "i" } }
      : { phone: normalizedPhone };

    const updateDoc: Record<string, any> = {
      otp: generatedOtp,
      otpExpiresAt,
      provider: isEmailMethod ? "email" : "phone",
      lastLoginAt: new Date(),
    };

    if (isEmailMethod) {
      updateDoc.email = normalizedEmail;
    } else {
      updateDoc.phone = normalizedPhone;
    }
    if (name) updateDoc.name = name;

    await User.findOneAndUpdate(
      query,
      { $set: updateDoc },
      { upsert: true, new: true }
    );

    let emailSent = false;
    if (isEmailMethod && resend) {
      try {
        await resend.emails.send({
          from: senderEmail,
          to: normalizedEmail,
          subject: "Your TECH AI Verification Code",
          html: `
            <div style="font-family: Arial, sans-serif; padding: 24px; color: #0f172a; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; rounded-lg: 12px;">
              <h2 style="color: #0f172a; margin-bottom: 8px;">TECH AI Verification</h2>
              <p style="color: #64748b; font-size: 14px;">Use the verification code below to complete your login:</p>
              <div style="background-color: #f8fafc; border: 1px border #cbd5e1; padding: 16px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0284c7;">${generatedOtp}</span>
              </div>
              <p style="color: #94a3b8; font-size: 12px;">This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
            </div>
          `,
        });
        emailSent = true;
      } catch (err) {
        console.error("Resend email delivery error:", err);
      }
    }

    const targetDesc = isEmailMethod ? normalizedEmail : `+91 ${normalizedPhone}`;
    return NextResponse.json({
      success: true,
      message: emailSent ? `OTP sent to ${normalizedEmail}.` : `OTP code generated for ${targetDesc}.`,
      otpHint: generatedOtp,
      delivery: emailSent ? "email" : "development",
    });
  } catch (error) {
    console.error("Send OTP endpoint error:", error);
    return NextResponse.json({ success: false, message: "Server error generating OTP. Please try again." }, { status: 500 });
  }
}
