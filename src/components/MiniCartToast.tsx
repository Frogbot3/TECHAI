"use client";
import ProductImage from "./ProductImage";

import React, { useEffect, useState } from "react";
import { CheckCircle2, X, ShoppingBag, ArrowRight } from "lucide-react";
import { Product } from "@/lib/types";

interface MiniCartToastProps {
  product: Product | null;
  onClose: () => void;
  onViewCart: () => void;
  onCheckout: () => void;
}

export default function MiniCartToast({
  product,
  onClose,
  onViewCart,
  onCheckout,
}: MiniCartToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!product) return;
    setProgress(100);

    const startTime = Date.now();
    const duration = 4500;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [product, onClose]);

  if (!product) return null;

  return (
      <div
        key={product.id}
        role="status"
        aria-live="polite"
        className="fixed top-3 sm:top-20 inset-x-3 sm:inset-x-auto sm:right-6 z-50 mx-auto w-auto max-w-[calc(100vw-24px)] sm:w-full sm:max-w-sm bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-3.5 sm:p-4 text-slate-900"
      >
        {/* Progress Bar for Auto-dismiss */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100 rounded-t-2xl overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <div className="flex items-center space-x-1.5 text-emerald-600 font-bold text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Added to your cart</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification"
            className="p-1.5 -mr-1 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Preview - Fully responsive on phone */}
        <div className="flex items-center space-x-3 my-2 bg-slate-50/80 p-2 rounded-xl border border-slate-100">
          <ProductImage
            src={product.normalizedImage || product.image}
            alt={product.title}
            className="w-12 h-12 object-contain rounded-lg bg-white p-1 flex-shrink-0 border border-slate-200/60"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-xs text-slate-900 line-clamp-1">{product.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-black text-slate-950">
                ₹{product.price.toLocaleString("en-IN")}
              </span>
              {product.originalPrice > product.price && (
                <span className="text-[10px] text-slate-400 line-through">
                  ₹{product.originalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions - Touch-friendly full width buttons on phone */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-1">
          <button
            type="button"
            onClick={() => {
              onClose();
              onViewCart();
            }}
            className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>View Cart</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onCheckout();
            }}
            className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-cyan-600 active:bg-cyan-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <span>Checkout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
  );
}
