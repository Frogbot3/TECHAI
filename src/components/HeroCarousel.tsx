"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Sparkles, Tag } from "lucide-react";
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
  badgeStyle: string;
  ctaBg: string;
  ctaHover: string;
  ctaArrow: string;
}

interface CompanionDeal {
  id: string;
  label: string;
  title: string;
  detail: string;
  action: string;
  category: string;
  image: string;
  productRef?: Product;
  accent: "cyan" | "amber";
}

const DARK_THEME = {
  badgeStyle: "bg-white/10 text-cyan-200 border-white/20",
  ctaBg: "bg-rose-600 hover:bg-rose-500",
  ctaHover: "text-rose-300 hover:text-white",
  ctaArrow: "text-rose-100",
};

const DEFAULT_HERO_SLIDES: HeroSlideItem[] = [
  {
    id: "default-1",
    badge: "AUDIO FESTIVAL - UP TO 50% OFF",
    title: "Premium Wireless Audio & Soundbars",
    subtitle: "Active noise cancellation, punchy deep bass, and 40-hour playtime from certified brands.",
    priceLabel: "Special Deal Price",
    price: "INR 1,499",
    originalPrice: "INR 2,999",
    offer: "50% OFF",
    category: "Electronics",
    cta: "Shop Audio Deals",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=85",
    ...DARK_THEME,
  },
  {
    id: "default-2",
    badge: "SMART WEARABLES DROP",
    title: "Flagship AMOLED Calling Watches",
    subtitle: "Ultra-bright outdoor screen, multi-day battery, Bluetooth calling, and precision fitness tracking.",
    priceLabel: "Limited Time Offer",
    price: "INR 1,799",
    originalPrice: "INR 4,999",
    offer: "64% OFF",
    category: "Mobiles & Wearables",
    cta: "Explore Smartwatches",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=85",
    ...DARK_THEME,
  },
  {
    id: "default-3",
    badge: "PRO COMPUTING & GAMING GEAR",
    title: "Mechanical Keyboards & Gaming Tech",
    subtitle: "Tactile mechanical switches, dynamic backlight, and ultra-fast response for work and gaming.",
    priceLabel: "Starting from",
    price: "INR 2,499",
    originalPrice: "INR 4,999",
    offer: "50% OFF",
    category: "Computers & Gaming",
    cta: "Upgrade Your Setup",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=85",
    ...DARK_THEME,
  },
];

const fallbackCompanionDeals: CompanionDeal[] = [
  {
    id: "fallback-watch",
    label: "SMART WATCHES",
    title: "AMOLED Calling Watches",
    detail: "Up to 64% Off",
    action: "View Deals",
    category: "Mobiles & Wearables",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80",
    accent: "cyan",
  },
  {
    id: "fallback-gaming",
    label: "GAMING & TECH",
    title: "Keyboards & Gear",
    detail: "Starting from INR 499",
    action: "Shop Gaming",
    category: "Computers & Gaming",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=80",
    accent: "amber",
  },
];

