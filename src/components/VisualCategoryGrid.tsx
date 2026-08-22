"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface CategoryTile {
  id: string;
  name: string;
  image: string;
  query: string;
}

interface VisualCategoryGridProps {
  title: string;
  subtitle?: string;
  tiles: CategoryTile[];
  onSelectCategory: (query: string) => void;
}

export default function VisualCategoryGrid({
  title,
  subtitle,
  tiles,
  onSelectCategory,
}: VisualCategoryGridProps) {
  return (
    <section className="px-3 sm:px-6 lg:px-8 py-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
          )}
        </div>
        <button
          onClick={() => onSelectCategory("All Categories")}
          className="text-xs font-bold text-cyan-700 hover:text-cyan-800 transition-colors flex items-center gap-0.5"
        >
          <span>View All</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        {tiles.map((tile) => (
          <motion.button
            key={tile.id}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectCategory(tile.query)}
            className="group flex flex-col items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-cyan-300 transition-all text-center cursor-pointer"
          >
            {/* Visual Icon / Product Cutout */}
            <div className="w-full aspect-[4/3] rounded-xl bg-slate-50 flex items-center justify-center p-2 group-hover:bg-cyan-50/50 transition-colors mb-3 overflow-hidden">
              <img
                src={tile.image}
                alt={tile.name}
                className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            </div>

            {/* Title */}
            <span className="text-xs font-extrabold text-slate-800 group-hover:text-cyan-700 transition-colors truncate max-w-full">
              {tile.name}
            </span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
