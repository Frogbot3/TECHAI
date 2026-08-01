"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import TechAiLogo from "./TechAiLogo";
import {
  Search,
  ShoppingBag,
  User,
  PackageCheck,
  ShieldAlert,
  Sparkles,
  Heart,
  Menu,
  X,
  LogOut,
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";
import { CATEGORIES } from "@/lib/data";

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
  onLogout
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
      <div className="bg-slate-900 text-white text-xs py-1.5 px-4 text-center flex items-center justify-between font-medium">
        <div className="hidden sm:flex items-center space-x-2 text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>TECH AI Flagship Launch: Get extra 10% off with coupon <strong>TECHAI10</strong></span>
        </div>
        <div className="flex items-center space-x-4 mx-auto sm:mx-0">
          <button
            onClick={onOpenTracking}
            className="flex items-center space-x-1 hover:text-cyan-400 transition-colors"
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Track Order</span>
          </button>
          <span className="text-slate-700">|</span>
          <Link
            href="/admin/login"
            className="flex items-center space-x-1 hover:text-amber-400 transition-colors text-slate-300"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin Portal</span>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <Link href="/" className="flex-shrink-0 group">
          <TechAiLogo size="md" />
        </Link>

        <div className="hidden md:flex flex-1 max-w-2xl items-center relative">
          <div className="relative w-full flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search AI gadgets, football cleats, watches, stress toys..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-24 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all text-slate-800"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-20 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
            <div className="absolute right-1 text-xs font-semibold text-white bg-slate-900 px-3 py-1.5 rounded-full flex items-center space-x-1 pointer-events-none">
              <span>Search</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={onOpenTracking}
            className="p-2 text-slate-600 hover:text-slate-900 sm:hidden rounded-full hover:bg-slate-100"
            title="Track Order"
          >
            <PackageCheck className="w-5 h-5" />
          </button>

          <div className="relative">
            {user ? (
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors border border-slate-200"
              >
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                  alt={user.name}
                  className="w-7 h-7 rounded-full bg-cyan-100"
                />
                <span className="hidden sm:inline text-xs font-semibold text-slate-800 max-w-[100px] truncate">
                  {user.name}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
              >
                <User className="w-4 h-4 text-slate-600" />
                <span>Sign In</span>
              </button>
            )}

            <AnimatePresence>
              {userDropdown && user && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl py-2 z-50 text-xs"
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900">{user.name}</p>
                    <p className="text-slate-500 truncate">{user.phone}</p>
                  </div>
                  <button
                    onClick={() => {
                      setUserDropdown(false);
                      onOpenTracking();
                    }}
                    className="w-full text-left px-4 py-2 text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                  >
                    <PackageCheck className="w-4 h-4 text-cyan-600" />
                    <span>My Orders</span>
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdown(false);
                      onLogout();
                    }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={onOpenCart}
            className="relative flex items-center space-x-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-semibold transition-all shadow-sm group"
          >
            <ShoppingBag className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="bg-cyan-500 text-slate-950 font-bold px-1.5 py-0.5 rounded-full text-[10px] min-w-[18px] text-center ml-1">
                {cartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 md:hidden rounded-lg hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <div className="px-4 pb-3 md:hidden">
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-full text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center space-x-2 text-xs font-medium">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? "bg-slate-900 text-white font-semibold shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
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
