"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CATEGORIES } from "@/lib/data";
import TechAiLogo from "./TechAiLogo";
import LocationModal from "./LocationModal";
import SearchOverlay from "./SearchOverlay";
import { Product } from "@/lib/types";
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
  Flame,
  Grid,
  Headphones,
  Smartphone,
  Laptop,
  Home,
  ShoppingBag,
  Sparkles,
  Utensils,
  ArrowRight,
} from "lucide-react";

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  user: any;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  products?: Product[];
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onOpenTracking: () => void;
  onSelectProduct?: (product: Product) => void;
  onLogout: () => void;
}

const CURRENCIES = [
  { code: "INR", symbol: "₹", flag: "🇮🇳", label: "India (₹ INR)" },
  { code: "AED", symbol: "AED", flag: "🇦🇪", label: "UAE (AED)" },
  { code: "USD", symbol: "$", flag: "🇺🇸", label: "USA ($ USD)" },
];

const MEGA_MENU_CATEGORIES = [
  {
    title: "Electronics & Audio",
    categoryFilter: "Electronics",
    icon: Headphones,
    items: ["Wireless Earbuds", "Bluetooth Headphones", "Noise-Cancelling Audio", "Portable Speakers"],
  },
  {
    title: "Mobiles & Smart Tech",
    categoryFilter: "Mobiles & Wearables",
    icon: Smartphone,
    items: ["5G Smartphones", "Calling Smartwatches", "Fitness Trackers", "Fast Chargers"],
  },
  {
    title: "Computers & Gaming",
    categoryFilter: "Computers & Gaming",
    icon: Laptop,
    items: ["Mechanical Keyboards", "HD Webcams", "Gaming Accessories", "Storage Drives"],
  },
  {
    title: "Home & Appliances",
    categoryFilter: "Home Appliances",
    icon: Home,
    items: ["Steam Irons", "Electric Kettles", "Kitchen Blenders", "Daily Living"],
  },
  {
    title: "Fashion & Footwear",
    categoryFilter: "Fashion",
    icon: ShoppingBag,
    items: ["Running Shoes", "Analogue Luxury Watches", "Foam Clogs", "Casual Apparel"],
  },
  {
    title: "Beauty & Grocery",
    categoryFilter: "Grocery & Essentials",
    icon: Utensils,
    items: ["Vitamin C Cleansers", "Unpolished Pulses", "Healthy Pantry", "Personal Care"],
  },
];

