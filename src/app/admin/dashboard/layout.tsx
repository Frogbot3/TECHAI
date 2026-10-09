import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";

// Scope this guard to the dashboard so the public admin login cannot loop.
// API handlers continue to enforce their own server-side authorization.
export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
  if (session?.role !== "admin") redirect("/admin/login");
  return children;
}
