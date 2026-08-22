"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Check, ShoppingCart, ArrowLeftRight } from "lucide-react";
import { Product } from "@/lib/types";

interface ProductComparisonModalProps {
  isOpen: boolean;
  baseProduct: Product | null;
  comparisonProducts: Product[];
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export default function ProductComparisonModal({
  isOpen,
  baseProduct,
  comparisonProducts,
  onClose,
  onAddToCart,
}: ProductComparisonModalProps) {
  if (!isOpen || !baseProduct) return null;

  // Filter 2 similar products from same category or brand
  const itemsToCompare = [
    baseProduct,
    ...comparisonProducts.filter((p) => p.id !== baseProduct.id).slice(0, 2),
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center">
                <ArrowLeftRight className="w-4 h-4 text-cyan-700" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Compare Similar Products</h3>
                <p className="text-xs text-slate-500">Side-by-side specifications & value comparison</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto p-4 text-xs">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 border-b border-slate-200 pb-4">
              <div className="hidden sm:block font-bold text-slate-400 uppercase tracking-wider text-[11px] self-end pb-2">
                Product Specs
              </div>

              {itemsToCompare.map((prod) => (
                <div key={prod.id} className="flex flex-col justify-between space-y-2 text-center p-2 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-full aspect-square flex items-center justify-center bg-white rounded-lg p-2">
                    <img
                      src={prod.image}
                      alt={prod.title}
                      className="max-h-24 max-w-full object-contain"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{prod.brand}</span>
                    <h4 className="font-semibold text-slate-900 line-clamp-2 h-8 text-[11px]">
                      {prod.title}
                    </h4>
                    <p className="font-bold text-sm text-slate-950">₹{prod.price.toLocaleString("en-IN")}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddToCart(prod)}
                    className="w-full py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <ShoppingCart className="w-3 h-3 text-amber-400" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Comparison Rows */}
            <div className="divide-y divide-slate-100 mt-4">
              {/* Rating */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-2.5 items-center">
                <span className="font-bold text-slate-700">Rating</span>
                {itemsToCompare.map((prod) => (
                  <div key={prod.id} className="text-center font-bold text-amber-600 flex items-center justify-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{prod.rating} ({prod.reviewCount})</span>
                  </div>
                ))}
              </div>

              {/* Discount */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-2.5 items-center">
                <span className="font-bold text-slate-700">Savings</span>
                {itemsToCompare.map((prod) => (
                  <div key={prod.id} className="text-center font-bold text-emerald-700">
                    {prod.discountPercent}% Off
                  </div>
                ))}
              </div>

              {/* Warranty */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-2.5 items-center">
                <span className="font-bold text-slate-700">Warranty</span>
                {itemsToCompare.map((prod) => (
                  <div key={prod.id} className="text-center text-slate-600">
                    {prod.specs?.Warranty || "1 Year Brand Warranty"}
                  </div>
                ))}
              </div>

              {/* Key Features */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 py-2.5 items-start">
                <span className="font-bold text-slate-700">Highlights</span>
                {itemsToCompare.map((prod) => (
                  <div key={prod.id} className="text-left space-y-1 text-[11px] text-slate-600">
                    {prod.features?.slice(0, 3).map((feat, i) => (
                      <p key={i} className="flex items-start gap-1">
                        <Check className="w-3 h-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{feat}</span>
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
