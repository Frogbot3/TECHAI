"use client";

import React, { useEffect, useState } from "react";
import { Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import { Clock, Trash2 } from "lucide-react";

interface RecentlyViewedSectionProps {
  allProducts: Product[];
  wishlist: string[];
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
}

const STORAGE_KEY = "techai_recently_viewed_v2";

export function recordRecentlyViewed(productId: string) {
  if (typeof window === "undefined" || !productId) return;
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const filtered = [productId, ...existing.filter((id: string) => id !== productId)].slice(0, 8);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // Ignore storage issues
  }
}

export default function RecentlyViewedSection({
  allProducts,
  wishlist,
  onAddToCart,
  onQuickView,
  onToggleWishlist,
}: RecentlyViewedSectionProps) {
  const [viewedIds, setViewedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setViewedIds(JSON.parse(stored));
      }
    } catch {
      // Ignore
    }
  }, []);

  const viewedProducts = allProducts.filter((p) => viewedIds.includes(p.id));

  if (viewedProducts.length === 0) return null;

  const handleClear = () => {
    setViewedIds([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  return (
    <section className="px-3 sm:px-6 lg:px-8 py-5">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Recently Viewed Products
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Items you recently explored on TECH AI
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="text-xs font-semibold text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Clear History</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 items-stretch">
        {viewedProducts.slice(0, 5).map((product) => (
          <ProductCard
            key={`rv-${product.id}`}
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
