"use client";

import React from "react";
import { motion } from "framer-motion";
import { Product } from "@/lib/types";
import { Star, ShoppingBag, Eye, Heart, Sparkles, AlertCircle } from "lucide-react";

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
  onToggleWishlist
}: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between overflow-hidden relative group"
    >
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {product.isAiProduct && (
          <span className="bg-slate-900 text-cyan-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center space-x-1 shadow-md border border-cyan-500/30">
            <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
            <span>AI POWERED</span>
          </span>
        )}
        {product.discountPercent > 0 && (
          <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
            {product.discountPercent}% OFF
          </span>
        )}
      </div>

      <button
        onClick={() => onToggleWishlist(product.id)}
        className="absolute top-3 right-3 z-10 p-2 bg-white/90 backdrop-blur-md rounded-full shadow-md hover:bg-white transition-colors"
        title="Save to Wishlist"
      >
        <Heart
          className={`w-4 h-4 transition-colors ${
            isInWishlist ? "fill-red-500 text-red-500" : "text-slate-400 hover:text-red-500"
          }`}
        />
      </button>

      <div
        onClick={() => onQuickView(product)}
        className="relative aspect-square w-full bg-slate-50 overflow-hidden cursor-pointer flex items-center justify-center p-4"
      >
        <img
          src={product.image}
          alt={product.title}
          className="object-contain w-full h-full group-hover:scale-105 transition-transform duration-500"
        />

        <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-white/90 backdrop-blur-md text-slate-900 text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center space-x-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5" />
            <span>Quick View</span>
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1 font-medium">
            <span>{product.brand}</span>
            <div className="flex items-center space-x-1 text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{product.rating}</span>
              <span className="text-slate-400 font-normal">({product.reviewCount})</span>
            </div>
          </div>

          <h3
            onClick={() => onQuickView(product)}
            className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 cursor-pointer hover:text-cyan-600 transition-colors leading-snug"
          >
            {product.title}
          </h3>
        </div>

        {isLowStock && (
          <div className="flex items-center space-x-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md w-fit">
            <AlertCircle className="w-3 h-3" />
            <span>Only {product.stock} left in stock!</span>
          </div>
        )}
        {isOutOfStock && (
          <div className="flex items-center space-x-1 text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-md w-fit">
            <AlertCircle className="w-3 h-3" />
            <span>Out of Stock</span>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-base sm:text-lg font-extrabold text-slate-900">
                ₹{product.price.toLocaleString()}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-xs text-slate-400 line-through">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <button
            disabled={isOutOfStock}
            onClick={() => onAddToCart(product)}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 ${
              isOutOfStock
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-900 hover:bg-cyan-600 text-white shadow-sm"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
