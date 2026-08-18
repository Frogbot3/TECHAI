"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Product, User } from "@/lib/types";
import ProductReviewsSection from "./ProductReviewsSection";
import {
  X,
  Star,
  ShoppingBag,
  Zap,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Sparkles,
  MapPin,
  MessageSquare,
  Layers,
  RotateCcw,
  BadgePercent
} from "lucide-react";

interface ProductDetailModalProps {
  product: Product | null;
  user?: User | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onBuyNow: (product: Product, quantity: number) => void;
  onReviewSubmitted?: (productId: string, review: { userName: string; rating: number; comment: string }) => void;
}

export default function ProductDetailModal({
  product,
  user,
  onClose,
  onAddToCart,
  onBuyNow,
  onReviewSubmitted,
}: ProductDetailModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("");
  const [pincodeCheck, setPincodeCheck] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"DETAILS" | "REVIEWS">("DETAILS");

  if (!product) return null;

  const handlePincodeCheck = () => {
    if (pincode.length === 6) {
      setPincodeCheck("✓ Free Express Delivery available in 2-3 days by TechAI Express");
    } else {
      setPincodeCheck("Please enter a valid 6-digit Pincode");
    }
  };

  const reviewCount = product.reviews ? product.reviews.length : product.reviewCount || 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-slate-950/75 backdrop-blur-md selection:bg-cyan-500 selection:text-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 20 }}
          className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto relative max-h-[92vh] flex flex-col"
        >
          {/* Top Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-30 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full transition-all shadow-md"
            aria-label="Close product modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Content Grid */}
          <div className="overflow-y-auto flex-1 pb-16 sm:pb-0">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
              {/* Product Visual Gallery Column */}
              <div className="md:col-span-5 p-6 bg-gradient-to-b from-slate-50 to-slate-100/70 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 relative min-h-[300px] sm:min-h-[380px]">
                {product.isAiProduct && (
                  <span className="absolute top-4 left-4 bg-slate-900 text-cyan-300 text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1 shadow-md border border-cyan-500/30">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>AI Tech Product</span>
                  </span>
                )}
                {product.discountPercent > 0 && (
                  <span className="absolute top-4 right-14 sm:right-16 bg-emerald-600 text-white text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-sm">
                    {product.discountPercent}% OFF
                  </span>
                )}

                <img
                  src={product.image}
                  alt={product.title}
                  className="max-h-64 sm:max-h-80 w-auto object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500 my-auto"
                />

                {/* Trust Badges under image */}
                <div className="grid grid-cols-3 gap-2 w-full pt-4 border-t border-slate-200/60 mt-4 text-[10px] text-slate-600 text-center font-bold">
                  <div className="flex flex-col items-center gap-1">
                    <Truck className="w-4 h-4 text-cyan-600" />
                    <span>Free Shipping</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>100% Genuine</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <RotateCcw className="w-4 h-4 text-purple-600" />
                    <span>7-Day Return</span>
                  </div>
                </div>
              </div>

              {/* Product Info & Tabs Column */}
              <div className="md:col-span-7 p-5 sm:p-7 space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Category & Rating */}
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <span>{product.brand} • {product.category}</span>
                    <button
                      onClick={() => setActiveTab("REVIEWS")}
                      className="flex items-center space-x-1 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200/80 transition-colors"
                    >
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-extrabold text-amber-900">{product.rating.toFixed(1)}</span>
                      <span className="text-slate-500 font-semibold">({reviewCount})</span>
                    </button>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 leading-tight">
                    {product.title}
                  </h2>

                  {/* Price Banner */}
                  <div className="flex items-baseline space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                    <span className="text-2xl sm:text-3xl font-black text-slate-950">
                      ₹{product.price.toLocaleString("en-IN")}
                    </span>
                    {product.originalPrice > product.price && (
                      <>
                        <span className="text-sm text-slate-400 line-through">
                          ₹{product.originalPrice.toLocaleString("en-IN")}
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                          <BadgePercent className="w-3.5 h-3.5" />
                          <span>{product.discountPercent}% SAVED</span>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Tab Navigation (Details vs Reviews) */}
                  <div className="flex items-center border-b border-slate-200 text-xs font-bold gap-6">
                    <button
                      onClick={() => setActiveTab("DETAILS")}
                      className={`pb-2.5 relative transition-colors ${
                        activeTab === "DETAILS"
                          ? "text-slate-950 font-extrabold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <span>Overview & Specs</span>
                      {activeTab === "DETAILS" && (
                        <motion.div
                          layoutId="productTabIndicator"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-950"
                        />
                      )}
                    </button>

                    <button
                      onClick={() => setActiveTab("REVIEWS")}
                      className={`pb-2.5 relative transition-colors flex items-center gap-1.5 ${
                        activeTab === "REVIEWS"
                          ? "text-slate-950 font-extrabold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Customer Reviews ({reviewCount})</span>
                      {activeTab === "REVIEWS" && (
                        <motion.div
                          layoutId="productTabIndicator"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-950"
                        />
                      )}
                    </button>
                  </div>

                  {/* Tab Content */}
                  {activeTab === "DETAILS" ? (
                    <div className="space-y-4">
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                        {product.description}
                      </p>

                      {/* Key Highlights */}
                      {product.features && product.features.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-cyan-600" />
                            <span>Key Highlights</span>
                          </h4>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-700">
                            {product.features.map((feat, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Pincode Checker */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-cyan-600" />
                          <span className="text-xs font-extrabold text-slate-800">Check Delivery Pincode</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Enter 6-digit Pincode"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                            className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 w-44 font-mono font-bold"
                          />
                          <button
                            onClick={handlePincodeCheck}
                            className="px-4 py-2 text-xs font-extrabold bg-slate-900 text-white rounded-xl hover:bg-cyan-600 transition-colors shadow-sm"
                          >
                            Check
                          </button>
                        </div>
                        {pincodeCheck && (
                          <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200/60">
                            {pincodeCheck}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <ProductReviewsSection
                      product={product}
                      user={user}
                      onReviewSubmitted={onReviewSubmitted}
                    />
                  )}
                </div>

                {/* Bottom Quantity & Buy Actions Bar */}
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800">Quantity</span>
                    <div className="flex items-center space-x-3 bg-slate-100 rounded-xl p-1 border border-slate-200">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black text-slate-900 w-8 text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      disabled={product.stock <= 0}
                      onClick={() => {
                        onAddToCart(product, quantity);
                        onClose();
                      }}
                      className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold rounded-2xl text-xs flex items-center justify-center space-x-2 transition-colors border border-slate-200 disabled:opacity-50"
                    >
                      <ShoppingBag className="w-4 h-4 text-slate-700" />
                      <span>Add to Cart</span>
                    </button>

                    <button
                      disabled={product.stock <= 0}
                      onClick={() => {
                        onBuyNow(product, quantity);
                      }}
                      className="w-full py-3.5 bg-slate-900 hover:bg-cyan-600 text-white font-black rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>Buy Now</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