export default function HeroCarousel({ products = [], onExploreCategory, onSelectProduct }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  const allSlides = useMemo<HeroSlideItem[]>(() => {
    const featuredFromAdmin = products
      .filter((product) => product.isHeroFeatured)
      .map((product) => ({
        id: `hero-${product.id}`,
        badge: product.heroBadge || (product.discountPercent > 0 ? `EXCLUSIVE DROP - ${product.discountPercent}% OFF` : "FEATURED SPOTLIGHT"),
        title: product.heroBannerHeadline || product.title,
        subtitle: product.heroBannerSubtitle || product.description || "100% genuine with official brand warranty and express delivery.",
        priceLabel: "Special Offer Price",
        price: `INR ${product.price.toLocaleString("en-IN")}`,
        originalPrice: product.originalPrice > product.price ? `INR ${product.originalPrice.toLocaleString("en-IN")}` : undefined,
        offer: product.heroOfferText || (product.discountPercent > 0 ? `${product.discountPercent}% OFF` : "FREE DELIVERY"),
        category: product.category,
        cta: "Shop This Product",
        image: product.image || product.images?.[0] || "",
        productRef: product,
        ...DARK_THEME,
      }));

    return featuredFromAdmin.length > 0 ? [...featuredFromAdmin, ...DEFAULT_HERO_SLIDES] : DEFAULT_HERO_SLIDES;
  }, [products]);

  const activeIndex = currentSlide >= allSlides.length ? 0 : currentSlide;
  const slide = allSlides[activeIndex] || DEFAULT_HERO_SLIDES[0];

  const companionDeals = useMemo<CompanionDeal[]>(() => {
    const available = products.filter((product) => product.id !== slide.productRef?.id);
    const featured = available.filter((product) => product.isHeroFeatured);
    const mobileProduct = featured.find((product) => product.category.toLowerCase().includes("mobile")) || featured.find((product) => product.category.toLowerCase().includes("wearable")) || available.find((product) => product.category.toLowerCase().includes("mobile")) || available.find((product) => product.category.toLowerCase().includes("wearable"));
    const gamingProduct = featured.find((product) => product.category.toLowerCase().includes("gaming")) || featured.find((product) => product.category.toLowerCase().includes("computer")) || available.find((product) => product.category.toLowerCase().includes("gaming")) || available.find((product) => product.category.toLowerCase().includes("computer"));
    const selected = [mobileProduct, gamingProduct];

    return fallbackCompanionDeals.map((fallback, index) => {
      const product = selected[index];
      if (!product) return fallback;
      return {
        ...fallback,
        id: `companion-${product.id}`,
        label: product.heroBadge || product.category.toUpperCase(),
        title: product.heroBannerHeadline || product.title,
        detail: product.heroOfferText || (product.discountPercent > 0 ? `Up to ${product.discountPercent}% Off` : `From INR ${product.price.toLocaleString("en-IN")}`),
        action: index === 0 ? "View Deals" : "Shop Gaming",
        category: product.category,
        image: product.image || product.images?.[0] || fallback.image,
        productRef: product,
      };
    });
  }, [products, slide.productRef?.id]);

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setCurrentSlide((current) => (current + 1) % allSlides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [isPaused, allSlides.length]);

  const changeSlide = (direction: "next" | "previous") => {
    setCurrentSlide((current) => direction === "next" ? (current + 1) % allSlides.length : (current - 1 + allSlides.length) % allSlides.length);
  };

  return (
    <section className="px-3 sm:px-6 lg:px-8 pt-3 pb-2 font-sans" aria-label="Featured Offers">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div
          className="relative min-h-[430px] sm:min-h-[360px] lg:min-h-[342px] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#182236] border border-slate-700 text-white shadow-lg shadow-slate-950/10 p-4 sm:p-6 lg:col-span-8 flex flex-col justify-between transition-colors duration-500"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsPaused(false);
          }}
        >
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_75%_20%,rgba(34,211,238,0.12),transparent_32%),radial-gradient(circle_at_15%_95%,rgba(244,63,94,0.12),transparent_35%)]" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={String(slide.id)}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
              transition={{ duration: reduceMotion ? 0.15 : 0.25 }}
              className="relative grid grid-cols-1 md:grid-cols-12 items-center gap-4 sm:gap-6 my-auto"
            >
              <div className="order-2 md:order-1 md:col-span-7 space-y-2.5 sm:space-y-3 min-w-0">
                <span className={`inline-flex max-w-full items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider ${slide.badgeStyle}`}>
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span className="truncate">{slide.badge}</span>
                </span>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight tracking-tight line-clamp-2">{slide.title}</h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed line-clamp-2">{slide.subtitle}</p>
                <div className="pt-0.5 flex flex-wrap items-baseline gap-2">
                  <span className="text-xs font-bold text-slate-400">{slide.priceLabel}:</span>
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">{slide.price}</span>
                  {slide.originalPrice && <span className="text-xs sm:text-sm font-medium text-slate-500 line-through">{slide.originalPrice}</span>}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 text-white font-extrabold text-[10px] sm:text-[11px] shadow-sm"><Tag className="w-3 h-3" /><span>{slide.offer}</span></span>
                </div>
                <div className="pt-1.5 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={() => slide.productRef && onSelectProduct ? onSelectProduct(slide.productRef) : onExploreCategory(slide.category)} className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl ${slide.ctaBg} text-white font-extrabold text-xs sm:text-sm transition-all shadow-sm active:scale-95 cursor-pointer`}><span>{slide.cta}</span><ArrowRight className={`w-4 h-4 ${slide.ctaArrow}`} /></button>
                  <button type="button" onClick={() => onExploreCategory(slide.category)} className={`w-full sm:w-auto inline-flex items-center justify-center text-xs sm:text-sm font-bold ${slide.ctaHover} underline decoration-slate-500 underline-offset-4 transition cursor-pointer py-1`}>Browse {slide.category}</button>
                </div>
              </div>

              <div className="order-1 md:order-2 md:col-span-5 flex items-center justify-center">
                <div className="relative w-32 h-32 sm:w-44 sm:h-44 lg:w-48 lg:h-48 rounded-2xl bg-slate-800/90 border border-slate-600 shadow-xl p-3 flex items-center justify-center overflow-hidden group">
                  <img src={slide.image} alt={slide.title} className="max-h-full max-w-full object-contain rounded-xl drop-shadow-sm transition-transform duration-300 group-hover:scale-105" loading="eager" />
                  <div className="absolute top-2 right-2 bg-emerald-950/90 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-700/70 flex items-center gap-0.5"><ShieldCheck className="w-3 h-3" /><span>Verified</span></div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="relative flex items-center justify-between pt-2.5 border-t border-slate-700/80 mt-3">
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Hero carousel pagination">
              {allSlides.map((item, index) => <button key={String(item.id)} type="button" role="tab" aria-selected={index === activeIndex} aria-label={`Go to slide ${index + 1}`} onClick={() => setCurrentSlide(index)} className={`h-1.5 rounded-full transition-all cursor-pointer ${index === activeIndex ? "w-6 bg-cyan-300" : "w-2 bg-slate-600 hover:bg-slate-400"}`} />)}
            </div>
            <div className="flex items-center gap-1.5"><button type="button" onClick={() => changeSlide("previous")} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-200 transition cursor-pointer" aria-label="Previous slide"><ChevronLeft className="w-4 h-4" /></button><button type="button" onClick={() => changeSlide("next")} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-200 transition cursor-pointer" aria-label="Next slide"><ChevronRight className="w-4 h-4" /></button></div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:col-span-4 lg:grid-rows-2">
          {companionDeals.map((deal) => {
            const accentClasses = deal.accent === "cyan"
              ? { label: "text-cyan-200 bg-cyan-400/10 border-cyan-400/30", action: "text-cyan-300", image: "border-cyan-400/20" }
              : { label: "text-amber-200 bg-amber-400/10 border-amber-400/30", action: "text-amber-300", image: "border-amber-400/20" };
            return <button key={deal.id} type="button" onClick={() => deal.productRef && onSelectProduct ? onSelectProduct(deal.productRef) : onExploreCategory(deal.category)} className="min-h-[150px] lg:min-h-0 flex items-center justify-between gap-2 p-3 sm:p-4 rounded-2xl bg-slate-900 border border-slate-700 text-left shadow-md shadow-slate-950/5 hover:border-slate-500 hover:bg-slate-800 transition-all cursor-pointer group overflow-hidden">
              <div className="space-y-1 min-w-0"><span className={`inline-flex max-w-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded border ${accentClasses.label}`}><span className="truncate">{deal.label}</span></span><h2 className="text-[11px] sm:text-sm font-extrabold text-white leading-tight line-clamp-2">{deal.title}</h2><p className="text-[10px] sm:text-xs font-semibold text-slate-400 line-clamp-1">{deal.detail}</p><span className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold ${accentClasses.action} pt-0.5`}>{deal.action}<ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" /></span></div>
              <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-xl bg-slate-800 border p-1.5 sm:p-2 flex items-center justify-center shrink-0 group-hover:bg-slate-700 transition-colors overflow-hidden ${accentClasses.image}`}><img src={deal.image} alt={deal.title} className="max-h-full max-w-full object-contain rounded-lg" loading="lazy" /></div>
            </button>;
          })}
        </div>
      </div>
    </section>
  );
}
