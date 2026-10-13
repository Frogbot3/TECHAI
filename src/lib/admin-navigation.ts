export const ADMIN_TABS = [
  "ORDERS",
  "ANALYTICS",
  "PRODUCTS",
  "CUSTOMERS",
  "COUPONS",
  "CAMPAIGNS",
  "REFUNDS",
  "BUSINESS",
] as const;
export type AdminTab = (typeof ADMIN_TABS)[number];
export function adminTab(value: string | null): AdminTab {
  const tab = value?.toUpperCase();
  return ADMIN_TABS.includes(tab as AdminTab) ? (tab as AdminTab) : "ORDERS";
}
export function dashboardHref(params: URLSearchParams) {
  const query = params.toString();
  return `/admin/dashboard${query ? `?${query}` : ""}`;
}
// Return URLs are local and restricted to the existing dashboard, never an external origin.
export function safeAdminReturn(value: string | null) {
  if (!value || /[\\\r\n]/.test(value)) return "/admin/dashboard";
  try {
    const url = new URL(value, "https://admin.local");
    if (
      url.origin !== "https://admin.local" ||
      url.pathname !== "/admin/dashboard"
    )
      return "/admin/dashboard";
    return dashboardHref(url.searchParams);
  } catch {
    return "/admin/dashboard";
  }
}
