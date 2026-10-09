import type { Metadata } from "next";
import { AdminThemeProvider } from "@/components/admin/AdminTheme";
import "./admin.css";

export const metadata: Metadata = {
  title: "TECH AI · Administration",
  robots: { index: false, follow: false },
};

// Runs before the admin content paints; deliberately scoped away from the storefront.
const themeScript = `(function(){try{var p=localStorage.getItem('techai-admin-theme-v1');if(!['light','dark','system'].includes(p))p='light';var r=document.getElementById('admin-root');r.dataset.preference=p;r.dataset.theme=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;}catch(e){}})()`;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      id="admin-root"
      data-theme="light"
      data-preference="light"
      suppressHydrationWarning
    >
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      <AdminThemeProvider>{children}</AdminThemeProvider>
      <div id="admin-portals" />
    </div>
  );
}
