"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CATEGORIES } from "@/lib/data";
import TechAiLogo from "./TechAiLogo";
import {
  ChevronDown,
  Heart,
  LogOut,
  MapPin,
  Menu,
  PackageCheck,
  Search,
  ShieldCheck,
  ShoppingCart,
  User,
  X,
} from "lucide-react";

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  user: any;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onOpenTracking: () => void;
  onLogout: () => void;
}

export default function Navbar({
  cartCount,
  wishlistCount,
  user,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  onOpenCart,
  onOpenAuth,
  onOpenTracking,
  onLogout,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Notification Announcement Bar */}
      <div className="bg-slate-950 text-slate-100 text-[11px] sm:text-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-slate-300">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate">Express Delivery Across India • 100% Genuine Tech</span>
          </div>
          <div className="flex items-center justify-end gap-4 flex-shrink-0">
            <Link href="/orders" className="flex items-center gap-1 hover:text-cyan-300 text-slate-300 transition-colors">
              <PackageCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Track Orders</span>
            </Link>
            <Link href="/admin/login" className="flex items-center gap-1 hover:text-amber-300 text-slate-300 transition-colors">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
        <Link href="/" className="shrink-0" aria-label="TECH AI home">
          <TechAiLogo size="md" />
        </Link>

        {/* Desktop Search Bar */}
        <div className="hidden md:flex flex-1 max-w-2xl mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search AI electronics, smart watches, cleats, stress toys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-24 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
            />
            <button
              type="button"
              className="absolute right-1 top-1 h-8 px-4 bg-slate-900 hover:bg-cyan-600 text-white rounded-lg text-xs font-black transition-colors"
            >
              Search
            </button>
          </div>
        </div>

        {/* Right Navigation Actions */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {/* User Account / Dropdown */}
          <div className="relative">
            {user ? (
              <button
                onClick={() => setUserDropdown((value) => !value)}
                className="h-10 px-2 sm:px-3 rounded-xl hover:bg-slate-100 flex items-center gap-2 text-xs font-bold text-slate-800 transition-colors border border-transparent hover:border-slate-200"
              >
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                  alt={user.name}
                  className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200"
                />
                <span className="hidden sm:block max-w-[120px] truncate">{user.name}</span>
                <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400" />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="h-10 px-3 rounded-xl hover:bg-slate-100 flex items-center gap-1.5 text-xs font-extrabold text-slate-800 transition-colors border border-slate-200"
              >
                <User className="w-4 h-4 text-slate-700" />
                <span className="hidden sm:block">Login</span>
              </button>
            )}

            <AnimatePresence>
              {userDropdown && user && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 text-xs z-50 overflow-hidden"
                >
                  <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                    <p className="font-black text-slate-900 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email || user.phone}</p>
                  </div>
                  <Link
                    href="/orders"
                    onClick={() => setUserDropdown(false)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 flex items-center gap-2 font-bold text-slate-700 hover:text-cyan-700"
                  >
                    <PackageCheck className="w-4 h-4 text-cyan-600" />
                    <span>My Orders & Invoices</span>
                  </Link>
                  <button
                    onClick={() => {
                      setUserDropdown(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-bold transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Orders Link */}
          <Link
            href="/orders"
            className="hidden sm:flex h-10 px-3 rounded-xl hover:bg-slate-100 items-center gap-1.5 text-xs font-bold text-slate-800 transition-colors border border-slate-200"
          >
            <PackageCheck className="w-4 h-4 text-cyan-600" />
            <span>Orders</span>
          </Link>

          {/* Cart Button */}
          <button
            onClick={onOpenCart}
            className="relative h-10 px-3 sm:px-4 rounded-xl bg-slate-900 hover:bg-cyan-600 text-white flex items-center gap-2 text-xs font-black transition-all shadow-md"
          >
            <ShoppingCart className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:block">Cart</span>
            {cartCount > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="px-3 pb-2.5 md:hidden">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search gadgets, watches, shoes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Horizontal Category Pill Bar (Swipeable) */}
      <div className="border-t border-slate-100 bg-slate-50/80 overflow-x-auto no-scrollbar py-1.5 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setMobileMenuOpen(false);
              }}
              className={`px-3 py-1 rounded-xl whitespace-nowrap border font-bold text-xs transition-all ${
                selectedCategory === category
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
