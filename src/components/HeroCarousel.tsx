"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, RefreshCw, ShieldCheck, Truck, WalletCards } from "lucide-react";

interface HeroCarouselProps {
  onExploreCategory: (category: string) => void;
}

const BANNERS = [
  {
    id: 1,
    label: "Daily value store",
    title: "Mobiles, appliances, fashion, and essentials in one cart",
    description: "Fresh catalog from MongoDB, quick checkout, order tracking, and admin-managed inventory.",
    cta: "Shop Mobiles",
    category: "Mobiles & Wearables",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80",
  },
  {
    id: 2,
    label: "Home needs",
    title: "Useful appliances for everyday kitchen and home work",
    description: "Verified stock, clear prices, and delivery details before checkout.",
    cta: "Shop Appliances",
    category: "Home Appliances",
    image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200&auto=format&fit=crop&q=80",
  },
  {
    id: 3,
    label: "Work and gaming",
    title: "Computer accessories for calls, gaming, and productivity",
    description: "Browse practical products with specifications, highlights, and low-stock alerts.",
    cta: "Shop Computers",
    category: "Computers & Gaming",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop&q=80",
  },
];

export default function HeroCarousel({ onExploreCategory }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNERS.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, []);

  const slide = BANNERS[currentSlide];

  return (
    <section className="px-3 sm:px-6 lg:px-8 pt-4">
      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.35 }}
            className="grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] min-h-[280px]"
          >
            <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center gap-4">
              <span className="w-fit rounded-md bg-amber-100 text-amber-900 px-3 py-1 text-xs font-bold uppercase tracking-wide">
                {slide.label}
              </span>
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-950 leading-tight max-w-2xl">
                  {slide.title}
                </h1>
                <p className="text-sm text-slate-600 max-w-xl leading-6">{slide.description}</p>
              </div>
              <button
                onClick={() => onExploreCategory(slide.category)}
                className="w-fit inline-flex items-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
              >
                <span>{slide.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="relative min-h-[220px] md:min-h-full bg-slate-100">
              <img src={slide.image} alt={slide.title} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 to-transparent md:bg-gradient-to-l" />
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute bottom-3 left-6 flex gap-2">
          {BANNERS.map((banner, index) => (
            <button
              key={banner.id}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${index === currentSlide ? "w-8 bg-slate-900" : "w-2 bg-slate-300"}`}
              aria-label={`Show banner ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs sm:text-sm">
        <div className="rounded-md border border-slate-200 bg-white px-3 py-3 flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-slate-700">Free delivery above Rs. 499</span>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-slate-700">Genuine catalog data</span>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-3 flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-amber-600" />
          <span className="font-semibold text-slate-700">7 day replacement</span>
        </div>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-3 flex items-center gap-2">
          <WalletCards className="w-4 h-4 text-violet-600" />
          <span className="font-semibold text-slate-700">Gateway ready checkout</span>
        </div>
      </div>
    </section>
  );
}
