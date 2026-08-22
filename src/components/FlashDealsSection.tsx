"use client";

import React, { useState, useEffect } from "react";
import { Timer, Flame, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

interface FlashDealsSectionProps {
  products: Product[];
  wishlist: string[];
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  onViewAll: () => void;
}

export default function FlashDealsSection({
  products,
  wishlist,
  onAddToCart,
  onQuickView,
  onToggleWishlist,
  onViewAll,
}: FlashDealsSectionProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 7, minutes: 45, seconds: 12 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const dealProducts = products.filter((p) => p.discountPercent >= 40).slice(0, 5);

  if (dealProducts.length === 0) return null;

  return (
    <section className="px-3 sm:px-6 lg:px-8 py-5">
      {/* Header with Title & Clean Countdown Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-rose-600 font-extrabold text-lg sm:text-xl">
            <Flame className="w-5 h-5 fill-rose-600" />
            <span>Flash Deals</span>
          </div>

          <div className="flex items-center space-x-1 text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
            <Timer className="w-3.5 h-3.5 text-slate-500 mr-1" />
            <span>Ends in:</span>
            <span className="text-rose-600 font-extrabold">
              {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 self-start sm:self-auto"
        >
          <span>View All Deals</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Grid of Product Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 items-stretch">
        {dealProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isInWishlist={wishlist.includes(product.id)}
            onAddToCart={onAddToCart}
            onQuickView={onQuickView}
            onToggleWishlist={onToggleWishlist}
          />
        ))}
      </div>
    </section>
  );
}
