"use client";

import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CategoryItem {
  id: string;
  name: string;
  categoryFilter: string;
  image: string;
}

const POPULAR_CATEGORIES: CategoryItem[] = [
  {
    id: "cat-electronics",
    name: "Electronics & Audio",
    categoryFilter: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "cat-mobiles",
    name: "Mobiles & Watches",
    categoryFilter: "Mobiles & Wearables",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "cat-computers",
    name: "Computers & Gaming",
    categoryFilter: "Computers & Gaming",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "cat-home",
    name: "Home Appliances",
    categoryFilter: "Home Appliances",
    image: "https://images.unsplash.com/photo-1608354580875-30bd4168b351?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "cat-fashion",
    name: "Fashion & Footwear",
    categoryFilter: "Fashion",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "cat-beauty",
    name: "Beauty & Personal Care",
    categoryFilter: "Beauty & Personal Care",
    image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "cat-grocery",
    name: "Grocery & Essentials",
    categoryFilter: "Grocery & Essentials",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop&q=80",
  },
];

interface CategoryBubblesProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategoryBubbles({
  selectedCategory,
  onSelectCategory,
}: CategoryBubblesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const amount = direction === "left" ? -240 : 240;
      scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  return (
    <section id="categories-section" className="px-3 sm:px-6 lg:px-8 py-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Popular Categories
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Browse catalog by departmental departments
          </p>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => onSelectCategory("All Categories")}
            className="text-xs font-bold text-cyan-700 hover:text-cyan-800 transition-colors mr-2"
          >
            View All
          </button>
          <div className="hidden sm:flex items-center space-x-1">
            <button
              type="button"
              onClick={() => handleScroll("left")}
              className="w-7 h-7 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              aria-label="Previous categories"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll("right")}
              className="w-7 h-7 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              aria-label="Next categories"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories Horizontal Carousel */}
      <div
        ref={scrollRef}
        className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar py-1 snap-x-mandatory"
      >
        {POPULAR_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.categoryFilter;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.categoryFilter)}
              className={`flex-shrink-0 flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer snap-start w-28 sm:w-32 text-center group ${
                isSelected
                  ? "bg-cyan-50 border-cyan-500 shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70"
              }`}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-slate-50 flex items-center justify-center p-1.5 mb-2 overflow-hidden group-hover:scale-105 transition-transform">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                />
              </div>
              <span
                className={`text-xs leading-tight line-clamp-2 transition-colors ${
                  isSelected ? "font-bold text-cyan-900" : "font-semibold text-slate-800 group-hover:text-cyan-700"
                }`}
              >
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
