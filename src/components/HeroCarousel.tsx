"use client";

import React, { useEffect, useState, useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Gift, Tag, Zap, ShieldCheck } from "lucide-react";
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
    badge: "AUDIO FESTIVAL • 50% OFF",
    title: "Next-Gen Noise Cancelling Audio",
    subtitle: "Immersive spatial acoustics, 40-hour ultra battery, and instant device pairing for high-fidelity listening.",
    priceLabel: "Special Deal Price",
    price: "₹1,499",
    originalPrice: "₹2,999",
    offer: "Flat 50% Off + Free Shipping",
    category: "Electronics",
    cta: "Shop Audio Deals",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&auto=format&fit=crop&q=85",
  },
  {
    id: "default-2",
    badge: "SMART TECH DROP",
    title: "Flagship Wearables & AMOLED Displays",
    subtitle: "Ultra-bright display, multi-sport precision tracking, Bluetooth calling, and titanium finish for work & sports.",
    priceLabel: "Limited Drop",
    price: "₹1,799",
    originalPrice: "₹4,999",
    offer: "64% Discount • Bluetooth Calling",
    category: "Mobiles & Wearables",
    cta: "Explore Smartwatches",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&auto=format&fit=crop&q=85",
  },
  {
    id: "default-3",
    badge: "PRO GAMING & COMPUTING",
    title: "Precision Mechanical Battlestations",
    subtitle: "Tactile mechanical switches, dynamic RGB illumination, and ultra-low latency response engineered for winners.",
    priceLabel: "Starting from",
    price: "₹2,499",
    originalPrice: "₹4,999",
    offer: "Buy 3 Get Small Gift Free",
    category: "Computers & Gaming",
    cta: "Upgrade Gaming Gear",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1000&auto=format&fit=crop&q=85",
  },
];

const HERO_EASE = [0.16, 1, 0.3, 1] as const;