export default function Navbar({
  cartCount,
  wishlistCount,
  user,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  products = [],
  onOpenCart,
  onOpenAuth,
  onOpenTracking,
  onSelectProduct,
  onLogout,
}: NavbarProps) {
  const [userDropdown, setUserDropdown] = useState(false);
  const [currencyDropdown, setCurrencyDropdown] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]); // Default INR
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState("Mumbai 400001");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search overlay on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-sm">
        {/* Top Utility Bar */}
        <div className="bg-slate-950 text-slate-300 text-[11px]">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-2">
            {/* Delivery Location Selector */}
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-1.5 hover:text-white transition-colors text-slate-300 group cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span className="truncate">
                Deliver to: <strong className="text-white font-semibold">{deliveryLocation}</strong>
              </span>
              <span className="text-[10px] text-cyan-400 font-bold ml-1">Change</span>
            </button>

            {/* Right Utility Links */}
            <div className="flex items-center space-x-4 flex-shrink-0">
              {/* Currency Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setCurrencyDropdown((prev) => !prev)}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-[11px]"
                >
                  <span>{selectedCurrency.flag}</span>
                  <span className="font-bold">{selectedCurrency.code}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                <AnimatePresence>
                  {currencyDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="absolute right-0 mt-1.5 w-36 bg-white text-slate-900 border border-slate-200 rounded-xl shadow-xl py-1 text-xs z-50"
                    >
                      {CURRENCIES.map((curr) => (
                        <button
                          key={curr.code}
                          type="button"
                          onClick={() => {
                            setSelectedCurrency(curr);
                            setCurrencyDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 transition-colors ${
                            selectedCurrency.code === curr.code ? "bg-cyan-50 font-bold text-cyan-800" : ""
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span>{curr.flag}</span>
                            <span>{curr.code}</span>
                          </span>
                          <span className="text-[10px] text-slate-400">{curr.symbol}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Order Tracking */}
              <Link
                href="/orders"
                className="hidden sm:flex items-center gap-1 hover:text-white transition-colors"
              >
                <PackageCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Track Orders</span>
              </Link>

              {/* Admin Portal */}
              <Link
                href="/admin/login"
                className="flex items-center gap-1 hover:text-white transition-colors text-slate-400 hover:text-slate-200"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Header Bar */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-6">
          {/* Brand Logo */}
          <Link href="/" className="shrink-0 flex items-center" aria-label="TECH AI home">
            <TechAiLogo size="md" />
          </Link>

          {/* Desktop Search Bar with Live Suggestions Overlay */}
          <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-2xl relative">
            <div className="relative w-full flex items-center bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-cyan-500 focus-within:bg-white focus-within:border-cyan-500 transition-all">
              <Search className="ml-3.5 w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search products, brands, smart gadgets..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                className="w-full h-10 px-3 text-xs font-medium bg-transparent text-slate-900 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mr-2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsSearchFocused(false)}
                className="mr-1 h-8 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Search
              </button>
            </div>

            {/* Live Search Suggestions Dropdown */}
            <SearchOverlay
              isOpen={isSearchFocused}
              query={searchQuery}
              products={products}
              onSelectQuery={(q) => {
                setSearchQuery(q);
                setIsSearchFocused(false);
              }}
              onSelectProduct={(p) => {
                setIsSearchFocused(false);
                if (onSelectProduct) onSelectProduct(p);
              }}
              onClose={() => setIsSearchFocused(false)}
            />
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-1.5 sm:space-x-3 flex-shrink-0">
            {/* Wishlist */}
            <button
              type="button"
              onClick={() => setSelectedCategory("All Categories")}
              className="relative p-2 text-slate-700 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              type="button"
              onClick={onOpenCart}
              className="relative flex items-center gap-2 h-10 px-3 sm:px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="min-w-5 h-5 px-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center shadow-sm">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Account */}
            <div className="relative">
              {user ? (
                <button
                  type="button"
                  onClick={() => setUserDropdown((prev) => !prev)}
                  className="h-10 px-2 sm:px-3 rounded-xl hover:bg-slate-100 flex items-center gap-1.5 text-xs font-bold text-slate-800 transition-colors border border-transparent hover:border-slate-200"
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`}
                    alt={user.name}
                    className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200"
                  />
                  <span className="hidden sm:block max-w-[90px] truncate">{user.name}</span>
                  <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-slate-400" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="h-10 px-3 rounded-xl hover:bg-slate-100 flex items-center gap-1.5 text-xs font-bold text-slate-800 transition-colors border border-slate-200"
                >
                  <User className="w-4 h-4 text-slate-700" />
                  <span className="hidden sm:block">Sign In</span>
                </button>
              )}

              <AnimatePresence>
                {userDropdown && user && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-2 text-xs z-50"
                  >
                    <div className="px-4 py-2 border-b border-slate-100 bg-slate-50">
                      <p className="font-bold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{user.email || user.phone}</p>
                    </div>
                    <Link
                      href="/orders"
                      onClick={() => setUserDropdown(false)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 font-medium text-slate-700 hover:text-cyan-700"
                    >
                      <PackageCheck className="w-4 h-4 text-cyan-600" />
                      <span>My Orders & Invoices</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 font-medium transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="px-3 pb-2 md:hidden">
          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-cyan-500 focus-within:bg-white transition-all">
            <Search className="ml-3 w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search products, brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 px-2 text-xs bg-transparent text-slate-900 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="mr-2 text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sub-Category Navigation Bar with Desktop Mega Menu */}
        <div className="border-t border-slate-100 bg-white relative">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between text-xs">
            {/* Left Category Strip */}
            <div className="flex items-center overflow-x-auto no-scrollbar py-1.5 gap-1">
              {/* All Categories Mega Menu Trigger */}
              <div
                className="relative"
                onMouseEnter={() => setIsMegaMenuOpen(true)}
                onMouseLeave={() => setIsMegaMenuOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setIsMegaMenuOpen((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs whitespace-nowrap transition-colors ${
                    isMegaMenuOpen || selectedCategory === "All Categories"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  <Menu className="w-3.5 h-3.5" />
                  <span>All Categories</span>
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                </button>

                {/* Desktop Mega Menu Dropdown */}
                <AnimatePresence>
                  {isMegaMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.15 }}
                      className="hidden md:block absolute top-full left-0 mt-1 w-[720px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 z-50 text-slate-900"
                    >
                      <div className="grid grid-cols-3 gap-6">
                        {MEGA_MENU_CATEGORIES.map((catGroup) => {
                          const Icon = catGroup.icon;
                          return (
                            <div key={catGroup.title} className="space-y-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCategory(catGroup.categoryFilter);
                                  setIsMegaMenuOpen(false);
                                }}
                                className="flex items-center space-x-1.5 font-bold text-xs text-slate-900 hover:text-cyan-700 transition-colors w-full text-left pb-1 border-b border-slate-100"
                              >
                                <Icon className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                                <span>{catGroup.title}</span>
                              </button>
                              <ul className="space-y-1 text-slate-600 text-[11px]">
                                {catGroup.items.map((item) => (
                                  <li key={item}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSearchQuery(item);
                                        setSelectedCategory("All Categories");
                                        setIsMegaMenuOpen(false);
                                      }}
                                      className="hover:text-cyan-600 transition-colors block text-left py-0.5 font-medium"
                                    >
                                      {item}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-2xl">
                        <span className="text-xs font-semibold text-slate-600">
                          Looking for specific electronics or lifestyle goods?
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory("All Categories");
                            setIsMegaMenuOpen(false);
                          }}
                          className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1"
                        >
                          <span>Explore All {products.length} Products</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Direct Category Links */}
              {CATEGORIES.filter((c) => c !== "All Categories").map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-semibold text-xs transition-colors ${
                    selectedCategory === category
                      ? "bg-cyan-50 text-cyan-800 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Quick Deals Link on Right */}
            <div className="hidden lg:flex items-center flex-shrink-0 pl-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("All Categories")}
                className="flex items-center gap-1 text-rose-600 font-bold hover:text-rose-700 px-2 py-1 rounded-md text-xs"
              >
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                <span>Today's Deals</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Location Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        currentLocation={deliveryLocation}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={(loc) => setDeliveryLocation(loc.replace("Delivering to ", ""))}
      />
    </>
  );
}
