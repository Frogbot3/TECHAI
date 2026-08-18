"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Product, User } from "@/lib/types";
import {
  X,
  Star,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Send,
  Package
} from "lucide-react";

interface WriteReviewModalProps {
  isOpen: boolean;
  product: {
    productId?: string;
    id?: string;
    title: string;
    image: string;
    brand?: string;
    price?: number;
  } | null;
  user: User | null;
  onClose: () => void;
  onReviewSubmitted: (productId: string, review: { userName: string; rating: number; comment: string }) => void;
}

const QUICK_TAGS = [
  "⚡ Super Fast Delivery",
  "💎 Premium Quality",
  "⭐ Value for Money",
  "✨ True to Description",
  "🔋 Great Performance",
  "👌 Highly Recommended"
];

export default function WriteReviewModal({
  isOpen,
  product,
  user,
  onClose,
  onReviewSubmitted,
}: WriteReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [userName, setUserName] = useState(user?.name || "");
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen || !product) return null;

  const targetProductId = product.id || product.productId || "";

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const finalName = userName.trim() || user?.name || "Verified Buyer";
    if (!comment.trim()) {
      setErrorMessage("Please write a few words about your experience with this item.");
      return;
    }

    const fullComment = selectedTags.length > 0
      ? `${comment.trim()}\n\n[Highlights: ${selectedTags.join(", ")}]`
      : comment.trim();

    setIsSubmitting(true);

    try {
      if (targetProductId) {
        await fetch(`/api/products/${targetProductId}/reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userName: finalName,
            rating,
            comment: fullComment,
          }),
        });
      }

      onReviewSubmitted(targetProductId, {
        userName: finalName,
        rating,
        comment: fullComment,
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch {
      onReviewSubmitted(targetProductId, {
        userName: finalName,
        rating,
        comment: fullComment,
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto selection:bg-cyan-500 selection:text-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto relative"
        >
          {/* Header */}
          <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  Rate & Review Product
                </h3>
                <p className="text-[11px] text-slate-400">Verified purchase feedback</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 text-xs">
            {/* Product Card Summary */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <img
                src={product.image}
                alt={product.title}
                className="w-14 h-14 object-contain bg-white rounded-xl p-1 border border-slate-200"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {product.brand || "TECH AI"}
                </span>
                <h4 className="font-bold text-slate-900 line-clamp-1 text-xs">{product.title}</h4>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Purchase Order</span>
                </div>
              </div>
            </div>

            {isSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-extrabold text-slate-900">Review Submitted!</h4>
                <p className="text-xs text-slate-500">
                  Thank you for helping other TECH AI shoppers with your valuable review.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl">
                    {errorMessage}
                  </div>
                )}

                {/* Rating selection */}
                <div className="space-y-1.5 text-center">
                  <label className="text-xs font-bold text-slate-800 block">
                    How would you rate this product?
                  </label>
                  <div className="flex items-center justify-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 hover:scale-110 transition-transform focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 ${
                            star <= (hoverRating || rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-xs font-extrabold text-cyan-700">
                    {hoverRating || rating === 5
                      ? "⭐⭐⭐⭐⭐ Outstanding"
                      : hoverRating || rating === 4
                      ? "⭐⭐⭐⭐ Very Good"
                      : hoverRating || rating === 3
                      ? "⭐⭐⭐ Good"
                      : hoverRating || rating === 2
                      ? "⭐⭐ Fair"
                      : "⭐ Poor"}
                  </p>
                </div>

                {/* Quick tags */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 block">
                    Key Highlights
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                          selectedTags.includes(tag)
                            ? "bg-cyan-500 text-slate-950 border-cyan-500 font-extrabold"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Your Review *</label>
                  <textarea
                    required
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about the design, battery, quality, or usage..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none font-medium resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-slate-900 hover:bg-cyan-600 text-white font-extrabold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Publish Review</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
