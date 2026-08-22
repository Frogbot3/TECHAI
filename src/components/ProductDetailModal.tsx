"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Star,
  Truck,
  ShieldCheck,
  RotateCcw,
  ShoppingCart,
  Zap,
  Plus,
  Minus,
  Check,
  ArrowLeftRight,
  Sparkles,
} from "lucide-react";
import { Product, User } from "@/lib/types";
import ProductReviewsSection from "./ProductReviewsSection";

interface ProductDetailModalProps {
  product: Product | null;
  user: User | null;
  allProducts?: Product[];
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
  onReviewSubmitted?: (productId: string, review: any) => void;
  onOpenCompare?: (product: Product) => void;
}

export default function ProductDetailModal({
  product,
  user,
  allProducts = [],
  onClose,
  onAddToCart,
  onBuyNow,
  onReviewSubmitted,
  onOpenCompare,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"overview" | "specs" | "reviews">("overview");

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;

  const handleQtyChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(product.stock, prev + delta)));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-900"
        >
          {/* Top Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1 overflow-y-auto p-5 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8">
              {/* Left Column: Image Box */}
              <div className="md:col-span-5 flex flex-col space-y-3">
                <div className="w-full aspect-square bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center p-6 relative overflow-hidden">
                  {product.discountPercent > 0 && (
                    <span className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-bold px-2 py-0.5 rounded shadow-xs">
                      {product.discountPercent}% OFF
                    </span>
                  )}
                  <img
                    src={product.image}
                    alt={product.title}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {/* Compare Trigger Button */}
                {onOpenCompare && (
                  <button
                    type="button"
                    onClick={() => onOpenCompare(product)}
                    className="w-full py-2 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-600" />
                    <span>Compare with Similar Products</span>
                  </button>
                )}
              </div>

              {/* Right Column: Product Overview & Buy Box */}
              <div className="md:col-span-7 space-y-4">
                {/* Brand & Category */}
                <div>
                  <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">
                    {product.brand}
                  </span>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-950 mt-1 leading-snug">
                    {product.title}
                  </h1>
                </div>

                {/* Rating Block */}
                <div className="flex items-center space-x-2 text-xs">
                  <div className="flex items-center bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-bold border border-amber-200">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" />
                    <span>{product.rating}</span>
                  </div>
                  <span className="text-slate-500 font-medium">
                    {product.reviewCount.toLocaleString()} verified ratings
                  </span>
                </div>

                {/* Price Section */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-slate-950">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                    {product.originalPrice > product.price && (
                      <span className="text-sm text-slate-400 line-through">
                        MRP ₹{product.originalPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                    <span className="text-xs font-bold text-emerald-600">
                      Save ₹{(product.originalPrice - product.price).toLocaleString("en-IN")} ({product.discountPercent}%)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Inclusive of all taxes</p>
                </div>

                {/* Stock & Delivery Status */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    {isOutOfStock ? (
                      <span className="font-bold text-rose-600">Currently Out of Stock</span>
                    ) : (
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>In Stock • Ready for dispatch</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-slate-600 font-medium">
                    <Truck className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    <span>Free express delivery in 2-3 business days</span>
                  </div>
                </div>

                {/* Quantity & CTA Buttons */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="font-bold text-slate-700">Quantity:</span>
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                      <button
                        type="button"
                        disabled={quantity <= 1}
                        onClick={() => handleQtyChange(-1)}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 font-bold text-slate-900">{quantity}</span>
                      <button
                        type="button"
                        disabled={quantity >= product.stock}
                        onClick={() => handleQtyChange(1)}
                        className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => onAddToCart(product, quantity)}
                      className="py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4 text-amber-400" />
                      <span>Add to Cart</span>
                    </button>

                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => onBuyNow(product, quantity)}
                      className="py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-200 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                    >
                      <Zap className="w-4 h-4 text-yellow-300" />
                      <span>Buy Now</span>
                    </button>
                  </div>
                </div>

                {/* Trust Highlights */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
                  <div className="flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                    <span>100% Genuine</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <RotateCcw className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>7-Day Replacement</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Truck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Free Shipping</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Tabs: Description, Specs, Reviews */}
            <div className="mt-8 border-t border-slate-200 pt-6">
              <div className="flex space-x-4 border-b border-slate-200 pb-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className={`pb-2 transition-colors cursor-pointer ${
                    activeTab === "overview"
                      ? "text-cyan-700 border-b-2 border-cyan-600"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Overview & Highlights
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("specs")}
                  className={`pb-2 transition-colors cursor-pointer ${
                    activeTab === "specs"
                      ? "text-cyan-700 border-b-2 border-cyan-600"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Specifications
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("reviews")}
                  className={`pb-2 transition-colors cursor-pointer ${
                    activeTab === "reviews"
                      ? "text-cyan-700 border-b-2 border-cyan-600"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Customer Reviews ({product.reviews?.length || product.reviewCount})
                </button>
              </div>

              <div className="pt-4 text-xs">
                {activeTab === "overview" && (
                  <div className="space-y-4">
                    <p className="text-slate-700 leading-relaxed font-normal">{product.description}</p>
                    {product.features && product.features.length > 0 && (
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-slate-900">Key Features:</h4>
                        <ul className="space-y-1 text-slate-600">
                          {product.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-cyan-600 mt-0.5 flex-shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "specs" && (
                  <div className="max-w-xl">
                    <table className="w-full text-left border-collapse">
                      <tbody>
                        {Object.entries(product.specs || {}).map(([key, val]) => (
                          <tr key={key} className="border-b border-slate-100">
                            <td className="py-2 font-bold text-slate-600 w-1/3">{key}</td>
                            <td className="py-2 text-slate-900 font-medium">{val}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === "reviews" && (
                  <ProductReviewsSection
                    product={product}
                    user={user}
                    onReviewSubmitted={(productId, rev) => {
                      if (onReviewSubmitted) onReviewSubmitted(productId, rev);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
