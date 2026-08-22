"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Product } from "@/lib/types";
import { Heart, ShoppingCart, Star, Eye, Check, Package, Truck } from "lucide-react";

interface ProductCardProps {
  product: Product;
  isInWishlist: boolean;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onToggleWishlist: (productId: string) => void;
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

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    onAddToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  return (
    <article
      className="group relative flex flex-col justify-between bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all overflow-hidden h-full"
    >
      {/* Top Badges & Wishlist */}
      <div className="absolute left-2 top-2 z-10 flex flex-col gap-1 items-start pointer-events-none">
        {product.discountPercent > 0 && (
          <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
            {product.discountPercent}% OFF
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleWishlist(product.id);
        }}
        className="absolute right-2 top-2 z-10 w-7 h-7 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-slate-400 shadow-xs hover:text-rose-500 hover:bg-white transition-all cursor-pointer"
        title="Save to Wishlist"
        aria-label="Save to Wishlist"
      >
        <Heart
          className={`w-3.5 h-3.5 transition-colors ${
            isInWishlist ? "fill-rose-500 text-rose-500" : "hover:text-rose-500"
          }`}
        />
      </button>

      {/* Product Image Box */}
      <Link
        href={`/product/${encodeURIComponent(product.id)}`}
        aria-label={`View ${product.title}`}
        className="relative aspect-square w-full bg-slate-50 p-3 sm:p-4 flex items-center justify-center overflow-hidden cursor-pointer group-hover:bg-slate-100/60 transition-colors"
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
            <span className="text-[10px] font-medium">{product.brand}</span>
          </div>
        )}
      </Link>

      {/* Card Details Body */}
      <div className="p-3 sm:p-3.5 flex flex-col flex-grow justify-between space-y-2">
        <div className="space-y-1">
          {/* Brand */}
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span className="truncate">{product.brand}</span>
          </div>

          {/* Product Title */}
          <Link
            href={`/product/${encodeURIComponent(product.id)}`}
            className="block text-xs sm:text-sm font-semibold text-slate-900 line-clamp-2 hover:text-cyan-700 transition-colors cursor-pointer leading-snug min-h-[34px]"
          >
            {product.title}
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1 text-xs">
            <div className="flex items-center text-amber-500">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="ml-1 font-bold text-slate-800 text-[11px]">
                {product.rating.toFixed(1)}
              </span>
            </div>
            <span className="text-slate-400 text-[11px]">
              ({product.reviewCount.toLocaleString()})
            </span>
          </div>
        </div>

        {/* Pricing, Delivery & CTA */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          {/* Price Block */}
          <div>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-extrabold text-slate-950">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-[11px] text-slate-400 line-through">
                  ₹{product.originalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>
            <p className="text-[10px] font-medium text-emerald-700 flex items-center gap-1 mt-0.5">
              <Truck className="w-3 h-3 text-emerald-600" />
              <span>Free Delivery</span>
            </p>
          </div>

          {/* Add to Cart Button */}
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddClick}
            className={`w-full h-8 sm:h-8.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
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
