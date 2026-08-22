"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Flame, ShieldCheck } from "lucide-react";

interface HeroCarouselProps {
  onExploreCategory: (category: string) => void;
}

const HERO_SLIDES = [
  {
    id: 1,
    badge: "AUDIO FEST",
    title: "Premium Sound. Better Price.",
    subtitle: "Wireless earbuds, noise-cancelling headphones, and soundbars from top brands.",
    priceTag: "Starting from ₹999",
    category: "Electronics",
    cta: "Shop Audio",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: 2,
    badge: "NEXT-GEN TECH",
    title: "Flagship Mobiles & Smartwatches",
    subtitle: "Crisp AMOLED displays, multi-day battery life, and Bluetooth calling.",
    priceTag: "Starts at ₹1,799",
    category: "Mobiles & Wearables",
    cta: "Explore Tech",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: 3,
    badge: "HOME ESSENTIALS",
    title: "Modern Appliances For Everyday Living",
    subtitle: "Heavy soleplate steam irons, stainless steel kettles, and kitchen tools.",
    priceTag: "Up to 50% Off",
    category: "Home Appliances",
    cta: "Shop Appliances",
    image: "https://images.unsplash.com/photo-1608354580875-30bd4168b351?w=800&auto=format&fit=crop&q=80",
  },
];

export default function HeroCarousel({ onExploreCategory }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <section className="px-3 sm:px-6 lg:px-8 pt-4 pb-2">
      {/* 2-Column Grid: 8 cols (Primary Hero) + 4 cols (Secondary Promo Tiles) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Primary Hero Banner */}
        <div className="lg:col-span-8 relative rounded-2xl overflow-hidden bg-slate-900 text-white min-h-[320px] sm:min-h-[380px] flex flex-col justify-between p-6 sm:p-10 shadow-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center flex-1"
            >
              {/* Text Side */}
              <div className="sm:col-span-7 space-y-3 z-10">
                <span className="inline-block px-2.5 py-1 bg-cyan-950 text-cyan-300 border border-cyan-800 rounded-md text-[11px] font-bold uppercase tracking-wider">
                  {slide.badge}
                </span>

                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight">
                  {slide.title}
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
                  {slide.subtitle}
                </p>

                <div className="text-lg sm:text-xl font-bold text-amber-400">
                  {slide.priceTag}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onExploreCategory(slide.category)}
                    className="px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <span>{slide.cta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Product Visual */}
              <div className="sm:col-span-5 flex items-center justify-center">
                <div className="w-44 h-44 sm:w-56 sm:h-56 relative flex items-center justify-center">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="max-h-full max-w-full object-contain rounded-xl drop-shadow-xl"
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots Indicator */}
          <div className="flex items-center space-x-2 pt-4 z-20">
            {HERO_SLIDES.map((s, index) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  index === currentSlide ? "w-6 bg-cyan-400" : "w-2 bg-slate-700 hover:bg-slate-500"
                }`}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Secondary Promo Cards (2 Cards Stacked) */}
        <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4">
          {/* Card 1: Smart Watches */}
          <div
            onClick={() => onExploreCategory("Mobiles & Wearables")}
            className="flex-1 rounded-2xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 p-5 flex items-center justify-between cursor-pointer transition-colors group"
          >
            <div className="space-y-1 max-w-[160px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">
                Smart Tech
              </span>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Smart Watches
              </h3>
              <p className="text-xs font-semibold text-rose-600">Up to 40% Off</p>
              <span className="text-xs font-bold text-slate-700 group-hover:text-cyan-700 flex items-center gap-1 pt-1">
                <span>View Deals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80"
                alt="Smart watch"
                className="max-h-full max-w-full object-contain rounded-lg group-hover:scale-105 transition-transform"
              />
            </div>
          </div>

          {/* Card 2: Gaming & Accessories */}
          <div
            onClick={() => onExploreCategory("Computers & Gaming")}
            className="flex-1 rounded-2xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 p-5 flex items-center justify-between cursor-pointer transition-colors group"
          >
            <div className="space-y-1 max-w-[160px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-white px-2 py-0.5 rounded">
                Gaming Gear
              </span>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                Keyboards & Audio
              </h3>
              <p className="text-xs font-semibold text-emerald-600">Starting from ₹499</p>
              <span className="text-xs font-bold text-slate-700 group-hover:text-cyan-700 flex items-center gap-1 pt-1">
                <span>Shop Gaming</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="w-24 h-24 flex-shrink-0 flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1587829741301-dc798b83add?w=300&auto=format&fit=crop&q=80"
                alt="Gaming keyboard"
                className="max-h-full max-w-full object-contain rounded-lg group-hover:scale-105 transition-transform"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
