"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Product } from "@/lib/types";
import { AlertCircle, Eye, Heart, ShoppingCart, Star, Package, Sparkles } from "lucide-react";

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
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl hover:border-cyan-200/80 transition-all group"
    >
      {/* Top Badges — fixed height container */}
      <div className="absolute left-2.5 top-2.5 z-10 flex flex-col gap-1 items-start min-h-[52px]">
        {product.discountPercent > 0 && (
          <span className="rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
            {product.discountPercent}% OFF
          </span>
        )}
        {product.isBestSeller && (
          <span className="rounded-lg bg-amber-500 text-slate-950 px-2 py-0.5 text-[10px] font-extrabold shadow-sm">
            ★ Bestseller
          </span>
        )}
        {product.isAiProduct && (
          <span className="rounded-lg bg-slate-900 text-cyan-400 px-2 py-0.5 text-[10px] font-bold shadow-sm flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>AI Tech</span>
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
        className="absolute right-2.5 top-2.5 z-10 rounded-full bg-white/90 backdrop-blur-md p-2 text-slate-400 shadow-sm hover:text-rose-500 hover:bg-white transition-colors"
        title="Save product"
      >
        <Heart className={`h-4 w-4 ${isInWishlist ? "fill-rose-500 text-rose-500" : ""}`} />
      </button>

      {/* Uniform Aspect-Square Image Box */}
      <button
        type="button"
        onClick={() => onQuickView(product)}
        className="relative aspect-square w-full flex-shrink-0 bg-gradient-to-br from-slate-50 to-slate-100/80 p-4 flex items-center justify-center overflow-hidden border-b border-slate-100 group-hover:from-cyan-50/50 group-hover:to-slate-100 transition-colors cursor-pointer"
      >
        {!imgError && product.image ? (
          <img
            src={product.image}
            alt={product.title}
            onError={() => setImgError(true)}
            className="h-full w-full max-h-full object-contain object-center transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center text-slate-400 space-y-2">
            <div className="p-3 bg-slate-200/60 rounded-2xl">
              <Package className="h-8 w-8 text-slate-400" />
            </div>
            <span className="text-[11px] font-bold text-slate-500 line-clamp-1">{product.brand}</span>
          </div>
        )}
      </button>

      {/* Card Details Body — flex-grow for equal alignment */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between gap-2 text-xs min-h-[20px]">
            <span className="truncate font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              {product.brand}
            </span>
            <span className="flex items-center gap-1 text-xs font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md flex-shrink-0">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {product.rating}
            </span>
          </div>

          <button
            onClick={() => onQuickView(product)}
            className="line-clamp-2 h-10 w-full text-left text-sm font-extrabold leading-snug text-slate-900 hover:text-cyan-600 transition-colors"
          >
            {product.title}
          </button>

          <p className="text-[11px] text-slate-500 font-medium h-4">
            {product.reviewCount.toLocaleString()} verified reviews
          </p>

          {/* Stock Status — always same height */}
          <div className="h-6 flex items-center">
            {isLowStock ? (
              <div className="flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span>Only {product.stock} left</span>
              </div>
            ) : isOutOfStock ? (
              <div className="flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span>Out of stock</span>
              </div>
            ) : (
              <span className="text-[11px] text-emerald-600 font-semibold">✓ In Stock</span>
            )}
          </div>
        </div>

        {/* Card Footer — pinned to bottom */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 mt-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-black text-slate-950">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{product.originalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>
            <p className="text-[10px] font-semibold text-emerald-600">Incl. all taxes</p>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onQuickView(product)}
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
              title="Quick view product details"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              disabled={isOutOfStock}
              onClick={() => onAddToCart(product)}
              className={`flex h-9 items-center justify-center gap-1.5 rounded-xl px-3.5 text-xs font-black transition-all ${
                isOutOfStock
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : "bg-slate-900 text-white hover:bg-cyan-600 shadow-sm hover:shadow-md"
              }`}
            >
              <ShoppingCart className="h-3.5 w-3.5 text-amber-400" />
              <span>Add</span>
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
