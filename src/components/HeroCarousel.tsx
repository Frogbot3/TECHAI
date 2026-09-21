"use client";

import React, { useEffect, useState, useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles, Tag, ShieldCheck } from "lucide-react";
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
  themeGradient: string;
  badgeStyle: string;
  ctaBg: string;
  ctaHover: string;
  ctaArrow: string;
  imgBorder: string;
  imgBg: string;
}

// Each slide has a unique soft pastel gradient that matches the product category
const DEFAULT_HERO_SLIDES: HeroSlideItem[] = [
  {
    id: "default-1",
    badge: "AUDIO FESTIVAL • UP TO 50% OFF",
    title: "Premium Wireless Audio & Soundbars",
    subtitle: "Active noise cancellation, punchy deep bass, and 40-hour playtime from certified brands.",
    priceLabel: "Special Deal Price",
    price: "₹1,499",
    originalPrice: "₹2,999",
    offer: "50% OFF",
    category: "Electronics",
    cta: "Shop Audio Deals",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=85",
    themeGradient: "from-sky-50 via-cyan-50/60 to-white border-sky-200/80",
    badgeStyle: "bg-cyan-100 text-cyan-800 border-cyan-300",
    ctaBg: "bg-cyan-600 hover:bg-cyan-700",
    ctaHover: "text-cyan-700 hover:text-cyan-800",
    ctaArrow: "text-cyan-200",
    imgBorder: "border-sky-200/80",
    imgBg: "bg-sky-50/50",
  },
  {
    id: "default-2",
    badge: "SMART WEARABLES DROP",
    title: "Flagship AMOLED Calling Watches",
    subtitle: "Ultra-bright outdoor screen, multi-day battery, Bluetooth calling, and precision fitness tracking.",
    priceLabel: "Limited Time Offer",
    price: "₹1,799",
    originalPrice: "₹4,999",
    offer: "64% OFF",
    category: "Mobiles & Wearables",
    cta: "Explore Smartwatches",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=85",
    themeGradient: "from-indigo-50 via-violet-50/50 to-white border-indigo-200/80",
    badgeStyle: "bg-indigo-100 text-indigo-800 border-indigo-300",
    ctaBg: "bg-indigo-600 hover:bg-indigo-700",
    ctaHover: "text-indigo-700 hover:text-indigo-800",
    ctaArrow: "text-indigo-200",
    imgBorder: "border-indigo-200/80",
    imgBg: "bg-indigo-50/50",
  },
  {
    id: "default-3",
    badge: "PRO COMPUTING & GAMING GEAR",
    title: "Mechanical Keyboards & Gaming Tech",
    subtitle: "Tactile mechanical switches, dynamic RGB backlight, and ultra-fast response for work and gaming.",
    priceLabel: "Starting from",
    price: "₹2,499",
    originalPrice: "₹4,999",
    offer: "50% OFF",
    category: "Computers & Gaming",
    cta: "Upgrade Your Setup",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=85",
    themeGradient: "from-amber-50 via-orange-50/40 to-white border-amber-200/80",
    badgeStyle: "bg-amber-100 text-amber-800 border-amber-300",
    ctaBg: "bg-amber-600 hover:bg-amber-700",
    ctaHover: "text-amber-700 hover:text-amber-800",
    ctaArrow: "text-amber-200",
    imgBorder: "border-amber-200/80",
    imgBg: "bg-amber-50/50",
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

  // Derive a theme from category name matching product card style
  const getCategoryTheme = (category: string): Omit<HeroSlideItem, 'id' | 'badge' | 'title' | 'subtitle' | 'priceLabel' | 'price' | 'originalPrice' | 'offer' | 'category' | 'cta' | 'image' | 'productRef'> => {
    const cat = category.toLowerCase();
    if (cat.includes("fashion") || cat.includes("shoe") || cat.includes("cloth"))
      return { themeGradient: "from-rose-50 via-pink-50/50 to-white border-rose-200/80", badgeStyle: "bg-rose-100 text-rose-800 border-rose-300", ctaBg: "bg-rose-600 hover:bg-rose-700", ctaHover: "text-rose-700 hover:text-rose-800", ctaArrow: "text-rose-200", imgBorder: "border-rose-200/80", imgBg: "bg-rose-50/50" };
    if (cat.includes("mobile") || cat.includes("phone") || cat.includes("wearable"))
      return { themeGradient: "from-indigo-50 via-violet-50/50 to-white border-indigo-200/80", badgeStyle: "bg-indigo-100 text-indigo-800 border-indigo-300", ctaBg: "bg-indigo-600 hover:bg-indigo-700", ctaHover: "text-indigo-700 hover:text-indigo-800", ctaArrow: "text-indigo-200", imgBorder: "border-indigo-200/80", imgBg: "bg-indigo-50/50" };
    if (cat.includes("gaming") || cat.includes("computer") || cat.includes("laptop"))
      return { themeGradient: "from-amber-50 via-orange-50/40 to-white border-amber-200/80", badgeStyle: "bg-amber-100 text-amber-800 border-amber-300", ctaBg: "bg-amber-600 hover:bg-amber-700", ctaHover: "text-amber-700 hover:text-amber-800", ctaArrow: "text-amber-200", imgBorder: "border-amber-200/80", imgBg: "bg-amber-50/50" };
    if (cat.includes("home") || cat.includes("appliance") || cat.includes("kitchen"))
      return { themeGradient: "from-emerald-50 via-teal-50/40 to-white border-emerald-200/80", badgeStyle: "bg-emerald-100 text-emerald-800 border-emerald-300", ctaBg: "bg-emerald-600 hover:bg-emerald-700", ctaHover: "text-emerald-700 hover:text-emerald-800", ctaArrow: "text-emerald-200", imgBorder: "border-emerald-200/80", imgBg: "bg-emerald-50/50" };
    if (cat.includes("grocery") || cat.includes("food"))
      return { themeGradient: "from-lime-50 via-green-50/40 to-white border-lime-200/80", badgeStyle: "bg-lime-100 text-lime-800 border-lime-300", ctaBg: "bg-lime-600 hover:bg-lime-700", ctaHover: "text-lime-700 hover:text-lime-800", ctaArrow: "text-lime-200", imgBorder: "border-lime-200/80", imgBg: "bg-lime-50/50" };
    if (cat.includes("beauty"))
      return { themeGradient: "from-pink-50 via-fuchsia-50/40 to-white border-pink-200/80", badgeStyle: "bg-pink-100 text-pink-800 border-pink-300", ctaBg: "bg-pink-600 hover:bg-pink-700", ctaHover: "text-pink-700 hover:text-pink-800", ctaArrow: "text-pink-200", imgBorder: "border-pink-200/80", imgBg: "bg-pink-50/50" };
    // Default: electronics / audio
    return { themeGradient: "from-sky-50 via-cyan-50/60 to-white border-sky-200/80", badgeStyle: "bg-cyan-100 text-cyan-800 border-cyan-300", ctaBg: "bg-cyan-600 hover:bg-cyan-700", ctaHover: "text-cyan-700 hover:text-cyan-800", ctaArrow: "text-cyan-200", imgBorder: "border-sky-200/80", imgBg: "bg-sky-50/50" };
  };

  // Combine admin featured products with default hero slides
  const allSlides: HeroSlideItem[] = useMemo(() => {
    const featuredFromAdmin = products
      .filter((p) => p.isHeroFeatured)
      .map((p) => {
        const theme = getCategoryTheme(p.category);
        return {
          id: `hero-${p.id}`,
          badge: p.heroBadge || (p.discountPercent > 0 ? `EXCLUSIVE DROP • ${p.discountPercent}% OFF` : "FEATURED SPOTLIGHT"),
          title: p.heroBannerHeadline || p.title,
          subtitle: p.heroBannerSubtitle || p.description || "100% genuine with official brand warranty & express door delivery.",
          priceLabel: "Special Offer Price",
          price: `₹${p.price.toLocaleString("en-IN")}`,
          originalPrice: p.originalPrice > p.price ? `₹${p.originalPrice.toLocaleString("en-IN")}` : undefined,
          offer: p.heroOfferText || (p.discountPercent > 0 ? `${p.discountPercent}% OFF` : "FREE DELIVERY"),
          category: p.category,
          cta: "Shop This Product",
          image: p.image || (p.images && p.images[0]) || "",
          productRef: p,
          ...theme,
        };
      });

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
    <section className="px-3 sm:px-6 lg:px-8 pt-3 pb-2 font-sans" aria-label="Featured Offers">
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12">
        {/* Main Hero Banner — matches product card white/light style with category-colored accents */}
        <div
          className={`relative min-h-[340px] sm:min-h-[380px] lg:min-h-[400px] overflow-hidden rounded-2xl bg-gradient-to-br ${slide.themeGradient} border text-slate-900 shadow-xs p-4 sm:p-7 lg:col-span-8 flex flex-col justify-between transition-colors duration-500`}
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
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
              transition={{ duration: reduceMotion ? 0.15 : 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4 sm:gap-6 my-auto"
            >
              {/* Content Column */}
              <div className="order-2 sm:order-1 sm:col-span-7 space-y-2.5 sm:space-y-3">
                {/* Category/Offer Label */}
                <div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider ${slide.badgeStyle}`}>
                    <Sparkles className="w-3 h-3" />
                    <span>{slide.badge}</span>
                  </span>
                </div>

                {/* Headline */}
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 leading-tight tracking-tight line-clamp-2">
                  {slide.title}
                </h1>

                {/* Supporting Text */}
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed line-clamp-2">
                  {slide.subtitle}
                </p>

                {/* Price & Discount */}
                <div className="pt-0.5 flex flex-wrap items-baseline gap-2">
                  <span className="text-xs font-bold text-slate-500">{slide.priceLabel}:</span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                    {slide.price}
                  </span>
                  {slide.originalPrice && (
                    <span className="text-xs sm:text-sm font-medium text-slate-400 line-through">
                      {slide.originalPrice}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 text-white font-extrabold text-[10px] sm:text-[11px] shadow-xs">
                    <Tag className="w-3 h-3" />
                    <span>{slide.offer}</span>
                  </span>
                </div>

                {/* CTAs */}
                <div className="pt-1.5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (slide.productRef && onSelectProduct) {
                        onSelectProduct(slide.productRef);
                      } else {
                        onExploreCategory(slide.category);
                      }
                    }}
                    className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 sm:h-11 px-6 rounded-xl ${slide.ctaBg} text-white font-extrabold text-xs sm:text-sm transition-all shadow-sm active:scale-98 cursor-pointer`}
                  >
                    <span>{slide.cta}</span>
                    <ArrowRight className={`w-4 h-4 ${slide.ctaArrow}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onExploreCategory(slide.category)}
                    className={`w-full sm:w-auto inline-flex items-center justify-center text-xs sm:text-sm font-bold ${slide.ctaHover} underline decoration-slate-300 underline-offset-4 transition cursor-pointer py-1`}
                  >
                    <span>Browse {slide.category}</span>
                  </button>
                </div>
              </div>

              {/* Product Visual Column — white card container like product cards */}
              <div className="order-1 sm:order-2 sm:col-span-5 flex items-center justify-center">
                <div className={`relative w-36 h-36 sm:w-48 sm:h-48 lg:w-56 lg:h-56 rounded-2xl bg-white ${slide.imgBorder} border shadow-sm p-3 sm:p-4 flex items-center justify-center overflow-hidden group`}>
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="max-h-full max-w-full object-contain rounded-xl drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                    loading="eager"
                  />
                  <div className="absolute top-2 right-2 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Verified</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Bottom Slide Indicators & Controls */}
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/80 mt-2">
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Hero carousel pagination">
              {allSlides.map((item, index) => (
                <button
                  key={String(item.id)}
                  type="button"
                  role="tab"
                  aria-selected={index === activeIndex}
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    index === activeIndex ? "w-6 bg-slate-900" : "w-2 bg-slate-300 hover:bg-slate-400"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => changeSlide("previous")}
                className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 hover:text-slate-950 transition cursor-pointer shadow-xs"
                aria-label="Previous Slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => changeSlide("next")}
                className="w-7 h-7 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 hover:text-slate-950 transition cursor-pointer shadow-xs"
                aria-label="Next Slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Companion Deal Cards — matches product card white style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5 lg:col-span-4">
          {/* Deal Card 1: Mobiles & Wearables */}
          <button
            type="button"
            onClick={() => onExploreCategory("Mobiles & Wearables")}
            className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/90 text-left shadow-xs hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="space-y-1 max-w-[175px]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                SMART WATCHES
              </span>
              <h2 className="text-sm font-extrabold text-slate-950 leading-tight">
                AMOLED Calling Watches
              </h2>
              <p className="text-xs font-semibold text-slate-600">Up to 64% Off</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 group-hover:text-indigo-800 pt-0.5">
                <span>View Deals</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
            <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-100/60 transition-colors overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80"
                alt="Smartwatch deals"
                className="max-h-full max-w-full object-contain rounded-lg"
                loading="lazy"
              />
            </div>
          </button>

          {/* Deal Card 2: Computers & Gaming */}
          <button
            type="button"
            onClick={() => onExploreCategory("Computers & Gaming")}
            className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/90 text-left shadow-xs hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="space-y-1 max-w-[175px]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                GAMING & TECH
              </span>
              <h2 className="text-sm font-extrabold text-slate-950 leading-tight">
                Keyboards & Gear
              </h2>
              <p className="text-xs font-semibold text-slate-600">Starting from ₹499</p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 group-hover:text-amber-800 pt-0.5">
                <span>Shop Gaming</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
            <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-100/60 transition-colors overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=80"
                alt="Gaming gear deals"
                className="max-h-full max-w-full object-contain rounded-lg"
                loading="lazy"
              />
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