export default function HeroCarousel({ products = [], onExploreCategory, onSelectProduct }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  // Dynamically assemble slides: Hero-featured products from admin + default slides
  const allSlides: HeroSlideItem[] = useMemo(() => {
    const featuredFromAdmin = products
      .filter((p) => p.isHeroFeatured)
      .map((p) => ({
        id: `hero-${p.id}`,
        badge: p.heroBadge || (p.discountPercent > 0 ? `SPECIAL DROP • ${p.discountPercent}% OFF` : "FEATURED SPOTLIGHT"),
        title: p.heroBannerHeadline || p.title,
        subtitle: p.heroBannerSubtitle || p.description || "Premium certified smart gadget with official brand warranty & express dispatch.",
        priceLabel: "Exclusive Store Price",
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
    <section className="px-3 pb-2 pt-4 sm:px-6 lg:px-8 font-sans" aria-label="Featured offers">
      {/* Top Promotional Ribbon Ticker */}
      <div className="mb-3.5 bg-gradient-to-r from-cyan-950 via-slate-900 to-purple-950 border border-cyan-500/20 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold text-[10px] uppercase tracking-wider border border-cyan-400/30">
            <Gift className="w-3 h-3 text-cyan-300 animate-pulse" />
            <span>Storewide Perks</span>
          </span>
          <span className="font-semibold text-slate-200">
            Buy 3 Items & Get a Small Surprise Gift Free • Orders above ₹20,000 receive a Premium Tech Accessory!
          </span>
        </div>
        <div className="hidden md:flex items-center space-x-3 text-[11px] font-bold text-cyan-400">
          <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> 100% Genuine</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-amber-400" /> Fast Delivery</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Main Hero Slider Box */}
        <div
          className="relative min-h-[440px] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 px-6 py-8 text-white shadow-2xl sm:min-h-[400px] sm:px-10 sm:py-9 lg:col-span-8 relative group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsPaused(false);
          }}
        >
          {/* Ambient Lighting Gradients */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 right-1/4 h-80 w-80 rounded-full bg-purple-500/15 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.05),transparent_40%)]" />

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={String(slide.id)}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: reduceMotion ? 0.15 : 0.45, ease: HERO_EASE }}
              className="relative grid min-h-[350px] items-center gap-6 sm:grid-cols-12"
            >
              {/* Left Details Column */}
              <div className="relative z-10 order-1 space-y-4 sm:col-span-7">
                <motion.span
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.05, duration: 0.3 }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-cyan-300 shadow-sm"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>{slide.badge}</span>
                </motion.span>

                <motion.h1
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl line-clamp-2"
                >
                  {slide.title}
                </motion.h1>

                <motion.p
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="max-w-md text-xs sm:text-sm leading-relaxed text-slate-300 line-clamp-2"
                >
                  {slide.subtitle}
                </motion.p>

                {/* Price & Offer Row */}
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="pt-1 space-y-1"
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{slide.priceLabel}</p>
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <span className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">{slide.price}</span>
                    {slide.originalPrice && (
                      <span className="text-sm font-semibold text-slate-400 line-through">{slide.originalPrice}</span>
                    )}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[11px]">
                      <Tag className="w-3 h-3" />
                      <span>{slide.offer}</span>
                    </span>
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                  className="pt-2 flex flex-wrap items-center gap-3"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (slide.productRef && onSelectProduct) {
                        onSelectProduct(slide.productRef);
                      } else {
                        onExploreCategory(slide.category);
                      }
                    }}
                    className="group inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 text-xs font-extrabold text-slate-950 shadow-lg shadow-cyan-500/25 transition duration-200 hover:from-cyan-300 hover:to-blue-400 hover:-translate-y-0.5 active:scale-[0.98] sm:text-sm cursor-pointer"
                  >
                    <span>{slide.cta}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onExploreCategory(slide.category)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-4 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white cursor-pointer"
                  >
                    <span>View Category</span>
                  </button>
                </motion.div>
              </div>

              {/* Right Product Image Showcase */}
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.45 }}
                className="relative order-2 mx-auto flex h-48 w-full max-w-[280px] items-center justify-center sm:col-span-5 sm:h-72 sm:max-w-none"
              >
                {/* Visual Glass Platform with Soft Glow */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-slate-900/80 via-slate-800/40 to-cyan-900/20 border border-slate-700/50 backdrop-blur-sm shadow-inner" />
                <div className="absolute inset-x-8 bottom-3 h-10 rounded-full bg-cyan-400/20 blur-xl" />

                <img
                  src={slide.image}
                  alt={slide.title}
                  className="relative z-10 max-h-[85%] max-w-[85%] object-contain drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)] transition-transform duration-500 hover:scale-105"
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls & Slide Indicators */}
          <div className="relative z-20 mt-4 flex items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-2" role="tablist" aria-label="Hero carousel offers">
              {allSlides.map((item, index) => (
                <button
                  key={String(item.id)}
                  type="button"
                  role="tab"
                  aria-selected={index === activeIndex}
                  aria-label={`Slide ${index + 1}`}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    index === activeIndex ? "w-8 bg-gradient-to-r from-cyan-400 to-blue-400" : "w-2 bg-slate-700 hover:bg-slate-500"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => changeSlide("previous")}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white cursor-pointer"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => changeSlide("next")}
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white cursor-pointer"
                aria-label="Next Slide"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Side Companion Deals (4 columns) */}
        <div className="flex flex-col gap-4 sm:flex-row lg:col-span-4 lg:flex-col">
          {/* Side Card 1: Mobiles & Smartwatches */}
          <button
            type="button"
            onClick={() => onExploreCategory("Mobiles & Wearables")}
            className="group relative flex min-h-[160px] flex-1 items-center justify-between overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 text-left shadow-lg transition duration-200 hover:-translate-y-0.5 hover:border-cyan-500/50 hover:shadow-cyan-500/10 cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 max-w-[155px] space-y-1.5">
              <span className="inline-block text-[10px] font-black uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-800">
                SMART TECH
              </span>
              <span className="block text-base font-black text-white leading-tight">
                AMOLED Smart Watches
              </span>
              <span className="block text-xs font-extrabold text-amber-400">Up to 64% Off</span>
              <span className="inline-flex items-center gap-1 pt-1 text-[11px] font-bold text-cyan-400 group-hover:underline">
                Explore Deals <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
            <div className="relative w-24 h-24 rounded-2xl bg-slate-800/60 p-2 border border-slate-700/60 flex items-center justify-center flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80"
                alt="Smart watch deal"
                className="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform"
              />
            </div>
          </button>

          {/* Side Card 2: Computers & Gaming Gear */}
          <button
            type="button"
            onClick={() => onExploreCategory("Computers & Gaming")}
            className="group relative flex min-h-[160px] flex-1 items-center justify-between overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-5 text-left shadow-lg transition duration-200 hover:-translate-y-0.5 hover:border-purple-500/50 hover:shadow-purple-500/10 cursor-pointer"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 max-w-[155px] space-y-1.5">
              <span className="inline-block text-[10px] font-black uppercase tracking-wider text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded-md border border-purple-800">
                PRO GAMING
              </span>
              <span className="block text-base font-black text-white leading-tight">
                Keyboards & Audio
              </span>
              <span className="block text-xs font-extrabold text-emerald-400">Starting at ₹499</span>
              <span className="inline-flex items-center gap-1 pt-1 text-[11px] font-bold text-purple-400 group-hover:underline">
                Shop Gear <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </div>
            <div className="relative w-24 h-24 rounded-2xl bg-slate-800/60 p-2 border border-slate-700/60 flex items-center justify-center flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&auto=format&fit=crop&q=80"
                alt="Gaming gear deal"
                className="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform"
              />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
