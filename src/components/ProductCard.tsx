"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Product } from "@/lib/types";
import { Heart, ShoppingCart, Star, Check, Package, Truck, Zap } from "lucide-react";

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
  onQuickView,
  onToggleWishlist,
}: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= 5;

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    onAddToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1400);
  };

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist(product.id);
  };

  return (
    <article
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
          className="pointer-events-auto w-7 h-7 rounded-full bg-white/95 backdrop-blur-xs border border-slate-100 flex items-center justify-center text-slate-400 shadow-xs hover:text-rose-500 hover:bg-white transition-all cursor-pointer"
          title={isInWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
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
      <Link
        href={`/product/${encodeURIComponent(product.id)}`}
        onClick={(e) => {
          if (onQuickView && window.innerWidth >= 1024) {
            // allow navigation or quickview
          }
        }}
        aria-label={`View ${product.title}`}
        className="relative aspect-square w-full bg-slate-50 rounded-xl border border-slate-100/90 p-3 sm:p-4 flex items-center justify-center overflow-hidden mb-2.5 group-hover:bg-slate-100/60 transition-colors cursor-pointer"
      >
        {!imgError && product.image ? (
          <img
            src={product.image}
            alt={product.title}
            onError={() => setImgError(true)}
            className="h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 space-y-1">
            <Package className="w-8 h-8 text-slate-300" />
            <span className="text-[10px] font-bold text-slate-400">{product.brand}</span>
          </div>
        )}
      </Link>

      {/* 2. Product Meta & Details */}
      <div className="flex-1 flex flex-col justify-between space-y-2">
        <div className="space-y-1">
          {/* Brand */}
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
            {product.brand}
          </div>

          {/* Title */}
          <Link
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
            <span className="text-slate-400 text-[11px] font-medium">
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
                <span className="text-[11px] text-slate-400 line-through font-medium">
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
              ) : (
                <p className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                  <Truck className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                  <span>Free Express Delivery</span>
                </p>
              )}
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddClick}
            className={`w-full h-8 sm:h-8.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
              isOutOfStock
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
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
