"use client";
import ProductImage from "./ProductImage";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import TechAiLogo from "./TechAiLogo";
import LocationModal from "./LocationModal";
import SearchOverlay from "./SearchOverlay";
import { Product } from "@/lib/types";
import {
  ChevronDown,
  Heart,
  MapPin,
  PackageCheck,
  Search,
  ShoppingCart,
  User,
  X,
  Flame,
  Headphones,
  Smartphone,
  Laptop,
  Home,
  ShoppingBag,
  Utensils,
  Menu,
  LogOut,
  ArrowRight,
} from "lucide-react";

interface NavbarProps {
  cartCount: number;
  wishlistCount: number;
  user: any;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  products?: Product[];
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onOpenTracking: () => void;
  onSelectProduct?: (product: Product) => void;
  onLogout: () => void;
  onResetHome?: () => void;
}

const CATEGORIES = [
  "All Categories",
  "Electronics",
  "Mobiles & Wearables",
  "Computers & Gaming",
  "Home Appliances",
  "Fashion",
  "Grocery & Essentials",
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
  cartCount, wishlistCount, user, searchQuery, setSearchQuery, onSearchSubmit,
  selectedCategory, setSelectedCategory, products = [], onOpenCart, onOpenAuth,
  onSelectProduct, onLogout, onResetHome,
}: NavbarProps) {
  const [userDropdown, setUserDropdown] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [deliveryLocation, setDeliveryLocation] = useState("Check pincode");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLFormElement>(null);
  const categoryContainerRef = useRef<HTMLDivElement>(null);
  const accountContainerRef = useRef<HTMLDivElement>(null);
  const categoryButtonRef = useRef<HTMLButtonElement>(null);

  const savedAddress = user?.addresses?.[user.addresses.length - 1];
  useEffect(() => {
    try {
      setDeliveryLocation(localStorage.getItem("techai_delivery_pincode") || savedAddress?.pincode || "Check pincode");
    } catch { setDeliveryLocation(savedAddress?.pincode || "Check pincode"); }
  }, [user?.id, savedAddress?.pincode]);

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!searchContainerRef.current?.contains(target)) setIsSearchFocused(false);
      if (!categoryContainerRef.current?.contains(target)) setIsMegaMenuOpen(false);
      if (!accountContainerRef.current?.contains(target)) setUserDropdown(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsSearchFocused(false);
      setUserDropdown(false);
      if (isMegaMenuOpen) categoryButtonRef.current?.focus();
      setIsMegaMenuOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [isMegaMenuOpen]);

  const chooseCategory = (category: string) => {
    setSearchQuery("");
    setSelectedCategory(category);
    setIsMegaMenuOpen(false);
    setIsSearchFocused(false);
  };
  const resetHome = () => {
    if (onResetHome) onResetHome();
    else chooseCategory("All Categories");
    setIsMegaMenuOpen(false);
    setIsSearchFocused(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white shadow-[0_4px_20px_-14px_rgba(15,23,42,0.3)]">
        <div className="bg-[#071c2c] text-[11px] text-slate-200">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
            <button type="button" onClick={() => setIsLocationModalOpen(true)}
              aria-label={`Delivery: ${deliveryLocation}. Change pincode`}
              className="group flex min-h-10 min-w-0 items-center gap-2 text-left transition-colors hover:text-white">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
              <span className="truncate">Delivery: <strong className="font-semibold text-white">{deliveryLocation}</strong></span>
              <ChevronDown aria-hidden="true" className="h-3 w-3 shrink-0 text-cyan-300" />
            </button>
            <Link prefetch={false} href="/orders" className="flex min-h-10 shrink-0 items-center gap-1.5 text-slate-200 transition-colors hover:text-white">
              <PackageCheck aria-hidden="true" className="h-3.5 w-3.5 text-cyan-300" /><span>Track order</span>
            </Link>
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-3 py-3 sm:px-6 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-x-7 md:py-4 lg:px-8">
          <Link prefetch={false} href="/" onClick={resetHome} aria-label="TECH AI home" className="flex min-h-11 w-fit flex-col justify-center gap-0.5 rounded-lg focus-visible:outline-cyan-700">
            <TechAiLogo size="md" />
            <span className="whitespace-nowrap text-[9px] font-medium tracking-[0.14em] text-slate-500 max-[359px]:hidden">TECH FOR YOUR EVERYDAY</span>
          </Link>

          <form ref={searchContainerRef} role="search" aria-label="Store search"
            onSubmit={event => { event.preventDefault(); onSearchSubmit?.(searchQuery); setIsSearchFocused(false); }}
            className="relative order-3 col-span-2 w-full min-w-0 md:order-none md:col-span-1">
            <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 transition-colors focus-within:border-cyan-600 focus-within:bg-white focus-within:ring-2 focus-within:ring-cyan-100">
              <Search aria-hidden="true" className="ml-2.5 h-[18px] w-[18px] shrink-0 text-slate-400" />
              <input type="search" aria-label="Search products" autoComplete="off" enterKeyHint="search"
                placeholder="Search products, brands..." value={searchQuery}
                onFocus={() => { setIsSearchFocused(true); setIsMegaMenuOpen(false); }}
                onChange={event => { setSearchQuery(event.target.value); setIsSearchFocused(true); }}
                className="h-11 min-w-0 flex-1 bg-transparent px-2 text-base text-slate-900 outline-none placeholder:text-slate-400 md:text-sm [&::-webkit-search-cancel-button]:appearance-none" />
              {searchQuery && <button type="button" aria-label="Clear search" onClick={() => setSearchQuery("")}
                className="flex h-11 w-9 shrink-0 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>}
              <button type="submit" aria-label="Search" className="flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0d5c75] text-white shadow-sm transition-colors hover:bg-[#08475d] md:w-auto md:px-5">
                <Search aria-hidden="true" className="h-[18px] w-[18px] md:hidden" /><span className="hidden text-xs font-bold md:inline">Search</span>
              </button>
            </div>
            <SearchOverlay isOpen={isSearchFocused} query={searchQuery} products={products}
              onSelectQuery={query => { setSearchQuery(query); onSearchSubmit?.(query); setIsSearchFocused(false); }}
              onSelectProduct={product => { setIsSearchFocused(false); onSelectProduct?.(product); }}
              onClose={() => setIsSearchFocused(false)} />
          </form>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link prefetch={false} href="/wishlist" title="Wishlist" aria-label={`Wishlist (${wishlistCount} items)`}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600">
              <Heart aria-hidden="true" className="h-[19px] w-[19px]" />
              {wishlistCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white ring-2 ring-white">{wishlistCount > 9 ? "9+" : wishlistCount}</span>}
            </Link>
            <div ref={accountContainerRef} className="relative">
              <button type="button" onClick={() => user ? setUserDropdown(open => !open) : onOpenAuth()}
                aria-label={user ? "Your account" : "Sign in"} aria-expanded={user ? userDropdown : undefined}
                className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-slate-200/80 px-2.5 text-slate-600 transition-colors hover:border-cyan-200 hover:bg-cyan-50">
                {user ? <ProductImage src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`} alt={user.name} sizes="28px" width={28} height={28} className="h-7 w-7 rounded-full bg-slate-100" /> : <User aria-hidden="true" className="h-[19px] w-[19px]" />}
                <span className="hidden text-left lg:block"><span className="block text-[10px] leading-tight text-slate-500">{user ? "Welcome back" : "Your account"}</span><span className="block max-w-24 truncate text-xs font-bold text-slate-900">{user ? user.name : "Sign in"}</span></span>
              </button>
              {userDropdown && user && <div className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl">
                <div className="mb-1 border-b border-slate-100 px-4 py-3"><p className="truncate text-sm font-bold text-slate-900">{user.name}</p><p className="mt-1 truncate text-xs text-slate-500">{user.email || user.phone}</p></div>
                <Link prefetch={false} href="/orders" onClick={() => setUserDropdown(false)} className="flex min-h-11 items-center gap-2 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"><PackageCheck className="h-4 w-4 text-cyan-700" />My orders & invoices</Link>
                <button type="button" onClick={() => { setUserDropdown(false); onLogout(); }} className="flex min-h-11 w-full items-center gap-2 px-4 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50"><LogOut className="h-4 w-4" />Log out</button>
              </div>}
            </div>
            <button type="button" onClick={onOpenCart} aria-label={`Cart (${cartCount} items)`}
              className="relative flex h-11 min-w-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 text-white shadow-sm transition-colors hover:bg-slate-800">
              <ShoppingCart aria-hidden="true" className="h-[19px] w-[19px] text-amber-400" /><span className="hidden text-xs font-bold lg:inline">Cart</span>
              {cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold text-slate-950 ring-2 ring-white lg:static lg:ring-0">{cartCount > 99 ? "99+" : cartCount}</span>}
            </button>
          </div>
        </div>

        <div ref={categoryContainerRef} className="relative border-t border-slate-100 bg-white">
          <nav aria-label="Product categories" className="mx-auto flex max-w-7xl items-center gap-2 px-3 sm:px-6 lg:px-8">
            <button ref={categoryButtonRef} type="button" onClick={() => { setIsMegaMenuOpen(open => !open); setIsSearchFocused(false); }}
              aria-expanded={isMegaMenuOpen} aria-controls="header-categories"
              className={"my-1.5 flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-xs font-bold transition-colors " + (isMegaMenuOpen ? "bg-[#0d5c75] text-white" : "bg-cyan-50 text-cyan-900 hover:bg-cyan-100")}>
              <Menu aria-hidden="true" className="h-4 w-4" /><span><span className="hidden sm:inline">All </span>Categories</span><ChevronDown aria-hidden="true" className={"h-3 w-3 transition-transform " + (isMegaMenuOpen ? "rotate-180" : "")} />
            </button>
            <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
              {CATEGORIES.filter(category => category !== "All Categories").map(category => <button key={category} type="button" onClick={() => chooseCategory(category)}
                aria-pressed={selectedCategory === category}
                className={"flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-lg px-3 text-xs font-medium transition-colors " + (selectedCategory === category ? "bg-cyan-50 font-bold text-cyan-800" : "text-slate-600 hover:bg-slate-50 hover:text-cyan-800")}>
                {category}
              </button>)}
            </div>
            <Link prefetch={false} href="/#flash-deals" onClick={resetHome} className="hidden min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-rose-600 hover:bg-rose-50 xl:flex"><Flame aria-hidden="true" className="h-4 w-4" />Today's Deals</Link>
          </nav>
          {isMegaMenuOpen && <div id="header-categories" className="absolute inset-x-0 top-full z-50 mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
            <div className="max-h-[calc(100dvh-304px)] overflow-y-auto rounded-b-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-xl sm:p-6 md:max-h-[calc(100dvh-200px)]">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6">
                {MEGA_MENU_CATEGORIES.map(group => {
                  const Icon = group.icon;
                  return <div key={group.title}>
                    <button type="button" onClick={() => chooseCategory(group.categoryFilter)} className="flex min-h-14 w-full items-center gap-2 rounded-xl bg-slate-50 p-3 text-left text-xs font-bold text-slate-800 hover:bg-cyan-50 hover:text-cyan-800">
                      <Icon aria-hidden="true" className="h-5 w-5 shrink-0 text-cyan-700" /><span>{group.title}</span>
                    </button>
                    <ul className="mt-2 hidden md:block">
                      {group.items.map(item => <li key={item}><button type="button" onClick={() => { setSearchQuery(item); setSelectedCategory("All Categories"); onSearchSubmit?.(item); setIsMegaMenuOpen(false); }} className="min-h-9 px-3 text-left text-xs text-slate-500 hover:text-cyan-800">{item}</button></li>)}
                    </ul>
                  </div>;
                })}
              </div>
              <button type="button" onClick={() => chooseCategory("All Categories")} className="mt-4 flex min-h-11 w-full items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-cyan-800">Shop all products<ArrowRight aria-hidden="true" className="h-4 w-4" /></button>
            </div>
          </div>}
        </div>
      </header>
      <LocationModal isOpen={isLocationModalOpen} currentLocation={deliveryLocation} onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={pin => { setDeliveryLocation(pin); try { localStorage.setItem("techai_delivery_pincode", pin); } catch {} }} />
    </>
  );
}
