"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Timer, Zap, ShieldCheck, Flame } from "lucide-react";

interface MarketingPromoBannersProps {
  onExploreCategory: (category: string) => void;
}

export default function MarketingPromoBanners({
  onExploreCategory,
}: MarketingPromoBannersProps) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 14,
    minutes: 32,
    seconds: 48,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-8 px-3 sm:px-6 lg:px-8 py-4">
      {/* 3-Column Marketing Promo Cards (Trio Banner) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Banner 1: Fresh Produce & Groceries */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="relative rounded-3xl overflow-hidden shadow-md bg-gradient-to-br from-rose-600 via-pink-600 to-rose-700 text-white p-6 sm:p-7 flex flex-col justify-between min-h-[260px] group cursor-pointer"
          onClick={() => onExploreCategory("Grocery & Essentials")}
        >
          <div className="space-y-2 z-10">
            <span className="inline-block px-3 py-1 bg-yellow-400 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-full shadow-sm">
              50% SAVE • FREE DELIVERY
            </span>
            <h3 className="text-xl sm:text-2xl font-black leading-tight max-w-[200px]">
              Fresh & Healthy Produce & Pantry
            </h3>
            <p className="text-xs text-rose-100 font-medium">
              Direct farm freshness, pulses & daily essentials
            </p>
          </div>

          <div className="z-10 flex items-center justify-between mt-4">
            <button className="px-5 py-2 rounded-full bg-white text-rose-700 font-black text-xs group-hover:bg-rose-50 group-hover:shadow-md transition-all flex items-center gap-1.5">
              <span>Shop Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Background Illustration / Floating Image */}
          <div className="absolute right-0 bottom-0 w-36 h-36 sm:w-44 sm:h-44 opacity-80 group-hover:scale-110 group-hover:opacity-95 transition-all duration-500 pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&auto=format&fit=crop&q=80"
              alt="Fresh grocery"
              className="w-full h-full object-contain object-bottom-right"
            />
          </div>
        </motion.div>

        {/* Banner 2: Flagship Galaxy AI & Tech */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="relative rounded-3xl overflow-hidden shadow-md bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 text-white p-6 sm:p-7 flex flex-col justify-between min-h-[260px] group cursor-pointer"
          onClick={() => onExploreCategory("Mobiles & Wearables")}
        >
          <div className="space-y-2 z-10">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-300 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-full shadow-sm">
              <Sparkles className="w-3 h-3 text-indigo-900" />
              <span>GALAXY AI IS HERE</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-black leading-tight max-w-[200px]">
              Flagship Smartphones & Watches
            </h3>
            <p className="text-xs text-cyan-100 font-medium">
              Next-gen processors with crystal AMOLED displays
            </p>
          </div>

          <div className="z-10 flex items-center justify-between mt-4">
            <button className="px-5 py-2 rounded-full bg-white text-blue-800 font-black text-xs group-hover:bg-cyan-50 group-hover:shadow-md transition-all flex items-center gap-1.5">
              <span>Explore Tech</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Background Illustration / Floating Image */}
          <div className="absolute right-0 bottom-0 w-36 h-36 sm:w-44 sm:h-44 opacity-80 group-hover:scale-110 group-hover:opacity-95 transition-all duration-500 pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&auto=format&fit=crop&q=80"
              alt="Flagship smartphones"
              className="w-full h-full object-contain object-bottom-right"
            />
          </div>
        </motion.div>

        {/* Banner 3: Festive & Gourmet Hampers */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="relative rounded-3xl overflow-hidden shadow-md bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 text-white p-6 sm:p-7 flex flex-col justify-between min-h-[260px] group cursor-pointer"
          onClick={() => onExploreCategory("Home Appliances")}
        >
          <div className="space-y-2 z-10">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-300 text-slate-950 font-black text-[11px] uppercase tracking-wider rounded-full shadow-sm">
              <Flame className="w-3 h-3 text-red-600" />
              <span>MEGA COMBO SAVINGS</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-black leading-tight max-w-[200px]">
              Home Kitchen & Daily Delights
            </h3>
            <p className="text-xs text-amber-100 font-medium">
              Up to 60% off on irons, kettles & blenders
            </p>
          </div>

          <div className="z-10 flex items-center justify-between mt-4">
            <button className="px-5 py-2 rounded-full bg-white text-orange-700 font-black text-xs group-hover:bg-amber-50 group-hover:shadow-md transition-all flex items-center gap-1.5">
              <span>Grab Deals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Background Illustration / Floating Image */}
          <div className="absolute right-0 bottom-0 w-36 h-36 sm:w-44 sm:h-44 opacity-80 group-hover:scale-110 group-hover:opacity-95 transition-all duration-500 pointer-events-none">
            <img
              src="https://images.unsplash.com/photo-1608354580875-30bd4168b351?w=400&auto=format&fit=crop&q=80"
              alt="Kitchen essentials"
              className="w-full h-full object-contain object-bottom-right"
            />
          </div>
        </motion.div>
      </div>

      {/* Middle Full-Width Mega Promo Banner (Arabic/English Festive Style) */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 border border-emerald-800/80 p-6 sm:p-10 text-white shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left / Info */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                <span>LIMITED TIME MEGA SALE</span>
              </span>

              {/* Countdown Timer */}
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold bg-slate-950/60 px-3 py-1 rounded-full border border-emerald-700/50">
                <Timer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ends in:</span>
                <span className="text-yellow-300">
                  {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:
                  {String(timeLeft.seconds).padStart(2, "0")}
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Super Festive Mega Clearance <br />
                <span className="text-emerald-300">Up to 70% Off Everything</span>
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/80 mt-2 max-w-xl">
                Exclusive discounts on top appliances, smartphones, soundbars, and groceries. Enjoy zero delivery charges and instant cashbacks.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onExploreCategory("All Categories")}
                className="px-6 py-3 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-lg hover:shadow-yellow-400/20 flex items-center gap-2"
              >
                <span>Shop Mega Offers</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Instant Checkout & Warranty</span>
              </div>
            </div>
          </div>

          {/* Right / Visual Graphic */}
          <div className="lg:col-span-5 flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-emerald-700/40 bg-emerald-900/40 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-800/60">
                <span className="text-xs font-black text-white">TECH AI Super Saver</span>
                <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                  VERIFIED DEALS
                </span>
              </div>
              <div className="py-4 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80"
                  alt="Mega clearance shoes and electronics"
                  className="max-h-44 object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)] transform -rotate-6 hover:rotate-0 transition-transform duration-500"
                />
              </div>
              <div className="flex items-center justify-between pt-2 text-[11px] text-emerald-200 font-semibold">
                <span>Free Next-Day Delivery</span>
                <span className="font-mono text-yellow-300 font-extrabold">CODE: FESTIVE70</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
