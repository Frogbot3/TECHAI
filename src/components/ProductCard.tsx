"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ProductImage from "./ProductImage";
import { Product } from "@/lib/types";
import { Heart, ShoppingCart, Star, Check, Truck, Zap } from "lucide-react";

interface ProductCardProps {
  product: Product;
  isInWishlist: boolean;
  onAddToCart: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
  priority?: boolean;
}

export default function ProductCard({
  product,
  isInWishlist,
  onAddToCart,
  onToggleWishlist,
  priority = false,
}: ProductCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(addedTimer.current), []);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= 5;

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    onAddToCart(product);
    setIsAdded(true);
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setIsAdded(false), 1400);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist(product.id);
  };

  return (
    <article
      data-product-id={product.id}
      className="group relative flex flex-col justify-between bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden p-3 sm:p-3.5 h-full"
    >
      {/* Top Floating Row: Badges + Wishlist Button */}
      <div className="absolute left-2.5 top-2.5 right-2.5 z-10 flex items-start justify-between pointer-events-none">
        {/* Badges Stack */}
        <div className="flex flex-col gap-1 items-start">
          {product.discountPercent > 0 && (
            <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
              {product.discountPercent}% OFF
            </span>
          )}
          {product.isBestSeller && (
            <span className="rounded-md bg-amber-500 px-1.5 py-0.5 text-[9px] font-extrabold text-slate-950 uppercase tracking-tight shadow-xs">
              Bestseller
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          onClick={handleWishlistClick}
          className="pointer-events-auto w-11 h-11 rounded-full bg-white/95 backdrop-blur-xs border border-slate-100 flex items-center justify-center text-slate-500 shadow-xs hover:text-rose-500 hover:bg-white transition-all cursor-pointer"
          title={isInWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
          aria-pressed={isInWishlist}
          aria-label={isInWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
        >
          <Heart
            className={`w-3.5 h-3.5 transition-colors ${
              isInWishlist ? "fill-rose-500 text-rose-500" : "hover:text-rose-500"
            }`}
          />
        </button>
      </div>

      {/* 1. Rounded Product Image Container (12-16px radius, neutral background, centered) */}
      <Link prefetch={false}
        href={`/product/${encodeURIComponent(product.id)}`}
        aria-label={`View ${product.title}`}
        className="relative aspect-square w-full min-h-0 bg-slate-50 rounded-xl border border-slate-100/90 p-2.5 sm:p-3 flex items-center justify-center overflow-hidden mb-2.5 group-hover:bg-slate-100/60 transition-colors cursor-pointer"
      >
        <ProductImage src={product.normalizedImage || product.image}
          fallbacks={[product.originalImage || "", product.image, ...(product.images || [])]}
          alt={product.title} priority={priority}
          className="h-full w-full object-contain object-center rounded-xl transition-transform duration-300 group-hover:scale-105" />
      </Link>

      {/* 2. Product Meta & Details */}
      <div className="flex-1 flex flex-col justify-between space-y-2">
        <div className="space-y-1">
          {/* Brand */}
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 truncate">
            {product.brand}
          </div>

          {/* Title */}
          <Link prefetch={false}
            href={`/product/${encodeURIComponent(product.id)}`}
            className="block text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 hover:text-cyan-700 transition-colors leading-snug min-h-[34px] sm:min-h-[38px] cursor-pointer"
          >
            {product.title}
          </Link>

          {/* Rating & Review Count */}
          <div className="flex items-center gap-1 text-xs">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="ml-1 font-extrabold text-slate-900 text-[11px]">
                {product.rating.toFixed(1)}
              </span>
            </div>
            <span className="text-slate-500 text-[11px] font-medium">
              ({product.reviewCount.toLocaleString()})
            </span>
          </div>
        </div>

        {/* 3. Pricing, Delivery & Action Button */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          {/* Price Block */}
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-black text-slate-950">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-[11px] text-slate-500 line-through font-medium">
                  ₹{product.originalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {/* Delivery / Stock Info */}
            <div className="mt-0.5">
              {isOutOfStock ? (
                <span className="text-[10px] font-bold text-rose-600">Out of Stock</span>
              ) : isLowStock ? (
                <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                  <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                  <span>Only {product.stock} left</span>
                </span>
              ) : null}
              {!isOutOfStock && <p className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                <Truck className="w-3 h-3 shrink-0" /><span>{product.price > 499 ? "Free standard delivery" : "Free delivery over ₹499"}</span>
              </p>}
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddClick}
            className={`w-full min-h-11 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
              isOutOfStock
                ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                : isAdded
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 hover:bg-slate-800 text-white active:scale-98"
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added to Cart</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return <div aria-label="Loading product" className="rounded-2xl bg-white border border-slate-200 p-3 motion-safe:animate-pulse">
    <div className="aspect-square bg-slate-100 rounded-xl mb-3" /><div className="h-3 w-1/3 bg-slate-200 rounded mb-3" />
    <div className="h-8 bg-slate-100 rounded mb-3" /><div className="h-4 w-2/3 bg-slate-200 rounded mb-3" /><div className="h-11 bg-slate-200 rounded-xl" />
  </div>;
}
