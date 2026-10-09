import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";

// The admin landing URL routes to the existing pages; it owns no dashboard UI.
export default async function AdminPage() {
  const session = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
  redirect(session?.role === "admin" ? "/admin/dashboard" : "/admin/login");
}
