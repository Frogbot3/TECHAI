"use client";

import React from "react";
import { motion } from "framer-motion";
import { Product } from "@/lib/types";
import { AlertCircle, Eye, Heart, ShoppingCart, Star } from "lucide-react";

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
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="relative flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md"
    >
      <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
        {product.discountPercent > 0 && (
          <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
            {product.discountPercent}% OFF
          </span>
        )}
        {product.isBestSeller && (
          <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900">
            Bestseller
          </span>
        )}
      </div>

      <button
        onClick={() => onToggleWishlist(product.id)}
        className="absolute right-2 top-2 z-10 rounded-md bg-white/95 p-2 text-slate-500 shadow-sm hover:text-red-500"
        title="Save product"
      >
        <Heart className={`h-4 w-4 ${isInWishlist ? "fill-red-500 text-red-500" : ""}`} />
      </button>

      <button
        type="button"
        onClick={() => onQuickView(product)}
        className="relative aspect-square w-full bg-slate-50 p-4"
      >
        <img src={product.image} alt={product.title} className="h-full w-full object-contain transition-transform duration-300 hover:scale-105" />
      </button>

      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate font-semibold text-slate-500">{product.brand}</span>
            <span className="flex items-center gap-1 font-bold text-amber-600">
              <Star className="h-3.5 w-3.5 fill-amber-500" />
              {product.rating}
            </span>
          </div>
          <button
            onClick={() => onQuickView(product)}
            className="line-clamp-2 min-h-10 text-left text-sm font-semibold leading-5 text-slate-900 hover:text-blue-700"
          >
            {product.title}
          </button>
          <p className="text-[11px] text-slate-500">{product.reviewCount.toLocaleString()} reviews</p>
        </div>

        {isLowStock && (
          <div className="flex w-fit items-center gap-1 rounded bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
            <AlertCircle className="h-3 w-3" />
            <span>Only {product.stock} left</span>
          </div>
        )}
        {isOutOfStock && (
          <div className="flex w-fit items-center gap-1 rounded bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700">
            <AlertCircle className="h-3 w-3" />
            <span>Out of stock</span>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-slate-100 pt-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-1.5">
              <span className="text-lg font-extrabold text-slate-950">Rs. {product.price.toLocaleString("en-IN")}</span>
              {product.originalPrice > product.price && (
                <span className="text-xs text-slate-400 line-through">Rs. {product.originalPrice.toLocaleString("en-IN")}</span>
              )}
            </div>
            <p className="text-[11px] text-emerald-700">Inclusive of taxes</p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onQuickView(product)}
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50"
              title="Quick view"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              disabled={isOutOfStock}
              onClick={() => onAddToCart(product)}
              className={`flex h-9 items-center justify-center gap-1 rounded-md px-3 text-xs font-bold ${
                isOutOfStock
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : "bg-amber-400 text-slate-950 hover:bg-amber-500"
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
