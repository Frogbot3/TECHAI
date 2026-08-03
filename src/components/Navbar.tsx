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
      <div className="bg-slate-900 text-slate-100 text-[11px] sm:text-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-3">
          <button className="hidden sm:flex items-center gap-1 text-slate-300 hover:text-white">
            <MapPin className="w-3.5 h-3.5" />
            <span>Delivering across India</span>
          </button>
          <div className="flex items-center justify-center sm:justify-end gap-4 w-full sm:w-auto">
            <button onClick={onOpenTracking} className="flex items-center gap-1 hover:text-white text-slate-300">
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Track Order</span>
            </button>
            <Link href="/admin/login" className="flex items-center gap-1 hover:text-white text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
        <Link href="/" className="shrink-0" aria-label="TECH AI home">
          <TechAiLogo size="md" />
        </Link>

        <div className="hidden md:flex flex-1 max-w-3xl">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search mobiles, appliances, fashion, groceries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-24 text-sm bg-white border border-slate-300 rounded-md text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
            <button
              type="button"
              className="absolute right-0 top-0 h-10 px-5 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-r-md text-sm font-bold"
            >
              Search
            </button>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <div className="relative">
            {user ? (
              <button
                onClick={() => setUserDropdown((value) => !value)}
                className="h-10 px-2 sm:px-3 rounded-md hover:bg-slate-100 flex items-center gap-2 text-sm text-slate-800"
              >
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                  alt={user.name}
                  className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200"
                />
                <span className="hidden sm:block max-w-[120px] truncate font-semibold">{user.name}</span>
                <ChevronDown className="hidden sm:block w-4 h-4 text-slate-500" />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="h-10 px-2 sm:px-3 rounded-md hover:bg-slate-100 flex items-center gap-2 text-sm font-semibold text-slate-800"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:block">Login</span>
              </button>
            )}

            <AnimatePresence>
              {userDropdown && user && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-lg py-2 text-sm z-50"
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email || user.phone}</p>
                  </div>
                  <button
                    onClick={() => {
                      setUserDropdown(false);
                      onOpenTracking();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <PackageCheck className="w-4 h-4 text-slate-500" />
                    <span>My Orders</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdown(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={onOpenTracking}
            className="hidden sm:flex h-10 px-3 rounded-md hover:bg-slate-100 items-center gap-2 text-sm font-semibold text-slate-800"
          >
            <PackageCheck className="w-5 h-5" />
            <span>Orders</span>
          </button>

          <button className="hidden lg:flex h-10 px-3 rounded-md hover:bg-slate-100 items-center gap-2 text-sm font-semibold text-slate-800">
            <Heart className="w-5 h-5" />
            <span>{wishlistCount}</span>
          </button>

          <button
            onClick={onOpenCart}
            className="relative h-10 px-2 sm:px-3 rounded-md bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-2 text-sm font-bold"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:block">Cart</span>
            {cartCount > 0 && (
              <span className="min-w-5 h-5 px-1 rounded-full bg-amber-400 text-slate-950 text-xs flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="md:hidden h-10 w-10 rounded-md hover:bg-slate-100 flex items-center justify-center"
            aria-label="Open menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="px-3 pb-3 md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-3 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
      </div>

      <AnimatePresence>
        {(mobileMenuOpen || true) && (
          <motion.div
            initial={false}
            className="border-t border-slate-200 bg-slate-50 overflow-x-auto no-scrollbar"
          >
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 flex items-center gap-2 text-xs sm:text-sm">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-md whitespace-nowrap border transition-colors ${
                    selectedCategory === category
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
