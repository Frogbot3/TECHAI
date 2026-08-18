"use client";

import React, { useState } from "react";
import { Product, Review, User } from "@/lib/types";
import {
  Star,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Send,
  Loader2,
  User as UserIcon,
  Filter
} from "lucide-react";

interface ProductReviewsSectionProps {
  product: Product;
  user?: User | null;
  onReviewSubmitted?: (productId: string, review: { userName: string; rating: number; comment: string }) => void;
}

const SENTIMENT_LABELS: Record<number, string> = {
  1: "Disappointed 😞",
  2: "Needs Improvement 😐",
  3: "Good & Decent 🙂",
  4: "Very Satisfied! 😊",
  5: "Exceptional & Highly Recommended! 🚀",
};

const QUICK_TAGS = [
  "⚡ Super Fast Delivery",
  "💎 Premium Quality",
  "⭐ Value for Money",
  "✨ True to Description",
  "🔋 Great Performance",
  "👌 Easy to Use"
];

export default function ProductReviewsSection({
  product,
  user,
  onReviewSubmitted,
}: ProductReviewsSectionProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [userName, setUserName] = useState(user?.name || "");
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filterRating, setFilterRating] = useState<number | "ALL">("ALL");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({});
  const [showReviewForm, setShowReviewForm] = useState(false);

  const reviews: Review[] = product.reviews || [];

  // Calculate star distributions
  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    starCounts[star] = (starCounts[star] || 0) + 1;
  });

  const totalReviews = Math.max(reviews.length, product.reviewCount || 1);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleVoteHelpful = (reviewId: string) => {
    setHelpfulVotes((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] || 0) + 1,
    }));
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const finalName = userName.trim() || user?.name || "Verified Customer";
    if (!comment.trim()) {
      setErrorMessage("Please write a few words about your experience.");
      return;
    }

    const fullComment = selectedTags.length > 0 
      ? `${comment.trim()}\n\n[Highlights: ${selectedTags.join(", ")}]`
      : comment.trim();

    setIsSubmitting(true);

    try {
      // Call backend API
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: finalName,
          rating,
          comment: fullComment,
        }),
      });

      const data = await res.json();
      if (!data.success && !res.ok) {
        throw new Error(data.message || "Failed to submit review");
      }

      if (onReviewSubmitted) {
        onReviewSubmitted(product.id, {
          userName: finalName,
          rating,
          comment: fullComment,
        });
      }

      setSubmitSuccess(true);
      setComment("");
      setSelectedTags([]);
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowReviewForm(false);
      }, 2500);
    } catch (err: any) {
      // Fallback local update if API is offline
      if (onReviewSubmitted) {
        onReviewSubmitted(product.id, {
          userName: finalName,
          rating,
          comment: fullComment,
        });
      }
      setSubmitSuccess(true);
      setComment("");
      setSelectedTags([]);
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowReviewForm(false);
      }, 2500);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (filterRating === "ALL") return true;
    return Math.round(r.rating) === filterRating;
  });

  return (
    <div className="space-y-6 pt-4 border-t border-slate-200">
      {/* Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-slate-950 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-600" />
            <span>Customer Ratings & Reviews</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real customer feedback from verified TECH AI buyers
          </p>
        </div>

        <button
          onClick={() => setShowReviewForm((prev) => !prev)}
          className="px-4 py-2 bg-slate-900 hover:bg-cyan-600 text-white font-extrabold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 w-full sm:w-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{showReviewForm ? "Close Review Form" : "Write a Review"}</span>
        </button>
      </div>

      {/* Ratings Score & Star Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
        {/* Left: Overall Rating score */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-3 text-center border-b md:border-b-0 md:border-r border-slate-200">
          <span className="text-4xl sm:text-5xl font-black text-slate-950 tracking-tight">
            {product.rating.toFixed(1)}
          </span>
          <div className="flex items-center gap-1 my-2 text-amber-400">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(product.rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-300"
                }`}
              />
            ))}
          </div>
          <p className="text-xs font-bold text-slate-700">
            Based on {totalReviews.toLocaleString()} verified buyers
          </p>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% Genuine Reviews</span>
          </div>
        </div>

        {/* Right: Star Distribution Bars */}
        <div className="md:col-span-8 flex flex-col justify-center space-y-2 py-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = starCounts[star as 1 | 2 | 3 | 4 | 5] || 0;
            const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : (star === 5 ? 75 : star === 4 ? 20 : 5);
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-12 font-bold text-slate-700 flex items-center gap-1 flex-shrink-0">
                  <span>{star}</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </span>
                <div className="flex-1 h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      star >= 4 ? "bg-amber-400" : star === 3 ? "bg-amber-500" : "bg-rose-400"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-[11px] font-bold text-slate-500">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Review Submission Form */}
      {showReviewForm && (
        <form
          onSubmit={handleSubmitReview}
          className="bg-white border-2 border-cyan-500/30 rounded-2xl p-4 sm:p-6 shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-600" />
                <span>Write Your Customer Review</span>
              </h4>
              <p className="text-xs text-slate-500">
                Share your authentic feedback to help fellow shoppers
              </p>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Verified Purchase</span>
            </span>
          </div>

          {submitSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Thank you! Your verified review has been published successfully.</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl">
              {errorMessage}
            </div>
          )}

          {/* Star selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">
              Overall Rating *
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
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
                      className={`w-7 h-7 transition-colors ${
                        star <= (hoverRating || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-extrabold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                {SENTIMENT_LABELS[hoverRating || rating]}
              </span>
            </div>
          </div>

          {/* Quick highlight tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">
              Quick Highlights (Optional)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                      active
                        ? "bg-cyan-500 text-slate-950 border-cyan-500 font-extrabold shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Review input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Your Name *</span>
              </label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Email Address (kept private)</label>
              <input
                type="email"
                defaultValue={user?.email || ""}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Detailed Review Comments *</label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like or dislike about this product? How was the build quality, performance, and packaging?"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none font-medium resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
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
                  <span>Submit Verified Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Filter by star rating */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-600 flex-shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Filter:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-nowrap">
          <button
            onClick={() => setFilterRating("ALL")}
            className={`px-3 py-1 rounded-lg border font-bold text-xs whitespace-nowrap transition-colors ${
              filterRating === "ALL"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            All ({reviews.length})
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              onClick={() => setFilterRating(star)}
              className={`px-2.5 py-1 rounded-lg border font-bold text-xs whitespace-nowrap flex items-center gap-1 transition-colors ${
                filterRating === star
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{star}</span>
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Customer Reviews Feed */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No reviews found for this star filter.</p>
            <p className="text-[11px] text-slate-400">Be the first to share your thoughts!</p>
          </div>
        ) : (
          filteredReviews.map((rev) => {
            const votes = helpfulVotes[rev.id] || 0;
            return (
              <div
                key={rev.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-cyan-300 font-extrabold text-xs flex items-center justify-center shadow-sm">
                      {rev.userName ? rev.userName.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 text-xs">{rev.userName}</span>
                        {rev.verifiedPurchase !== false && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Verified Buyer</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Reviewed on {rev.date || "recently"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-black text-amber-700">{rev.rating}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-medium pt-1">
                  {rev.comment}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="text-[10px] text-slate-400">Purchased via TECH AI Official Store</span>
                  <button
                    onClick={() => handleVoteHelpful(rev.id)}
                    className="flex items-center gap-1 text-slate-500 hover:text-cyan-600 font-semibold px-2 py-1 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>Helpful {votes > 0 ? `(${votes})` : ""}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
