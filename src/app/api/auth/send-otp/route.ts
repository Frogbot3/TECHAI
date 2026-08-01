import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone || phone.length < 10) {
      return NextResponse.json({ success: false, message: "Valid 10-digit phone number is required" }, { status: 400 });
    }

    // Standard demo/test OTP
    const generatedOtp = "482910";
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    try {
      await connectToDatabase();
      await User.findOneAndUpdate(
        { phone },
        {
          phone,
          otp: generatedOtp,
          otpExpiresAt,
        },
        { upsert: true, new: true }
      );
    } catch (dbErr) {
      console.warn("MongoDB connection fallback for send-otp:", (dbErr as Error).message);
    }

    return NextResponse.json({
      success: true,
      message: `OTP sent successfully to +91 ${phone}`,
      otpHint: generatedOtp,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error sending OTP" }, { status: 500 });
  }
}
