import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CUSTOMER_SESSION_COOKIE, setSessionCookie, signSession } from "@/lib/auth";
import { toClientUser } from "@/lib/serializers";
import User from "@/models/User";

const GOOGLE_STATE_COOKIE = "techai_google_state";

export async function GET(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${GOOGLE_STATE_COOKIE}=`))
    ?.split("=")[1];

  if (!code || !state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(new URL("/?auth_error=google_failed", appUrl));
  }

  try {
    const redirectUri = new URL("/api/auth/google/callback", appUrl).toString();
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) throw new Error("Google token exchange failed");
    const tokenData = await tokenResponse.json();

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileResponse.ok) throw new Error("Google profile request failed");
    const profile = await profileResponse.json();

    await connectToDatabase();
    const dbUser = await User.findOneAndUpdate(
      { $or: [{ googleId: profile.sub }, { email: profile.email }] },
      {
        $set: {
          googleId: profile.sub,
          name: profile.name || profile.email?.split("@")[0] || "Customer",
          email: profile.email || "",
          avatar: profile.picture || "",
          provider: "google",
          phone: `google:${profile.sub}`,
          lastLoginAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    const user = toClientUser(dbUser);
    const token = signSession({
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role: "customer",
    });

    const response = NextResponse.redirect(new URL("/?auth=google_success", appUrl));
    setSessionCookie(response, CUSTOMER_SESSION_COOKIE, token);
    response.cookies.set(GOOGLE_STATE_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/?auth_error=google_failed", appUrl));
  }
}
