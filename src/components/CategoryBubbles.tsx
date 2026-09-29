"use client";

import React, { useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Headphones,
  Smartphone,
  Laptop,
  Home,
  Shirt,
  Sparkles,
  ShoppingBag,
  Camera,
  Dumbbell,
  Package,
  Zap,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import TechAiLogo from "./TechAiLogo";

interface CategoryItem {
  id: string;
  name: string;
  categoryFilter: string;
  image: string;
  fallbackIcon: React.ElementType;
}

const POPULAR_CATEGORIES: CategoryItem[] = [
  {
    id: "cat-mobiles",
    name: "Mobiles & Wearables",
    categoryFilter: "Mobiles & Wearables",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80",
    fallbackIcon: Smartphone,
  },
  {
    id: "cat-electronics",
    name: "Electronics & Audio",
    categoryFilter: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80",
    fallbackIcon: Headphones,
  },
  {
    id: "cat-computers",
    name: "Computers & Gaming",
    categoryFilter: "Computers & Gaming",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add?w=300&auto=format&fit=crop&q=80",
    fallbackIcon: Laptop,
  },
  {
    id: "cat-home",
    name: "Home Appliances",
    categoryFilter: "Home Appliances",
    image: "https://images.unsplash.com/photo-1608354580875-30bd4168b351?w=300&auto=format&fit=crop&q=80",
    fallbackIcon: Home,
  },
  {
    id: "cat-fashion",
    name: "Fashion & Footwear",
    categoryFilter: "Fashion",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80",
    fallbackIcon: Shirt,
  },
  {
    id: "cat-beauty",
    name: "Beauty & Personal Care",
    categoryFilter: "Beauty & Personal Care",
    image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=300&auto=format&fit=crop&q=80",
    fallbackIcon: Sparkles,
  },
  {
    id: "cat-grocery",
    name: "Grocery & Essentials",
    categoryFilter: "Grocery & Essentials",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop&q=80",
    fallbackIcon: ShoppingBag,
  },
  {
    id: "cat-camera",
    name: "Cameras & Drones",
    categoryFilter: "Electronics",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&auto=format&fit=crop&q=80",
    fallbackIcon: Camera,
  },
  {
    id: "cat-fitness",
    name: "Fitness & Sports",
    categoryFilter: "Fashion",
    image: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=300&auto=format&fit=crop&q=80",
    fallbackIcon: Dumbbell,
  },
];

interface CategoryBubblesProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

function CategoryItemButton({
  cat,
  isSelected,
  onSelectCategory,
}: {
  cat: CategoryItem;
  isSelected: boolean;
  onSelectCategory: (category: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const FallbackIcon = cat.fallbackIcon || Package;

  return (
    <button
      type="button"
      onClick={() => onSelectCategory(cat.categoryFilter)}
      className={`flex-shrink-0 flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 cursor-pointer snap-start w-24 sm:w-32 text-center group ${
        isSelected
          ? "bg-cyan-50/90 border-cyan-500 shadow-sm ring-2 ring-cyan-400/20"
          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-xs"
      }`}
    >
      <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1.5 mb-1.5 sm:mb-2 overflow-hidden group-hover:scale-105 transition-transform duration-200">
        {!imgError && cat.image ? (
          <img
            src={cat.image}
            alt={cat.name}
            onError={() => setImgError(true)}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
          />
        ) : (
          <FallbackIcon className="w-6 h-6 text-cyan-700" />
        )}
      </div>
      <span
        className={`text-[11px] sm:text-xs leading-tight line-clamp-2 transition-colors ${
          isSelected
            ? "font-bold text-cyan-950"
            : "font-semibold text-slate-800 group-hover:text-cyan-700"
        }`}
      >
        {cat.name}
      </span>
    </button>
  );
}

export default function CategoryBubbles({
  selectedCategory,
  onSelectCategory,
}: CategoryBubblesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -280 : 280;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <section id="categories-section" className="px-3 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-200/80">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Popular Categories</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
              <Zap className="w-3 h-3 text-cyan-600 fill-cyan-600" />
              <span>Trending</span>
            </span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Explore products by curated departments & verified brands
          </p>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => onSelectCategory("All Categories")}
            className="text-xs font-bold text-cyan-700 hover:text-cyan-800 transition-colors mr-2 cursor-pointer"
          >
            View All
          </button>
          <div className="hidden sm:flex items-center space-x-1">
            <button
              type="button"
              onClick={() => handleScroll("left")}
              className="w-7 h-7 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
              aria-label="Previous categories"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll("right")}
              className="w-7 h-7 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
              aria-label="Next categories"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories Row with Animated Tech AI Brand Hub Card */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex items-stretch gap-2.5 sm:gap-3.5 overflow-x-auto no-scrollbar py-1 snap-x-mandatory scroll-smooth"
        >
          {POPULAR_CATEGORIES.map((cat) => (
            <CategoryItemButton
              key={cat.id}
              cat={cat}
              isSelected={selectedCategory === cat.categoryFilter}
              onSelectCategory={onSelectCategory}
            />
          ))}

          {/* Animated Brand Showcase Card: Seamlessly occupies side space and eliminates blank area */}
          <div className="flex-shrink-0 snap-start w-56 sm:w-64 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-950 p-3.5 sm:p-4 text-white flex flex-col justify-between relative overflow-hidden shadow-sm border border-slate-700/60 group">
            {/* Animated Glow Background Effect */}
            <div className="absolute -right-8 -top-8 w-28 h-28 bg-cyan-500/20 rounded-full blur-2xl group-hover:bg-cyan-400/30 transition-all duration-700 animate-pulse pointer-events-none" />
            <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-emerald-500/15 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-0.5" />
                  Live Deals
                </span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>

              {/* Animated Logo Display */}
              <div className="my-1.5 py-1 px-2.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 inline-flex items-center group-hover:scale-102 transition-transform">
                <TechAiLogo size="sm" className="brightness-125" />
              </div>

              <p className="text-[11px] font-medium text-slate-300 leading-snug mt-1.5">
                100% Genuine Certified Brands with AI Price Match & Instant Dispatch.
              </p>
            </div>

            <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onSelectCategory("All Categories")}
                className="w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98 cursor-pointer"
              >
                <span>Explore 50+ Products</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
