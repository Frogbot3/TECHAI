"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  if (!product) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed top-20 right-4 sm:right-6 z-50 w-full max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 text-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <div className="flex items-center space-x-1.5 text-emerald-600 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Added to your cart</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Preview */}
        <div className="flex items-center space-x-3 my-2">
          <img
            src={product.image}
            alt={product.title}
            className="w-12 h-12 object-contain rounded-lg bg-slate-100 p-1 flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-xs text-slate-900 truncate">{product.title}</p>
            <p className="text-xs font-bold text-slate-950 mt-0.5">₹{product.price.toLocaleString("en-IN")}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onViewCart();
            }}
            className="py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1"
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
            className="py-2 px-3 rounded-lg bg-slate-900 hover:bg-cyan-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-sm"
          >
            <span>Checkout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
