import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, setSessionCookie, signSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const adminEmail = process.env.ADMIN_EMAIL || "admin@techai.com";
  const adminPass = process.env.ADMIN_PASS || "8136909940";

  if (email !== adminEmail || password !== adminPass) {
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
