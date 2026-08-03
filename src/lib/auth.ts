import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const CUSTOMER_SESSION_COOKIE = "techai_customer_session";
export const ADMIN_SESSION_COOKIE = "techai_admin_session";

export interface AuthSession {
  id: string;
  phone: string;
  email: string;
  name: string;
  role: "customer" | "admin";
}

const getJwtSecret = () => process.env.JWT_SECRET || "dev-only-techai-secret-change-me";

export function signSession(payload: AuthSession) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "30d" });
}

export function verifySession(token?: string): AuthSession | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthSession;
    if (!decoded?.id || !decoded?.role) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function getSessionFromCookie(cookieName = CUSTOMER_SESSION_COOKIE) {
  const cookieStore = await cookies();
  return verifySession(cookieStore.get(cookieName)?.value);
}

export function setSessionCookie(response: NextResponse, cookieName: string, token: string) {
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie(response: NextResponse, cookieName: string) {
  response.cookies.set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
