import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, setSessionCookie, signSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPass = process.env.ADMIN_PASS?.trim();

  if (!adminEmail || !adminPass) {
    return NextResponse.json({ success: false, message: "Admin login is not configured." }, { status: 500 });
  }

  if (email?.trim() !== adminEmail || password?.trim() !== adminPass) {
    return NextResponse.json({ success: false, message: "Invalid admin credentials." }, { status: 401 });
  }

  const token = signSession({
    id: "admin",
    phone: "",
    email: adminEmail,
    name: "TECH AI Admin",
    role: "admin",
  });

  const response = NextResponse.json({ success: true, message: "Admin login successful." });
  setSessionCookie(response, ADMIN_SESSION_COOKIE, token);
  return response;
}
