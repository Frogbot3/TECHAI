"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, ShoppingCart, User, Package } from "lucide-react";

interface MobileBottomNavProps {
  cartCount: number;
  wishlistCount: number;
  activeTab?: "home" | "categories" | "search" | "cart" | "account" | "orders";
  onOpenCart: () => void;
  onOpenAuth?: () => void;
  onOpenCategories?: () => void;
  onOpenSearch?: () => void;
}

export default function MobileBottomNav({
  cartCount,
  wishlistCount,
  activeTab,
  onOpenCart,
  onOpenAuth,
  onOpenCategories,
  onOpenSearch,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const isOrders = pathname?.startsWith("/orders");
  const isHome = pathname === "/" && !isOrders;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-3 py-1.5 flex items-center justify-around shadow-lg safe-area-pb">
      {/* 1. Home */}
      <Link
        href="/"
        className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] font-bold transition-colors ${
          isHome ? "text-cyan-700 font-extrabold" : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span>Home</span>
      </Link>

      {/* 2. Categories */}
      <button
        type="button"
        onClick={onOpenCategories || (() => {})}
        className="flex flex-col items-center justify-center py-1 px-2 text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <LayoutGrid className="w-5 h-5 mb-0.5" />
        <span>Categories</span>
      </button>

      {/* 3. Search */}
      <button
        type="button"
        onClick={onOpenSearch || (() => {})}
        className="flex flex-col items-center justify-center py-1 px-2 text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <Search className="w-5 h-5 mb-0.5" />
        <span>Search</span>
      </button>

      {/* 4. Cart with Live Badge */}
      <button
        type="button"
        onClick={onOpenCart}
        className="flex flex-col items-center justify-center py-1 px-2 text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors relative cursor-pointer"
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5 mb-0.5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-2.5 bg-amber-400 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </div>
        <span>Cart</span>
      </button>

      {/* 5. Account / Orders */}
      <Link
        href="/orders"
        className={`flex flex-col items-center justify-center py-1 px-2 text-[10px] font-bold transition-colors ${
          isOrders ? "text-cyan-700 font-extrabold" : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <Package className="w-5 h-5 mb-0.5" />
        <span>Orders</span>
      </Link>
    </nav>
  );
}
