"use client";

import React from "react";
import { motion } from "framer-motion";
import { Clock, ShieldCheck, ArrowUpRight } from "lucide-react";

interface BrandItem {
  id: string;
  name: string;
  category: string;
  logoText: string;
  tagline: string;
  deliveryTime: string;
  badgeBg: string;
}

const BRAND_STORES: BrandItem[] = [
  {
    id: "brand-apple",
    name: "Apple",
    category: "Electronics",
    logoText: " Apple",
    tagline: "Official Flagship Store",
    deliveryTime: "Delivery in 24 hours",
    badgeBg: "bg-slate-900 text-white",
  },
  {
    id: "brand-samsung",
    name: "Samsung",
    category: "Mobiles & Wearables",
    logoText: "SAMSUNG",
    tagline: "Galaxy AI & Smart Home",
    deliveryTime: "Delivery in 24 hours",
    badgeBg: "bg-blue-600 text-white",
  },
  {
    id: "brand-adidas",
    name: "Adidas",
    category: "Fashion",
    logoText: "adidas",
    tagline: "Sportswear & Footwear",
    deliveryTime: "Delivery in 24 hours",
    badgeBg: "bg-black text-white",
  },
  {
    id: "brand-boat",
    name: "boAt",
    category: "Electronics",
    logoText: "boAt",
    tagline: "Audio & Wearables",
    deliveryTime: "Delivery in 24 hours",
    badgeBg: "bg-red-600 text-white",
  },
  {
    id: "brand-titan",
    name: "Titan",
    category: "Fashion",
    logoText: "TITAN",
    tagline: "Luxury & Neo Watches",
    deliveryTime: "Delivery in 24 hours",
    badgeBg: "bg-amber-800 text-white",
  },
  {
    id: "brand-lg",
    name: "LG Electronics",
    category: "Home Appliances",
    logoText: "LG",
    tagline: "Life's Good Appliances",
    deliveryTime: "Delivery in 24 hours",
    badgeBg: "bg-rose-700 text-white",
  },
  {
    id: "brand-dell",
    name: "Dell",
    category: "Computers & Gaming",
    logoText: "DELL",
    tagline: "High Performance Laptops",
    deliveryTime: "Delivery in 24 hours",
    badgeBg: "bg-sky-600 text-white",
  },
  {
    id: "brand-mamaearth",
    name: "Mamaearth",
    category: "Beauty & Personal Care",
    logoText: "mamaearth",
    tagline: "Toxin-Free Beauty & Care",
    deliveryTime: "Delivery in 24 hours",
    badgeBg: "bg-emerald-700 text-white",
  },
];

interface BrandStoresSectionProps {
  onSelectBrand: (brandName: string, category: string) => void;
}

export default function BrandStoresSection({ onSelectBrand }: BrandStoresSectionProps) {
  return (
    <section className="px-3 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Explore Official Brand Stores</span>
            <span className="text-[10px] font-extrabold uppercase bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded-full">
              100% Genuine
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Authentic brand warranties, verified stock, and lightning-fast dispatch
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
        {BRAND_STORES.map((brand) => (
          <motion.button
            key={brand.id}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectBrand(brand.name, brand.category)}
            className="group flex flex-col justify-between p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-cyan-400/80 transition-all text-left relative overflow-hidden"
          >
            {/* Top Brand Logo / Text */}
            <div className="flex items-center justify-between w-full mb-3">
              <span className="font-black text-sm sm:text-base tracking-wider text-slate-900 group-hover:text-cyan-700 transition-colors">
                {brand.logoText}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-600 transition-colors" />
            </div>

            {/* Tagline & Delivery Badge */}
            <div className="space-y-1.5 w-full">
              <p className="text-[10px] text-slate-500 font-bold truncate">
                {brand.tagline}
              </p>
              <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md w-fit">
                <Clock className="w-2.5 h-2.5" />
                <span className="truncate">{brand.deliveryTime}</span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
