"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

interface HeroCarouselProps {
  onExploreCategory: (category: string) => void;
}

const HERO_SLIDES = [
  {
    id: 1,
    badge: "AUDIO FEST",
    title: "Upgrade Your Everyday Sound",
    subtitle: "Premium earbuds, noise-cancelling headphones, and soundbars from trusted brands.",
    priceLabel: "Starting at",
    price: "₹999",
    offer: "Up to 50% off",
    category: "Electronics",
    cta: "Explore Audio",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&auto=format&fit=crop&q=85",
  },
  {
    id: 2,
    badge: "NEXT-GEN TECH",
    title: "Smart Tech That Keeps Up",
    subtitle: "Bright displays, multi-day battery life, and connected essentials for every day.",
    priceLabel: "From",
    price: "₹1,799",
    offer: "Bluetooth calling included",
    category: "Mobiles & Wearables",
    cta: "Explore Tech",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&auto=format&fit=crop&q=85",
  },
  {
    id: 3,
    badge: "HOME ESSENTIALS",
    title: "Thoughtful Upgrades For Every Room",
    subtitle: "Reliable irons, kettles, and practical home tools made for the everyday routine.",
    priceLabel: "Offers up to",
    price: "50% OFF",
    offer: "Fast delivery across India",
    category: "Home Appliances",
    cta: "Shop Appliances",
    image: "https://images.unsplash.com/photo-1608354580875-30bd4168b351?w=1000&auto=format&fit=crop&q=85",
  },
];

const HERO_EASE = [0.16, 1, 0.3, 1] as const;

