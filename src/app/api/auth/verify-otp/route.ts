import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CUSTOMER_SESSION_COOKIE, setSessionCookie, signSession } from "@/lib/auth";
import { toClientUser } from "@/lib/serializers";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { phone, otp, name, email } = await req.json();
    const normalizedPhone = String(phone || "").replace(/\D/g, "");
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedPhone || !otp) {
      return NextResponse.json({ success: false, message: "Phone and OTP are required." }, { status: 400 });
    }

    await connectToDatabase();
    const dbUser = await User.findOne({ phone: normalizedPhone });

    if (!dbUser || !dbUser.otp || dbUser.otp !== String(otp).trim()) {
      return NextResponse.json({ success: false, message: "Invalid OTP code. Please try again." }, { status: 400 });
    }

    if (dbUser.otpExpiresAt && dbUser.otpExpiresAt < new Date()) {
      return NextResponse.json({ success: false, message: "OTP has expired. Please request a new code." }, { status: 400 });
    }

    dbUser.otp = null;
    dbUser.otpExpiresAt = null;
    dbUser.provider = "phone";
    dbUser.lastLoginAt = new Date();
    if (name) dbUser.name = name;
    if (normalizedEmail) dbUser.email = normalizedEmail;
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
    return NextResponse.json({ success: false, message: "Server error verifying OTP." }, { status: 500 });
  }
}
