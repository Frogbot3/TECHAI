"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, ShoppingCart, Heart, User, Search } from "lucide-react";

interface MobileBottomNavProps {
  cartCount: number;
  wishlistCount: number;
  activeTab?: "home" | "orders" | "wishlist" | "account";
  onOpenCart: () => void;
  onOpenAuth?: () => void;
  onOpenSearch?: () => void;
}

export default function MobileBottomNav({
  cartCount,
  wishlistCount,
  activeTab,
  onOpenCart,
  onOpenAuth,
  onOpenSearch,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const isOrders = pathname?.startsWith("/orders") || activeTab === "orders";
  const isHome = pathname === "/" && !activeTab;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)] safe-area-pb">
      {/* Home */}
      <Link
        href="/"
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-extrabold transition-colors ${
          isHome && !isOrders
            ? "text-cyan-600 font-black"
            : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <Home className={`w-5 h-5 ${isHome && !isOrders ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
        <span className="mt-0.5">Home</span>
      </Link>

      {/* My Orders */}
      <Link
        href="/orders"
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-extrabold transition-colors relative ${
          isOrders
            ? "text-cyan-600 font-black"
            : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <Package className={`w-5 h-5 ${isOrders ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
        <span className="mt-0.5">Orders</span>
      </Link>

      {/* Cart with Live Count Badge */}
      <button
        type="button"
        onClick={onOpenCart}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-extrabold text-slate-500 hover:text-slate-900 transition-colors relative"
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5 stroke-[1.75]" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-amber-400 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </div>
        <span className="mt-0.5">Cart</span>
      </button>

      {/* Account / Login */}
      {onOpenAuth && (
        <button
          type="button"
          onClick={onOpenAuth}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10px] font-extrabold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <User className="w-5 h-5 stroke-[1.75]" />
          <span className="mt-0.5">Account</span>
        </button>
      )}
    </nav>
  );
}
