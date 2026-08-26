"use client";

import React, { useEffect, useState, useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Tag, ShieldCheck, Zap } from "lucide-react";
import { Product } from "@/lib/types";

interface HeroCarouselProps {
  products?: Product[];
  onExploreCategory: (category: string) => void;
  onSelectProduct?: (product: Product) => void;
}

interface HeroSlideItem {
  id: string | number;
  badge: string;
  title: string;
  subtitle: string;
  priceLabel: string;
  price: string;
  originalPrice?: string;
  offer: string;
  category: string;
  cta: string;
  image: string;
  productRef?: Product;
}

const DEFAULT_HERO_SLIDES: HeroSlideItem[] = [
  {
    id: "default-1",
    badge: "AUDIO FESTIVAL • UP TO 50% OFF",
    title: "Premium Wireless Audio & Soundbars",
    subtitle: "Immersive sound, active noise cancellation, and all-day battery life from top certified brands.",
    priceLabel: "Special Deal Price",
    price: "₹1,499",
    originalPrice: "₹2,999",
    offer: "Save 50% Today",
    category: "Electronics",
    cta: "Shop Audio Deals",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=85",
  },
  {
    id: "default-2",
    badge: "SMART WEARABLES DROP",
    title: "Flagship AMOLED Smartwatches",
    subtitle: "Bright outdoor display, multi-day battery, Bluetooth calling, and precision health tracking.",
    priceLabel: "Limited Time Offer",
    price: "₹1,799",
    originalPrice: "₹4,999",
    offer: "64% Discount Applied",
    category: "Mobiles & Wearables",
    cta: "Explore Smartwatches",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=85",
  },
  {
    id: "default-3",
    badge: "COMPUTING & GAMING GEAR",
    title: "Precision Mechanical Keyboards & Gear",
    subtitle: "Tactile mechanical feedback, dynamic RGB lighting, and ultra-fast response engineered for work & play.",
    priceLabel: "Starting from",
    price: "₹2,499",
    originalPrice: "₹4,999",
    offer: "Buy 3 Get Small Gift Free",
    category: "Computers & Gaming",
    cta: "Upgrade Setup",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=85",
  },
];

