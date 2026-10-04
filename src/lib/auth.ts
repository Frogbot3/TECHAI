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

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET must contain at least 32 characters.");
  return secret;
};

export function signSession(payload: AuthSession) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: payload.role === "admin" ? "8h" : "30d", algorithm: "HS256" });
}

export function verifySession(token?: string): AuthSession | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] }) as AuthSession;
    if (typeof decoded?.id !== "string" || !["admin", "customer"].includes(decoded?.role)) return null;
    return decoded;
  } catch {
    return null;
  }
}

export async function getSessionFromCookie(cookieName = CUSTOMER_SESSION_COOKIE) {
  const cookieStore = await cookies();
  const session = verifySession(cookieStore.get(cookieName)?.value);
  return session?.role === (cookieName === ADMIN_SESSION_COOKIE ? "admin" : "customer") ? session : null;
}

export function setSessionCookie(response: NextResponse, cookieName: string, token: string) {
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: cookieName === ADMIN_SESSION_COOKIE ? 60 * 60 * 8 : 60 * 60 * 24 * 30,
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
