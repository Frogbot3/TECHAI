import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, setSessionCookie, signSession } from "@/lib/auth";
import { createHash, timingSafeEqual } from "crypto";
import { allowAdminLogin } from "@/lib/login-rate-limit";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    const adminPass = process.env.ADMIN_PASS;

    if (!adminEmail || !adminPass) {
      return NextResponse.json({ success: false, message: "Admin login is not configured." }, { status: 500 });
    }

    const limit = await allowAdminLogin();
    if (!limit.allowed) return NextResponse.json({ success: false, message: "Too many login attempts. Please retry later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
    const hash = (value: string) => createHash("sha256").update(value).digest();
    const passwordMatches = timingSafeEqual(hash(typeof password === "string" ? password : ""), hash(adminPass));
    if (typeof email !== "string" || email.trim().toLowerCase() !== adminEmail.toLowerCase() || !passwordMatches) {
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
  } catch (error) {
    console.error("Admin login unavailable", { errorType: error instanceof Error ? error.name : "unknown" });
    return NextResponse.json({ success: false, message: "Login unavailable. Please retry." }, { status: 503 });
  }
}
