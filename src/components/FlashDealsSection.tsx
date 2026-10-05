"use client";

import React, { useState, useEffect } from "react";
import { Timer, Flame } from "lucide-react";
import { Product } from "@/lib/types";
import ProductCard, { ProductCardSkeleton } from "./ProductCard";
import SectionHeader from "./SectionHeader";
import { countdown } from "@/lib/homepage";

interface FlashDealsSectionProps {
  products: Product[];
  endAt?: string;
  countdownLabel?: string;
  loading?: boolean;
  wishlist: string[];
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  onViewAll: () => void;
}

export default function FlashDealsSection({
  products,
  endAt = "",
  countdownLabel = "Ends in",
  loading = false,
  wishlist,
  onAddToCart,
  onQuickView,
  onToggleWishlist,
  onViewAll,
}: FlashDealsSectionProps) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    if (!endAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [endAt]);
  const timeLeft = now === null ? null : countdown(endAt, now);
  if (!loading && !products.length) return null;
  return (
    <section className="px-3 sm:px-6 lg:px-8 py-4">
      <SectionHeader title="Flash Deals" action="View All Deals" onAction={onViewAll}>
        <Flame aria-hidden="true" className="w-5 h-5 text-rose-600 fill-rose-600" />
        {timeLeft && <span role="timer" aria-label="Flash deals countdown" className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-rose-700 bg-slate-100 px-2.5 py-1 rounded-lg">
          <Timer className="w-3.5 h-3.5" />{timeLeft.expired ? "Offer ended" : countdownLabel + " " + timeLeft.label}
        </span>}
      </SectionHeader>
      {/* Grid of Product Cards: Always even rows on phone (2-cols) and desktop (6-cols) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4 items-stretch">
        {loading ? Array.from({ length: 6 }, (_, i) => <ProductCardSkeleton key={i} />) : products.map((product) => (
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
