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
  theme: HeroTheme;
}

interface HeroTheme {
  container: string;
  badge: string;
  heading: string;
  body: string;
  label: string;
  price: string;
  original: string;
  cta: string;
  link: string;
  arrow: string;
  media: string;
  divider: string;
  indicator: string;
  activeIndicator: string;
  control: string;
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

const HERO_THEMES: Record<"rose" | "cyan" | "indigo" | "amber" | "emerald", HeroTheme> = {
  rose: {
    container: "bg-gradient-to-br from-rose-100 via-pink-50 to-white border-rose-300",
    badge: "bg-rose-100 text-rose-800 border-rose-300",
    heading: "text-slate-950",
    body: "text-slate-700",
    label: "text-slate-600",
    price: "text-slate-950",
    original: "text-slate-500",
    cta: "bg-rose-600 hover:bg-rose-700",
    link: "text-rose-700 hover:text-rose-900",
    arrow: "text-rose-100",
    media: "bg-white border-rose-200",
    divider: "border-rose-200",
    indicator: "bg-rose-200 hover:bg-rose-300",
    activeIndicator: "bg-rose-700",
    control: "bg-white hover:bg-rose-50 border-rose-200 text-rose-800",
  },
  cyan: {
    container: "bg-gradient-to-br from-cyan-100 via-sky-50 to-white border-cyan-300",
    badge: "bg-cyan-100 text-cyan-800 border-cyan-300",
    heading: "text-slate-950",
    body: "text-slate-700",
    label: "text-slate-600",
    price: "text-slate-950",
    original: "text-slate-500",
    cta: "bg-cyan-600 hover:bg-cyan-700",
    link: "text-cyan-700 hover:text-cyan-900",
    arrow: "text-cyan-100",
    media: "bg-white border-cyan-200",
    divider: "border-cyan-200",
    indicator: "bg-cyan-200 hover:bg-cyan-300",
    activeIndicator: "bg-cyan-700",
    control: "bg-white hover:bg-cyan-50 border-cyan-200 text-cyan-800",
  },
  indigo: {
    container: "bg-gradient-to-br from-indigo-100 via-violet-50 to-white border-indigo-300",
    badge: "bg-indigo-100 text-indigo-800 border-indigo-300",
    heading: "text-slate-950",
    body: "text-slate-700",
    label: "text-slate-600",
    price: "text-slate-950",
    original: "text-slate-500",
    cta: "bg-indigo-600 hover:bg-indigo-700",
    link: "text-indigo-700 hover:text-indigo-900",
    arrow: "text-indigo-100",
    media: "bg-white border-indigo-200",
    divider: "border-indigo-200",
    indicator: "bg-indigo-200 hover:bg-indigo-300",
    activeIndicator: "bg-indigo-700",
    control: "bg-white hover:bg-indigo-50 border-indigo-200 text-indigo-800",
  },
  amber: {
    container: "bg-gradient-to-br from-amber-100 via-orange-50 to-white border-amber-300",
    badge: "bg-amber-100 text-amber-800 border-amber-300",
    heading: "text-slate-950",
    body: "text-slate-700",
    label: "text-slate-600",
    price: "text-slate-950",
    original: "text-slate-500",
    cta: "bg-amber-600 hover:bg-amber-700",
    link: "text-amber-700 hover:text-amber-900",
    arrow: "text-amber-100",
    media: "bg-white border-amber-200",
    divider: "border-amber-200",
    indicator: "bg-amber-200 hover:bg-amber-300",
    activeIndicator: "bg-amber-700",
    control: "bg-white hover:bg-amber-50 border-amber-200 text-amber-800",
  },
  emerald: {
    container: "bg-gradient-to-br from-emerald-100 via-teal-50 to-white border-emerald-300",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
    heading: "text-slate-950",
    body: "text-slate-700",
    label: "text-slate-600",
    price: "text-slate-950",
    original: "text-slate-500",
    cta: "bg-emerald-600 hover:bg-emerald-700",
    link: "text-emerald-700 hover:text-emerald-900",
    arrow: "text-emerald-100",
    media: "bg-white border-emerald-200",
    divider: "border-emerald-200",
    indicator: "bg-emerald-200 hover:bg-emerald-300",
    activeIndicator: "bg-emerald-700",
    control: "bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-800",
  },
};

const getHeroTheme = (category: string, title = "") => {
  const value = `${category} ${title}`.toLowerCase();
  if (value.includes("fashion") || value.includes("shoe") || value.includes("clog") || value.includes("cloth")) return HERO_THEMES.rose;
  if (value.includes("mobile") || value.includes("phone") || value.includes("wearable")) return HERO_THEMES.indigo;
  if (value.includes("gaming") || value.includes("computer") || value.includes("laptop")) return HERO_THEMES.amber;
  if (value.includes("home") || value.includes("appliance") || value.includes("kitchen")) return HERO_THEMES.emerald;
  return HERO_THEMES.cyan;
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
    badgeStyle: HERO_THEMES.cyan.badge,
    ctaBg: HERO_THEMES.cyan.cta,
    ctaHover: HERO_THEMES.cyan.link,
    ctaArrow: HERO_THEMES.cyan.arrow,
    theme: HERO_THEMES.cyan,
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
    badgeStyle: HERO_THEMES.indigo.badge,
    ctaBg: HERO_THEMES.indigo.cta,
    ctaHover: HERO_THEMES.indigo.link,
    ctaArrow: HERO_THEMES.indigo.arrow,
    theme: HERO_THEMES.indigo,
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
    badgeStyle: HERO_THEMES.amber.badge,
    ctaBg: HERO_THEMES.amber.cta,
    ctaHover: HERO_THEMES.amber.link,
    ctaArrow: HERO_THEMES.amber.arrow,
    theme: HERO_THEMES.amber,
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
        badgeStyle: getHeroTheme(product.category, product.title).badge,
        ctaBg: getHeroTheme(product.category, product.title).cta,
        ctaHover: getHeroTheme(product.category, product.title).link,
        ctaArrow: getHeroTheme(product.category, product.title).arrow,
        theme: getHeroTheme(product.category, product.title),
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
          className={`relative min-h-[430px] sm:min-h-[360px] lg:min-h-[342px] overflow-hidden rounded-2xl border text-slate-950 shadow-lg shadow-slate-950/10 p-4 sm:p-6 lg:col-span-8 flex flex-col justify-between transition-colors duration-500 ${slide.theme.container}`}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsPaused(false);
          }}
        >
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.55),transparent_32%)]" />
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
                <h1 className={`text-xl sm:text-2xl lg:text-3xl font-black leading-tight tracking-tight line-clamp-2 ${slide.theme.heading}`}>{slide.title}</h1>
                <p className={`text-xs sm:text-sm font-medium leading-relaxed line-clamp-2 ${slide.theme.body}`}>{slide.subtitle}</p>
                <div className="pt-0.5 flex flex-wrap items-baseline gap-2">
                  <span className={`text-xs font-bold ${slide.theme.label}`}>{slide.priceLabel}:</span>
                  <span className={`text-2xl sm:text-3xl font-black tracking-tight ${slide.theme.price}`}>{slide.price}</span>
                  {slide.originalPrice && <span className={`text-xs sm:text-sm font-medium line-through ${slide.theme.original}`}>{slide.originalPrice}</span>}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 text-white font-extrabold text-[10px] sm:text-[11px] shadow-sm"><Tag className="w-3 h-3" /><span>{slide.offer}</span></span>
                </div>
                <div className="pt-1.5 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={() => slide.productRef && onSelectProduct ? onSelectProduct(slide.productRef) : onExploreCategory(slide.category)} className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl ${slide.ctaBg} text-white font-extrabold text-xs sm:text-sm transition-all shadow-sm active:scale-95 cursor-pointer`}><span>{slide.cta}</span><ArrowRight className={`w-4 h-4 ${slide.ctaArrow}`} /></button>
                  <button type="button" onClick={() => onExploreCategory(slide.category)} className={`w-full sm:w-auto inline-flex items-center justify-center text-xs sm:text-sm font-bold ${slide.ctaHover} underline decoration-slate-400 underline-offset-4 transition cursor-pointer py-1`}>Browse {slide.category}</button>
                </div>
              </div>

              <div className="order-1 md:order-2 md:col-span-5 flex items-center justify-center">
                <div className={`relative w-32 h-32 sm:w-44 sm:h-44 lg:w-48 lg:h-48 rounded-2xl border shadow-xl p-3 flex items-center justify-center overflow-hidden group ${slide.theme.media}`}>
                  <img src={slide.image} alt={slide.title} className="max-h-full max-w-full object-contain rounded-xl drop-shadow-sm transition-transform duration-300 group-hover:scale-105" loading="eager" />
                  <div className="absolute top-2 right-2 bg-emerald-950/90 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-700/70 flex items-center gap-0.5"><ShieldCheck className="w-3 h-3" /><span>Verified</span></div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className={`relative flex items-center justify-between pt-2.5 border-t mt-3 ${slide.theme.divider}`}>
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Hero carousel pagination">
              {allSlides.map((item, index) => <button key={String(item.id)} type="button" role="tab" aria-selected={index === activeIndex} aria-label={`Go to slide ${index + 1}`} onClick={() => setCurrentSlide(index)} className={`h-1.5 rounded-full transition-all cursor-pointer ${index === activeIndex ? `w-6 ${slide.theme.activeIndicator}` : `w-2 ${slide.theme.indicator}`}`} />)}
            </div>
            <div className="flex items-center gap-1.5"><button type="button" onClick={() => changeSlide("previous")} className={`w-8 h-8 rounded-lg border flex items-center justify-center transition cursor-pointer ${slide.theme.control}`} aria-label="Previous slide"><ChevronLeft className="w-4 h-4" /></button><button type="button" onClick={() => changeSlide("next")} className={`w-8 h-8 rounded-lg border flex items-center justify-center transition cursor-pointer ${slide.theme.control}`} aria-label="Next slide"><ChevronRight className="w-4 h-4" /></button></div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:col-span-4 lg:grid-rows-2">
          {companionDeals.map((deal) => {
            const accentClasses = deal.accent === "cyan"
              ? { card: "bg-cyan-50 border-cyan-200 hover:bg-cyan-100 hover:border-cyan-300", label: "text-cyan-800 bg-cyan-100 border-cyan-300", title: "text-slate-950", detail: "text-slate-600", action: "text-cyan-700", image: "bg-white border-cyan-200" }
              : { card: "bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300", label: "text-amber-800 bg-amber-100 border-amber-300", title: "text-slate-950", detail: "text-slate-600", action: "text-amber-700", image: "bg-white border-amber-200" };
            return <button key={deal.id} type="button" onClick={() => deal.productRef && onSelectProduct ? onSelectProduct(deal.productRef) : onExploreCategory(deal.category)} className={`min-h-[150px] lg:min-h-0 flex items-center justify-between gap-2 p-3 sm:p-4 rounded-2xl border text-left shadow-md shadow-slate-950/5 transition-all cursor-pointer group overflow-hidden ${accentClasses.card}`}>
              <div className="space-y-1 min-w-0"><span className={`inline-flex max-w-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded border ${accentClasses.label}`}><span className="truncate">{deal.label}</span></span><h2 className={`text-[11px] sm:text-sm font-extrabold leading-tight line-clamp-2 ${accentClasses.title}`}>{deal.title}</h2><p className={`text-[10px] sm:text-xs font-semibold line-clamp-1 ${accentClasses.detail}`}>{deal.detail}</p><span className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold ${accentClasses.action} pt-0.5`}>{deal.action}<ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" /></span></div>
              <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-xl border p-1.5 sm:p-2 flex items-center justify-center shrink-0 transition-colors overflow-hidden ${accentClasses.image}`}><img src={deal.image} alt={deal.title} className="max-h-full max-w-full object-contain rounded-lg" loading="lazy" /></div>
            </button>;
          })}
        </div>
      </div>
    </section>
  );
}
