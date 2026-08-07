import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CUSTOMER_SESSION_COOKIE, setSessionCookie, signSession } from "@/lib/auth";
import { toClientUser } from "@/lib/serializers";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { phone, email, otp, name } = await req.json();
    const normalizedPhone = phone ? String(phone).replace(/\D/g, "") : "";
    const normalizedEmail = email ? String(email).trim().toLowerCase() : "";

    if ((!normalizedPhone && !normalizedEmail) || !otp) {
      return NextResponse.json({ success: false, message: "Phone or email, and OTP code are required." }, { status: 400 });
    }

    await connectToDatabase();

    const query = normalizedEmail
      ? { email: { $regex: `^${normalizedEmail}$`, $options: "i" } }
      : { phone: normalizedPhone };

    const dbUser = await User.findOne(query);

    if (!dbUser || !dbUser.otp || dbUser.otp !== String(otp).trim()) {
      return NextResponse.json({ success: false, message: "Invalid OTP code. Please double check and try again." }, { status: 400 });
    }

    if (dbUser.otpExpiresAt && dbUser.otpExpiresAt < new Date()) {
      return NextResponse.json({ success: false, message: "OTP code has expired. Please request a new OTP code." }, { status: 400 });
    }

    dbUser.otp = null;
    dbUser.otpExpiresAt = null;
    dbUser.provider = normalizedEmail ? "email" : "phone";
    dbUser.lastLoginAt = new Date();
    if (name) dbUser.name = name;
    if (normalizedEmail) dbUser.email = normalizedEmail;
    if (normalizedPhone) dbUser.phone = normalizedPhone;
    await dbUser.save();

    const user = toClientUser(dbUser);
    const token = signSession({
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: "customer",
    });

    const response = NextResponse.json({ success: true, message: "Login successful.", user });
    setSessionCookie(response, CUSTOMER_SESSION_COOKIE, token);
    return response;
  } catch (error) {
    console.error("Verify OTP endpoint error:", error);
    return NextResponse.json({ success: false, message: "Server error verifying OTP. Please try again." }, { status: 500 });
  }
}
