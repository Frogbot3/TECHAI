import type { ReactNode } from "react";

// Authorization lives in page.tsx so it can preserve the requested tab/order
// through sign-in. The shared admin theme remains in ../layout.tsx.
export default function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
