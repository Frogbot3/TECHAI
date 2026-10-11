import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";
import { dashboardHref } from "@/lib/admin-navigation";
import DashboardClient from "./DashboardClient";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams))
    if (typeof value === "string") params.set(key, value);
  // Guard the page before rendering, preserving its query string through sign-in.
  const session = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
  if (session?.role !== "admin")
    redirect(`/admin/login?next=${encodeURIComponent(dashboardHref(params))}`);
  return <DashboardClient />;
}
