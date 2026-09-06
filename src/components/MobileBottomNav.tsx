"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, ShoppingCart, User, Heart } from "lucide-react";

interface MobileBottomNavProps {
  cartCount: number;
  wishlistCount: number;
  activeTab?: "home" | "categories" | "search" | "cart" | "account" | "wishlist";
  onOpenCart: () => void;
  onOpenAuth?: () => void;
  onOpenCategories?: () => void;
  onOpenSearch?: () => void;
  onResetHome?: () => void;
}

export default function MobileBottomNav({
  cartCount,
  wishlistCount,
  activeTab,
  onOpenCart,
  onOpenAuth,
  onOpenCategories,
  onOpenSearch,
  onResetHome,
}: MobileBottomNavProps) {
  const pathname = usePathname();
  const isHome = pathname === "/" && !activeTab;
  const isWishlist = pathname === "/wishlist" || activeTab === "wishlist";

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1 flex items-center justify-around shadow-lg safe-area-pb"
      aria-label="Mobile Navigation"
    >
      {/* 1. Home */}
      <Link
        href="/"
        onClick={() => onResetHome?.()}
        className={`flex-1 flex flex-col items-center justify-center py-1 px-1 text-[10px] font-bold transition-colors ${
          isHome && !isWishlist ? "text-cyan-800 font-extrabold" : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <Home className={`w-5 h-5 mb-0.5 ${isHome && !isWishlist ? "text-cyan-700" : "text-slate-500"}`} />
        <span>Home</span>
      </Link>

      {/* 2. Categories */}
      <button
        type="button"
        onClick={onOpenCategories || (() => {})}
        className="flex-1 flex flex-col items-center justify-center py-1 px-1 text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <LayoutGrid className="w-5 h-5 mb-0.5" />
        <span>Categories</span>
      </button>

      {/* 3. Search */}
      <button
        type="button"
        onClick={onOpenSearch || (() => {})}
        className="flex-1 flex flex-col items-center justify-center py-1 px-1 text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <Search className="w-5 h-5 mb-0.5" />
        <span>Search</span>
      </button>

      {/* 4. Wishlist */}
      <Link
        href="/wishlist"
        className={`flex-1 flex flex-col items-center justify-center py-1 px-1 text-[10px] font-bold transition-colors relative ${
          isWishlist ? "text-rose-600 font-extrabold" : "text-slate-500 hover:text-slate-900"
        }`}
      >
        <div className="relative">
          <Heart className={`w-5 h-5 mb-0.5 ${isWishlist ? "fill-rose-500 text-rose-500" : "text-slate-500"}`} />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-black min-w-3.5 h-3.5 px-0.5 rounded-full flex items-center justify-center shadow-xs">
              {wishlistCount > 9 ? "9+" : wishlistCount}
            </span>
          )}
        </div>
        <span>Wishlist</span>
      </Link>

      {/* 5. Cart with Live Badge */}
      <button
        type="button"
        onClick={onOpenCart}
        className="flex-1 flex flex-col items-center justify-center py-1 px-1 text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors relative cursor-pointer"
      >
        <div className="relative">
          <ShoppingCart className="w-5 h-5 mb-0.5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-2.5 bg-amber-400 text-slate-950 text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center shadow-xs">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </div>
        <span>Cart</span>
      </button>

      {/* 6. Account */}
      <button
        type="button"
        onClick={onOpenAuth || (() => {})}
        className="flex-1 flex flex-col items-center justify-center py-1 px-1 text-[10px] font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <User className="w-5 h-5 mb-0.5" />
        <span>Account</span>
      </button>
    </nav>
  );
}
