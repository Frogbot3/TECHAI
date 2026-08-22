"use client";

import React from "react";
import { motion } from "framer-motion";
import { Leaf, Sparkles, ArrowRight } from "lucide-react";

interface EcoFriendlyBannerProps {
  onSelectCategory: (category: string) => void;
}

const ECO_TILES = [
  {
    id: "eco-home",
    name: "Home & Kitchen",
    category: "Home Appliances",
    image: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "eco-care",
    name: "Personal Care",
    category: "Beauty & Personal Care",
    image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "eco-tech",
    name: "Tech & Gadgets",
    category: "Mobiles & Wearables",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "eco-fashion",
    name: "Eco Fashion",
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80",
  },
  {
    id: "eco-food",
    name: "Food & Groceries",
    category: "Grocery & Essentials",
    image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=300&auto=format&fit=crop&q=80",
  },
];

export default function EcoFriendlyBanner({ onSelectCategory }: EcoFriendlyBannerProps) {
  return (
    <section className="px-3 sm:px-6 lg:px-8 py-5">
      <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Background Leaf Deco */}
        <div className="absolute right-6 top-6 opacity-15 pointer-events-none">
          <Leaf className="w-48 h-48 text-white" />
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider text-emerald-100 mb-2">
              <Leaf className="w-3.5 h-3.5 text-yellow-300" />
              <span>Sustainable Living Collection</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white leading-tight">
              Shop Eco-Friendly, Live Sustainably!
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-1">
              Curated low-power gadgets, toxin-free care, and organic pantry essentials.
            </p>
          </div>

          <button
            onClick={() => onSelectCategory("Grocery & Essentials")}
            className="w-fit px-5 py-2.5 rounded-full bg-slate-950 hover:bg-slate-900 text-yellow-300 text-xs font-black transition-all shadow-md flex items-center gap-2 flex-shrink-0"
          >
            <span>Buy smart & save green</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 5 Tile Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 relative z-10">
          {ECO_TILES.map((tile) => (
            <motion.button
              key={tile.id}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectCategory(tile.category)}
              className="group flex flex-col items-center justify-between p-3.5 bg-white rounded-2xl shadow-md text-center cursor-pointer"
            >
              <div className="w-full aspect-[4/3] rounded-xl bg-slate-50 flex items-center justify-center p-2 mb-2 group-hover:bg-emerald-50 transition-colors overflow-hidden">
                <img
                  src={tile.image}
                  alt={tile.name}
                  className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <span className="text-xs font-extrabold text-slate-800 group-hover:text-emerald-700 transition-colors truncate max-w-full">
                {tile.name}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
