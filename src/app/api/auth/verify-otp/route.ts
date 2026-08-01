import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { phone, otp, name, email } = await req.json();

    if (!phone || !otp) {
      return NextResponse.json({ success: false, message: "Phone and OTP are required" }, { status: 400 });
    }

    // Default test OTP or DB check
    const isValidOtp = otp === "482910" || otp === "123456";

    let dbUser = null;
    try {
      await connectToDatabase();
      dbUser = await User.findOne({ phone });

      if (dbUser && dbUser.otp && dbUser.otp === otp) {
        dbUser.otp = null;
        if (name) dbUser.name = name;
        if (email) dbUser.email = email;
        await dbUser.save();
      } else if (!isValidOtp) {
        return NextResponse.json({ success: false, message: "Invalid OTP code. Please enter 482910" }, { status: 400 });
      }
    } catch (dbErr) {
      if (!isValidOtp) {
        return NextResponse.json({ success: false, message: "Invalid OTP code. Use test OTP 482910" }, { status: 400 });
      }
    }

    const userData = {
      id: dbUser?._id?.toString() || `usr-${Date.now()}`,
      phone,
      name: name || dbUser?.name || "Tech AI Member",
      email: email || dbUser?.email || "",
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${phone}`,
      isLoggedIn: true,
      addresses: dbUser?.addresses || [],
    };

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: userData,
      token: "demo-jwt-session-token-techai",
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error verifying OTP" }, { status: 500 });
  }
}
