"use client";
import { useEffect, useState } from "react";
import {
  BarChart3,
  Package,
  ShoppingBag,
  Users,
  Sparkles,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  RefreshCw,
  ExternalLink,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import TechAiLogo from "../TechAiLogo";
import { ThemeSelector } from "./AdminTheme";
import { AdminModal } from "./AdminUI";
export type AdminTab =
  "ANALYTICS" | "PRODUCTS" | "ORDERS" | "CUSTOMERS" | "CAMPAIGNS" | "REFUNDS";
const modules = [
  {
    id: "ANALYTICS",
    label: "Overview & Analytics",
    icon: BarChart3,
    description: "A clear view of your store’s performance.",
  },
  {
    id: "PRODUCTS",
    label: "Products & Inventory",
    icon: Package,
    description: "Manage your catalog, product images and stock.",
  },
  {
    id: "ORDERS",
    label: "Orders",
    icon: ShoppingBag,
    description: "Manage payments, fulfilment and delivery.",
  },
  {
    id: "CUSTOMERS",
    label: "Customers",
    icon: Users,
    description: "Your customer directory and contact information.",
  },
  {
    id: "CAMPAIGNS",
    label: "Hero Campaigns",
    icon: Sparkles,
    description: "Plan storefront promotions and monitor campaign performance.",
  },
  {
    id: "REFUNDS",
    label: "Refunds",
    icon: RotateCcw,
    description: "Review requests and manage refund processing.",
  },
] as const;
export default function AdminShell({
  activeTab,
  onNavigate,
  onRefresh,
  onLogout,
  refreshing,
  lastSync,
  error,
  actions,
  children,
}: {
  activeTab: AdminTab;
  onNavigate: (tab: AdminTab) => void;
  onRefresh: () => void;
  onLogout: () => void;
  refreshing: boolean;
  lastSync: string;
  error: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const current = modules.find((item) => item.id === activeTab)!;
  useEffect(() => {
    try {
      setCollapsed(
        localStorage.getItem("techai-admin-sidebar") === "collapsed",
      );
    } catch {}
  }, []);
  const navigate = (tab: AdminTab) => {
    onNavigate(tab);
    setDrawer(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const links = (
    <nav aria-label="Admin modules">
      {modules.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => navigate(id)}
          aria-current={activeTab === id ? "page" : undefined}
          title={label}
          className="admin-nav-link"
        >
          <Icon size={19} aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
  return (
    <div className={`admin-shell ${collapsed ? "is-collapsed" : ""}`}>
      <aside className="admin-sidebar">
        <a
          href="/admin/dashboard"
          className="admin-brand"
          aria-label="TECH AI admin home"
        >
          <TechAiLogo size="md" />
          <span className="admin-brand-compact">
            T<span>AI</span>
          </span>
        </a>
        <p className="admin-nav-label">Workspace</p>
        {links}
        <div className="admin-sidebar-bottom">
          <ShieldCheck size={18} />
          <span>
            Administrator
            <br />
            <small>Store management</small>
          </span>
        </div>
      </aside>
      {drawer && (
        <AdminModal
          label="Admin navigation"
          onClose={() => setDrawer(false)}
          className="admin-nav-drawer"
        >
          <div className="admin-drawer-head">
            <TechAiLogo size="md" />
            <button
              className="admin-icon-button"
              aria-label="Close navigation"
              onClick={() => setDrawer(false)}
            >
              <X size={20} />
            </button>
          </div>
          {links}
        </AdminModal>
      )}
      <div className="admin-workspace">
        <header className="admin-toolbar">
          <div className="admin-toolbar-start">
            <button
              className="admin-icon-button admin-desktop-toggle"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() =>
                setCollapsed((value) => {
                  try {
                    localStorage.setItem(
                      "techai-admin-sidebar",
                      value ? "expanded" : "collapsed",
                    );
                  } catch {}
                  return !value;
                })
              }
            >
              {collapsed ? (
                <PanelLeftOpen size={19} />
              ) : (
                <PanelLeftClose size={19} />
              )}
            </button>
            <button
              className="admin-icon-button admin-mobile-toggle"
              aria-label="Open navigation"
              onClick={() => setDrawer(true)}
            >
              <Menu size={20} />
            </button>
            <span className="admin-breadcrumb">
              Workspace <span>/</span> <strong>{current.label}</strong>
            </span>
          </div>
          <div className="admin-toolbar-actions">
            <ThemeSelector />
            <button
              className="admin-icon-button"
              title="Refresh data"
              aria-label="Refresh data"
              disabled={refreshing}
              onClick={onRefresh}
            >
              <RefreshCw
                size={17}
                className={refreshing ? "animate-spin" : ""}
              />
            </button>
            <a
              className="admin-button admin-view-store"
              aria-label="View Store"
              href="/"
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={15} />
              <span>View Store</span>
            </a>
            <button
              className="admin-icon-button"
              title="Log out"
              aria-label="Log out"
              onClick={onLogout}
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>
        <main className="admin-main">
          <div className="admin-page-header">
            <div>
              <p className="admin-eyebrow">Store management</p>
              <h1>{current.label}</h1>
              <p>{current.description}</p>
            </div>
            <div className="admin-page-actions">{actions}</div>
          </div>
          <div className="admin-sync" role="status">
            <span
              className={
                error
                  ? "admin-dot warning"
                  : lastSync
                    ? "admin-dot"
                    : "admin-dot pending"
              }
            />
            {refreshing
              ? "Refreshing data…"
              : error
                ? lastSync
                  ? "Last saved snapshot · refresh needed"
                  : "Data unavailable"
                : lastSync
                  ? `Last synced ${lastSync}`
                  : "Connecting to your store…"}
          </div>
          {children}
        </main>
        <footer className="admin-footer">
          TECH AI <span>Administration workspace</span>
        </footer>
      </div>
    </div>
  );
}
