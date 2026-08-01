"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Zap, ShieldCheck, Truck, RefreshCw } from "lucide-react";

interface HeroCarouselProps {
  onExploreCategory: (category: string) => void;
}

const BANNERS = [
  {
    id: 1,
    tag: "AI REVOLUTION 2026",
    title: "TECH AI Spatial Vision Pro",
    subtitle: "Dual 4K Micro-OLED • Neural Translation • 6DoF Tracking",
    description: "Experience spatial computing with real-time AI assistance on your eyes.",
    cta: "Explore AI Electronics",
    category: "AI Electronics",
    badge: "NEW LAUNCH",
    bgGradient: "from-slate-900 via-cyan-950 to-slate-900",
    accentColor: "text-cyan-400",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80"
  },
  {
    id: 2,
    tag: "SPEED REDEFINED",
    title: "Adidas F50 Elite FG Cleats",
    subtitle: "Fibertouch Upper • Sprintframe 360 • Lightweight 185g",
    description: "Designed for explosive acceleration and effortless ball mastery on the pitch.",
    cta: "Shop Footwear",
    category: "Footwear & Sports",
    badge: "25% OFF",
    bgGradient: "from-blue-950 via-slate-900 to-indigo-950",
    accentColor: "text-blue-400",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&auto=format&fit=crop&q=80"
  },
  {
    id: 3,
    tag: "LIMITED EDITION HOROLOGY",
    title: "Omega x Swatch MoonSwatch",
    subtitle: "Snoopy Moonphase Disc • Bioceramic Case • Swiss Quartz",
    description: "Iconic space-age design with secret UV night light Snoopy message.",
    cta: "Shop Watches",
    category: "Watches & Accessories",
    badge: "EXCLUSIVE",
    bgGradient: "from-slate-950 via-neutral-900 to-slate-900",
    accentColor: "text-amber-400",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1000&auto=format&fit=crop&q=80"
  },
  {
    id: 4,
    tag: "DESK BUDDY & RELAXATION",
    title: "Pink Pig Squeeze Stress Toy",
    subtitle: "Soft TPR Rubber • Executive Red Tie • Ultra Elastic Squeeze",
    description: "The ultimate anti-anxiety desktop companion that always regains its shape.",
    cta: "Explore Toys",
    category: "Toys & Stress Relief",
    badge: "FLAT 50% OFF",
    bgGradient: "from-pink-950 via-slate-900 to-purple-950",
    accentColor: "text-pink-400",
    image: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=1000&auto=format&fit=crop&q=80"
  }
];

export default function HeroCarousel({ onExploreCategory }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNERS.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const slide = BANNERS[currentSlide];

  return (
    <div className="relative overflow-hidden bg-slate-950 text-white rounded-3xl mx-4 sm:mx-6 lg:mx-8 my-4 shadow-2xl border border-slate-800">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
          className={`bg-gradient-to-r ${slide.bgGradient} p-6 sm:p-10 lg:p-12 min-h-[320px] sm:min-h-[400px] flex flex-col md:flex-row items-center justify-between gap-8 relative`}
        >
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex-1 max-w-xl z-10 space-y-4 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/15 px-3.5 py-1 rounded-full text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="tracking-wider uppercase text-slate-200">{slide.tag}</span>
              <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                {slide.badge}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              {slide.title}
            </h1>

            <p className={`text-sm sm:text-base font-medium ${slide.accentColor}`}>
              {slide.subtitle}
            </p>

            <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-lg">
              {slide.description}
            </p>

            <div className="pt-2 flex flex-wrap gap-3 justify-center md:justify-start">
              <button
                onClick={() => onExploreCategory(slide.category)}
                className="inline-flex items-center space-x-2 bg-white text-slate-950 hover:bg-slate-100 px-6 py-3 rounded-full text-xs font-bold transition-all transform hover:scale-105 shadow-lg"
              >
                <span>{slide.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative flex-1 max-w-md w-full flex justify-center z-10">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-20">
        {BANNERS.map((b, idx) => (
          <button
            key={b.id}
            onClick={() => setCurrentSlide(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              currentSlide === idx ? "w-8 bg-cyan-400" : "bg-white/40 hover:bg-white/70"
            }`}
          ></button>
        ))}
      </div>

      <div className="bg-slate-900/90 backdrop-blur-md border-t border-slate-800 py-3 px-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium text-slate-300">
        <div className="flex items-center space-x-2 justify-center">
          <Truck className="w-4 h-4 text-cyan-400" />
          <span>Express Free Shipping &gt; ₹499</span>
        </div>
        <div className="flex items-center space-x-2 justify-center">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>100% Genuine TECH AI Guarantee</span>
        </div>
        <div className="flex items-center space-x-2 justify-center">
          <RefreshCw className="w-4 h-4 text-amber-400" />
          <span>7-Day Hassle-Free Replacement</span>
        </div>
        <div className="flex items-center space-x-2 justify-center">
          <Zap className="w-4 h-4 text-purple-400" />
          <span>Live Order Tracking</span>
        </div>
      </div>
    </div>
  );
}
