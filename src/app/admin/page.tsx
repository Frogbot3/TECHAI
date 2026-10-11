import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";
import { dashboardHref } from "@/lib/admin-navigation";

// The admin landing URL routes to the existing pages; it owns no dashboard UI.
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams))
    if (typeof value === "string") params.set(key, value);
  const target = dashboardHref(params);
  const session = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
  redirect(
    session?.role === "admin"
      ? target
      : `/admin/login?next=${encodeURIComponent(target)}`,
  );
}