export default function HeroCarousel({
  products = [],
  onExploreCategory,
  onSelectProduct,
}: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  // Combine admin featured products with default hero slides
  const allSlides: HeroSlideItem[] = useMemo(() => {
    const featuredFromAdmin = products
      .filter((p) => p.isHeroFeatured)
      .map((p) => ({
        id: `hero-${p.id}`,
        badge: p.heroBadge || (p.discountPercent > 0 ? `SPECIAL DROP • ${p.discountPercent}% OFF` : "FEATURED SPOTLIGHT"),
        title: p.heroBannerHeadline || p.title,
        subtitle: p.heroBannerSubtitle || p.description || "Certified smart gadget with official 1-year brand warranty & express delivery.",
        priceLabel: "Store Special Price",
        price: `₹${p.price.toLocaleString("en-IN")}`,
        originalPrice: p.originalPrice > p.price ? `₹${p.originalPrice.toLocaleString("en-IN")}` : undefined,
        offer: p.heroOfferText || (p.discountPercent > 0 ? `Save ${p.discountPercent}% Today` : "Free Express Delivery"),
        category: p.category,
        cta: "Shop This Product",
        image: p.image || (p.images && p.images[0]) || "",
        productRef: p,
      }));

    if (featuredFromAdmin.length > 0) {
      return [...featuredFromAdmin, ...DEFAULT_HERO_SLIDES];
    }
    return DEFAULT_HERO_SLIDES;
  }, [products]);

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setCurrentSlide((current) => (current + 1) % allSlides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [isPaused, allSlides.length]);

  const changeSlide = (direction: "next" | "previous") => {
    setCurrentSlide((current) => {
      if (direction === "next") return (current + 1) % allSlides.length;
      return (current - 1 + allSlides.length) % allSlides.length;
    });
  };

  const activeIndex = currentSlide >= allSlides.length ? 0 : currentSlide;
  const slide = allSlides[activeIndex] || DEFAULT_HERO_SLIDES[0];

  return (
    <section className="px-3 sm:px-6 lg:px-8 pt-3 pb-2 font-sans" aria-label="Hero Featured Deals">
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
        {/* Main Hero Banner Box */}
        <div
          className="relative min-h-[380px] sm:min-h-[380px] lg:min-h-[400px] overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-md p-5 sm:p-8 lg:col-span-8 flex flex-col justify-between"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsPaused(false);
          }}
        >
          {/* Slide Content */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={String(slide.id)}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -10 }}
              transition={{ duration: reduceMotion ? 0.15 : 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-12 items-center gap-6 my-auto"
            >
              {/* Left Column: Typography & CTAs */}
              <div className="order-2 sm:order-1 sm:col-span-7 space-y-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-cyan-300 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>{slide.badge}</span>
                </span>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-snug tracking-tight line-clamp-2">
                  {slide.title}
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2">
                  {slide.subtitle}
                </p>

                {/* Price & Offer Row */}
                <div className="pt-1 flex flex-wrap items-baseline gap-2.5">
                  <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
                    {slide.price}
                  </span>
                  {slide.originalPrice && (
                    <span className="text-xs sm:text-sm font-medium text-slate-400 line-through">
                      {slide.originalPrice}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-bold text-[10px] sm:text-[11px]">
                    <Tag className="w-3 h-3" />
                    <span>{slide.offer}</span>
                  </span>
                </div>

                {/* CTA Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (slide.productRef && onSelectProduct) {
                        onSelectProduct(slide.productRef);
                      } else {
                        onExploreCategory(slide.category);
                      }
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm transition shadow-sm cursor-pointer"
                  >
                    <span>{slide.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onExploreCategory(slide.category)}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition border border-slate-700 cursor-pointer"
                  >
                    <span>Browse Category</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Product Image Presentation */}
              <div className="order-1 sm:order-2 sm:col-span-5 flex items-center justify-center">
                <div className="relative w-44 h-44 sm:w-56 sm:h-56 rounded-2xl bg-slate-800/60 border border-slate-700/60 p-4 flex items-center justify-center shadow-inner">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="max-h-full max-w-full object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bottom Slide Indicators & Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 mt-2">
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Hero slides">
              {allSlides.map((item, index) => (
                <button
                  key={String(item.id)}
                  type="button"
                  role="tab"
                  aria-selected={index === activeIndex}
                  aria-label={`Slide ${index + 1}`}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    index === activeIndex ? "w-6 bg-cyan-400" : "w-2 bg-slate-700 hover:bg-slate-500"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => changeSlide("previous")}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
                aria-label="Previous Offer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => changeSlide("next")}
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
                aria-label="Next Offer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Companion Deal Cards (4 cols on lg) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5 lg:col-span-4">
          {/* Deal Card 1: Mobiles & Wearables */}
          <button
            type="button"
            onClick={() => onExploreCategory("Mobiles & Wearables")}
            className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 text-left shadow-xs hover:border-slate-300 hover:shadow-sm transition cursor-pointer group"
          >
            <div className="space-y-1 max-w-[170px]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                SMART WATCHES
              </span>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                AMOLED Calling Watches
              </h2>
              <p className="text-xs font-bold text-rose-600">Up to 64% Off</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-700 group-hover:underline pt-0.5">
                <span>View Deals</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
            <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 p-1.5 flex items-center justify-center flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80"
                alt="Smartwatch deal"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </button>

          {/* Deal Card 2: Computers & Gaming */}
          <button
            type="button"
            onClick={() => onExploreCategory("Computers & Gaming")}
            className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200 text-left shadow-xs hover:border-slate-300 hover:shadow-sm transition cursor-pointer group"
          >
            <div className="space-y-1 max-w-[170px]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                GAMING & TECH
              </span>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Keyboards & Headsets
              </h2>
              <p className="text-xs font-bold text-emerald-700">Starting from ₹499</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 group-hover:underline pt-0.5">
                <span>Shop Gaming</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
            <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 p-1.5 flex items-center justify-center flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=80"
                alt="Gaming gear deal"
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