export default function HeroCarousel({ onExploreCategory }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => {
      setCurrentSlide((current) => (current + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [isPaused]);

  const changeSlide = (direction: "next" | "previous") => {
    setCurrentSlide((current) => {
      if (direction === "next") return (current + 1) % HERO_SLIDES.length;
      return (current - 1 + HERO_SLIDES.length) % HERO_SLIDES.length;
    });
  };

  const slide = HERO_SLIDES[currentSlide];

  return (
    <section className="px-3 pb-2 pt-4 sm:px-6 lg:px-8" aria-label="Featured offers">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div
          className="relative min-h-[430px] overflow-hidden rounded-2xl bg-slate-950 px-6 py-7 text-white shadow-lg sm:min-h-[390px] sm:px-9 sm:py-9 lg:col-span-8 lg:px-10"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsPaused(false);
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_24%,rgba(14,165,233,0.2),transparent_29%),radial-gradient(circle_at_72%_92%,rgba(8,145,178,0.14),transparent_31%)]" />

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={slide.id}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              transition={{ duration: reduceMotion ? 0.15 : 0.55, ease: HERO_EASE }}
              className="relative grid min-h-[372px] items-center gap-5 sm:min-h-[318px] sm:grid-cols-12 sm:gap-6"
            >
              <div className="relative z-10 order-1 space-y-4 sm:col-span-7 sm:space-y-4">
                <motion.span
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : 0.02, duration: 0.42, ease: HERO_EASE }}
                  className="inline-flex rounded-md border border-cyan-400/40 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-cyan-200"
                >
                  {slide.badge}
                </motion.span>

                <motion.h1
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : 0.1, duration: 0.52, ease: HERO_EASE }}
                  className="max-w-xl text-[32px] font-black leading-[1.08] tracking-[-0.045em] text-white sm:text-[40px] lg:text-[52px]"
                >
                  {slide.title}
                </motion.h1>

                <motion.p
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : 0.18, duration: 0.48, ease: HERO_EASE }}
                  className="max-w-md text-sm leading-6 text-slate-300 sm:text-[15px]"
                >
                  {slide.subtitle}
                </motion.p>

                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : 0.25, duration: 0.45, ease: HERO_EASE }}
                  className="pt-1"
                >
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">{slide.priceLabel}</p>
                  <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-3xl font-black tracking-tight text-amber-300 sm:text-[38px]">{slide.price}</span>
                    <span className="text-[11px] font-bold text-cyan-200">{slide.offer}</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : 0.32, duration: 0.45, ease: HERO_EASE }}
                  className="pt-1"
                >
                  <button
                    type="button"
                    onClick={() => onExploreCategory(slide.category)}
                    className="group inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-5 text-xs font-extrabold text-slate-950 shadow-lg shadow-slate-950/20 transition duration-200 hover:-translate-y-0.5 hover:bg-cyan-300 hover:shadow-xl active:scale-[0.98] sm:text-sm"
                  >
                    <span>{slide.cta}</span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </motion.div>
              </div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
                animate={reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1, y: [0, -8, 0] }}
                transition={
                  reduceMotion
                    ? { duration: 0.2 }
                    : {
                        opacity: { delay: 0.15, duration: 0.55, ease: HERO_EASE },
                        scale: { delay: 0.15, duration: 0.55, ease: HERO_EASE },
                        y: { delay: 0.75, duration: 4.6, ease: "easeInOut", repeat: Infinity },
                      }
                }
                className="relative order-2 mx-auto flex h-40 w-full max-w-[260px] items-center justify-center sm:col-span-5 sm:h-64 sm:max-w-none lg:h-72"
              >
                <div className="absolute inset-x-4 bottom-2 h-8 rounded-full bg-cyan-500/20 blur-2xl" />
                <img src={slide.image} alt="" className="relative h-full w-full rounded-xl object-contain object-center drop-shadow-2xl sm:scale-110 lg:scale-125" />
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <div className="relative z-20 mt-1 flex items-center justify-between gap-3 sm:mt-3">
            <div className="flex items-center gap-2" role="tablist" aria-label="Featured offers">
              {HERO_SLIDES.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={index === currentSlide}
                  aria-label={`Show offer ${index + 1}: ${item.title}`}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${index === currentSlide ? "w-7 bg-cyan-300" : "w-2 bg-slate-600 hover:bg-slate-400"}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => changeSlide("previous")} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white" aria-label="Previous offer">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => changeSlide("next")} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white" aria-label="Next offer">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row lg:col-span-4 lg:flex-col">
          <button
            type="button"
            onClick={() => onExploreCategory("Mobiles & Wearables")}
            className="group flex min-h-[156px] flex-1 items-center justify-between overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
          >
            <span className="relative z-10 max-w-[145px] space-y-1.5">
              <span className="block text-[10px] font-extrabold uppercase tracking-[0.12em] text-cyan-700">Smart tech</span>
              <span className="block text-[15px] font-black leading-snug text-slate-900">Smart Watches</span>
              <span className="block text-xs font-bold text-rose-600">Up to 40% off</span>
              <span className="inline-flex items-center gap-1 pt-1 text-[11px] font-bold text-slate-700 transition-colors group-hover:text-cyan-700">View deals <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
            </span>
            <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80" alt="Smart watch" className="h-24 w-24 rounded-lg object-cover shadow-sm transition-transform duration-200 group-hover:scale-[1.03]" />
          </button>

          <button
            type="button"
            onClick={() => onExploreCategory("Computers & Gaming")}
            className="group flex min-h-[156px] flex-1 items-center justify-between overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
          >
            <span className="relative z-10 max-w-[145px] space-y-1.5">
              <span className="block text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-600">Gaming gear</span>
              <span className="block text-[15px] font-black leading-snug text-slate-900">Keyboards & Audio</span>
              <span className="block text-xs font-bold text-emerald-700">Starting from ₹499</span>
              <span className="inline-flex items-center gap-1 pt-1 text-[11px] font-bold text-slate-700 transition-colors group-hover:text-cyan-700">Shop gaming <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" /></span>
            </span>
            <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&auto=format&fit=crop&q=80" alt="Laptop for gaming and productivity" className="h-24 w-24 rounded-lg object-cover shadow-sm transition-transform duration-200 group-hover:scale-[1.03]" />
          </button>
        </div>
      </div>
    </section>
  );
}
