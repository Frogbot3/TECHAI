import { NextResponse } from "next/server";
import { CUSTOMER_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { toClientUser } from "@/lib/serializers";
import User from "@/models/User";

export async function GET() {
  const session = await getSessionFromCookie(CUSTOMER_SESSION_COOKIE);
  if (!session) {
    return NextResponse.json({ success: false, user: null });
  }

  try {
    await connectToDatabase();
    const user = await User.findById(session.id);
    if (!user) return NextResponse.json({ success: false, user: null });
    return NextResponse.json({ success: true, user: toClientUser(user) });
  } catch {
    return NextResponse.json({
      success: true,
      user: {
        id: session.id,
        name: session.name,
        phone: session.phone,
        email: session.email,
        role: session.role,
        isLoggedIn: true,
      },
    });
  }
}
