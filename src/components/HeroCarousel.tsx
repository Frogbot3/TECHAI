"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck, Sparkles, Tag } from "lucide-react";
import { HeroCampaign, Product } from "@/lib/types";

interface HeroCarouselProps {
  products?: Product[];
  campaigns?: HeroCampaign[];
  onExploreCategory: (category: string) => void;
  onSelectProduct?: (product: Product) => void;
  onOpenProductPage?: (product: Product) => void;
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
  campaignId?: string;
  verified?: boolean;
  backgroundStyle?: "solid" | "gradient";
  backgroundValue?: string;
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
  ctaText: string;
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
    container: "bg-[#c72d68] border-[#c72d68]",
    badge: "bg-white/15 text-white border-white/25",
    heading: "text-white",
    body: "text-white/80",
    label: "text-white/80",
    price: "text-white",
    original: "text-white/60",
    cta: "bg-white hover:bg-white/90",
    ctaText: "text-rose-800",
    link: "text-white/90 hover:text-white",
    arrow: "text-rose-800",
    media: "bg-black/20 border-white/25",
    divider: "border-white/20",
    indicator: "bg-white/40 hover:bg-white/60",
    activeIndicator: "bg-white",
    control: "bg-white/10 hover:bg-white/20 border-white/30 text-white",
  },
  cyan: {
    container: "bg-[#087b91] border-[#087b91]",
    badge: "bg-white/15 text-white border-white/25",
    heading: "text-white",
    body: "text-white/80",
    label: "text-white/80",
    price: "text-white",
    original: "text-white/60",
    cta: "bg-white hover:bg-white/90",
    ctaText: "text-cyan-900",
    link: "text-white/90 hover:text-white",
    arrow: "text-cyan-900",
    media: "bg-black/20 border-white/25",
    divider: "border-white/20",
    indicator: "bg-white/40 hover:bg-white/60",
    activeIndicator: "bg-white",
    control: "bg-white/10 hover:bg-white/20 border-white/30 text-white",
  },
  indigo: {
    container: "bg-[#5b2f87] border-[#5b2f87]",
    badge: "bg-white/15 text-white border-white/25",
    heading: "text-white",
    body: "text-white/80",
    label: "text-white/80",
    price: "text-white",
    original: "text-white/60",
    cta: "bg-white hover:bg-white/90",
    ctaText: "text-indigo-900",
    link: "text-white/90 hover:text-white",
    arrow: "text-indigo-900",
    media: "bg-black/20 border-white/25",
    divider: "border-white/20",
    indicator: "bg-white/40 hover:bg-white/60",
    activeIndicator: "bg-white",
    control: "bg-white/10 hover:bg-white/20 border-white/30 text-white",
  },
  amber: {
    container: "bg-[#b45309] border-[#b45309]",
    badge: "bg-white/15 text-white border-white/25",
    heading: "text-white",
    body: "text-white/80",
    label: "text-white/80",
    price: "text-white",
    original: "text-white/60",
    cta: "bg-white hover:bg-white/90",
    ctaText: "text-amber-900",
    link: "text-white/90 hover:text-white",
    arrow: "text-amber-900",
    media: "bg-black/20 border-white/25",
    divider: "border-white/20",
    indicator: "bg-white/40 hover:bg-white/60",
    activeIndicator: "bg-white",
    control: "bg-white/10 hover:bg-white/20 border-white/30 text-white",
  },
  emerald: {
    container: "bg-[#047857] border-[#047857]",
    badge: "bg-white/15 text-white border-white/25",
    heading: "text-white",
    body: "text-white/80",
    label: "text-white/80",
    price: "text-white",
    original: "text-white/60",
    cta: "bg-white hover:bg-white/90",
    ctaText: "text-emerald-900",
    link: "text-white/90 hover:text-white",
    arrow: "text-emerald-900",
    media: "bg-black/20 border-white/25",
    divider: "border-white/20",
    indicator: "bg-white/40 hover:bg-white/60",
    activeIndicator: "bg-white",
    control: "bg-white/10 hover:bg-white/20 border-white/30 text-white",
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

export default function HeroCarousel({ campaigns = [], products = [], onExploreCategory, onSelectProduct, onOpenProductPage }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const resumeTimerRef = useRef<number | null>(null);

  const pauseForInteraction = (resume = true) => {
    setIsPaused(true);
    if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    if (resume) resumeTimerRef.current = window.setTimeout(() => setIsPaused(false), 7000);
  };

  const allSlides = useMemo<HeroSlideItem[]>(() => {
    const campaignSlides: HeroSlideItem[] = campaigns.flatMap((campaign) => {
        const product = campaign.product || products.find((item) => item.id === campaign.productId);
        if (!product) return [];
        const theme = getHeroTheme(product.category, campaign.titleOverride || product.title);
        return [{
          id: campaign.id,
          campaignId: campaign.id,
          badge: campaign.badge,
          title: campaign.titleOverride || product.title,
          subtitle: campaign.subtitle || product.description,
          priceLabel: "Special Offer Price",
          price: `INR ${campaign.price.toLocaleString("en-IN")}`,
          originalPrice: campaign.originalPrice > campaign.price ? `INR ${campaign.originalPrice.toLocaleString("en-IN")}` : undefined,
          offer: campaign.offerText,
          category: product.category,
          cta: campaign.ctaText,
          image: campaign.imageOverride || product.image,
          productRef: product,
          badgeStyle: theme.badge,
          ctaBg: theme.cta,
          ctaHover: theme.link,
          ctaArrow: theme.arrow,
          theme,
          verified: campaign.verified,
          backgroundStyle: campaign.backgroundStyle,
          backgroundValue: campaign.backgroundValue,
        } satisfies HeroSlideItem];
      });

    if (campaignSlides.length > 0) return campaignSlides;

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
        verified: false,
      }));

    return featuredFromAdmin.length > 0 ? [...featuredFromAdmin, ...DEFAULT_HERO_SLIDES] : DEFAULT_HERO_SLIDES;
  }, [campaigns, products]);

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

  useEffect(() => {
    const handleVisibilityChange = () => setIsPaused(document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!slide.campaignId) return;
    const storageKey = `techai_campaign_impression_${slide.campaignId}`;
    try {
      if (window.sessionStorage.getItem(storageKey)) return;
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // Analytics should never block the hero.
    }
    fetch("/api/hero-campaigns/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId: slide.campaignId, event: "impression" }),
    }).catch(() => {});
  }, [slide.campaignId]);

  const changeSlide = (direction: "next" | "previous") => {
    pauseForInteraction();
    setCurrentSlide((current) => direction === "next" ? (current + 1) % allSlides.length : (current - 1 + allSlides.length) % allSlides.length);
  };

  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    pauseForInteraction(false);
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 45) {
      changeSlide("next");
    } else if (diff < -45) {
      changeSlide("previous");
    } else {
      pauseForInteraction();
    }
    setTouchStartX(null);
  };

  const handleSlideAction = () => {
    if (slide.campaignId) {
      fetch("/api/hero-campaigns/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: slide.campaignId, event: "click" }),
      }).catch(() => {});
    }
    if (slide.campaignId && slide.productRef && (onOpenProductPage || onSelectProduct)) {
      fetch("/api/hero-campaigns/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: slide.campaignId, event: "product-click" }),
      }).catch(() => {});
    }
    if (slide.productRef && onOpenProductPage) {
      onOpenProductPage(slide.productRef);
      return;
    }
    if (slide.productRef && onSelectProduct) {
      onSelectProduct(slide.productRef);
      return;
    }
    onExploreCategory(slide.category);
  };

  const customBackgroundStyle = slide.backgroundValue
    ? slide.backgroundStyle === "gradient"
      ? { backgroundImage: slide.backgroundValue }
      : { backgroundColor: slide.backgroundValue }
    : undefined;

  return (
    <section
      className="px-2.5 sm:px-6 lg:px-8 pt-2 sm:pt-3 pb-1 sm:pb-2 font-sans"
      aria-label="Featured Offers"
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") changeSlide("next");
        if (event.key === "ArrowLeft") changeSlide("previous");
      }}
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div
          className={`relative min-h-[210px] sm:min-h-[360px] lg:min-h-[342px] overflow-hidden rounded-2xl border text-slate-950 shadow-md sm:shadow-lg shadow-slate-950/10 p-3 sm:p-6 lg:col-span-8 flex flex-col justify-between transition-colors duration-500 ${slide.theme.container}`}
          style={customBackgroundStyle}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsPaused(false);
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.14),transparent_32%)]" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={String(slide.id)}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -12 }}
              transition={{ duration: reduceMotion ? 0.15 : 0.25 }}
              className="relative grid grid-cols-[1.1fr_0.9fr] sm:grid-cols-12 items-center gap-2 sm:gap-6 my-auto"
            >
              <div className="sm:col-span-7 space-y-1 sm:space-y-3 min-w-0">
                <span className={`inline-flex max-w-full items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border text-[9px] sm:text-[11px] font-extrabold uppercase tracking-wider ${slide.badgeStyle}`}>
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                  <span className="truncate">{slide.badge}</span>
                </span>
                <h1 className={`text-[13px] sm:text-2xl lg:text-3xl font-black leading-tight tracking-tight line-clamp-2 ${slide.theme.heading}`}>{slide.title}</h1>
                <p className={`hidden sm:block text-xs sm:text-sm font-medium leading-relaxed line-clamp-2 ${slide.theme.body}`}>{slide.subtitle}</p>
                <div className="pt-0.5 flex flex-wrap items-baseline gap-1 sm:gap-2">
                  <span className={`hidden sm:inline text-xs font-bold ${slide.theme.label}`}>{slide.priceLabel}:</span>
                  <span className={`text-sm sm:text-2xl lg:text-3xl font-black tracking-tight ${slide.theme.price}`}>{slide.price}</span>
                  {slide.originalPrice && <span className={`text-[10px] sm:text-sm font-medium line-through ${slide.theme.original}`}>{slide.originalPrice}</span>}
                  <span className="inline-flex min-w-0 max-w-full items-center gap-0.5 sm:gap-1 px-1.5 py-0.5 rounded-md bg-rose-600 text-white font-extrabold text-[8px] sm:text-[11px] shadow-sm" title={slide.offer}><Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" /><span className="truncate max-w-[115px] sm:max-w-[260px]">{slide.offer}</span></span>
                </div>
                <div className="pt-0.5 sm:pt-1.5 flex flex-wrap items-center gap-2 sm:gap-3">
                  <button type="button" onClick={handleSlideAction} className={`inline-flex min-h-9 items-center justify-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-3 sm:px-5 rounded-lg sm:rounded-xl ${slide.ctaBg} ${slide.theme.ctaText} font-extrabold text-[11px] sm:text-sm transition-all shadow-sm active:scale-95 cursor-pointer`}><span className="truncate max-w-[135px]">{slide.cta}</span><ArrowRight className={`w-3 h-3 sm:w-4 sm:h-4 ${slide.ctaArrow}`} /></button>
                  <button type="button" onClick={() => onExploreCategory(slide.category)} className={`hidden sm:inline-flex items-center justify-center text-xs sm:text-sm font-bold ${slide.ctaHover} underline decoration-slate-400 underline-offset-4 transition cursor-pointer py-1`}>Browse {slide.category}</button>
                </div>
              </div>

              <div className="sm:col-span-5 flex items-center justify-center min-w-0">
                <div className={`relative w-full aspect-square max-w-[130px] sm:max-w-none sm:w-44 sm:h-44 lg:w-48 lg:h-48 rounded-xl sm:rounded-2xl border shadow-md sm:shadow-xl p-1.5 sm:p-3 flex items-center justify-center overflow-hidden group ${slide.theme.media}`}>
                  <img src={slide.image} alt={slide.title} className="w-full h-full object-contain rounded-lg sm:rounded-xl drop-shadow-sm transition-transform duration-300 group-hover:scale-105" loading={activeIndex === 0 ? "eager" : "lazy"} decoding="async" onError={(event) => { if (!event.currentTarget.dataset.fallbackApplied) { event.currentTarget.dataset.fallbackApplied = "true"; event.currentTarget.src = slide.productRef?.images?.[0] || slide.productRef?.image || "/generated-products/ai-orbit-camera.png"; } }} />
                  {slide.verified && <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-emerald-950/90 text-emerald-300 text-[8px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded border border-emerald-700/70 flex items-center gap-0.5"><ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" /><span>Verified</span></div>}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className={`relative flex items-center justify-between pt-1.5 sm:pt-2.5 border-t mt-2 sm:mt-3 ${slide.theme.divider}`}>
            <div className="flex items-center gap-1 sm:gap-1.5" role="tablist" aria-label="Hero carousel pagination">
              {allSlides.map((item, index) => <button key={String(item.id)} type="button" role="tab" aria-selected={index === activeIndex} aria-label={`Go to slide ${index + 1}`} onClick={() => setCurrentSlide(index)} className={`h-1 sm:h-1.5 rounded-full transition-all cursor-pointer ${index === activeIndex ? `w-4 sm:w-6 ${slide.theme.activeIndicator}` : `w-1.5 sm:w-2 ${slide.theme.indicator}`}`} />)}
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5"><button type="button" onClick={() => changeSlide("previous")} className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg border flex items-center justify-center transition cursor-pointer ${slide.theme.control}`} aria-label="Previous slide"><ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" /></button><button type="button" onClick={() => changeSlide("next")} className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg border flex items-center justify-center transition cursor-pointer ${slide.theme.control}`} aria-label="Next slide"><ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" /></button></div>
          </div>
        </div>

        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-1 gap-3 lg:col-span-4 lg:grid-rows-2">
          {companionDeals.map((deal) => {
            const accentClasses = deal.accent === "cyan"
              ? { card: "bg-[#4d1d73] border-[#6b2a97] hover:bg-[#5b2385] hover:border-[#7c35aa]", label: "text-white bg-white/15 border-white/25", title: "text-white", detail: "text-white/75", action: "text-white", image: "bg-black/20 border-white/25" }
              : { card: "bg-[#07182a] border-[#17314a] hover:bg-[#0b2238] hover:border-[#234665]", label: "text-white bg-white/10 border-white/20", title: "text-white", detail: "text-white/70", action: "text-white", image: "bg-white/10 border-white/20" };
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
