"use client";

import React from "react";
import { Headphones, Gamepad2, Home, Gift, Smartphone, Baby, Laptop, Dumbbell, ArrowRight } from "lucide-react";

interface ShopByNeedSectionProps {
  onSelectNeed: (category: string, query?: string) => void;
}

const NEED_ITEMS = [
  {
    id: "need-music",
    title: "For Music & Audio",
    category: "Electronics",
    query: "Headphones",
    icon: Headphones,
    iconColor: "text-blue-600 bg-blue-50",
  },
  {
    id: "need-gaming",
    title: "For Gaming & Setup",
    category: "Computers & Gaming",
    query: "Keyboard",
    icon: Gamepad2,
    iconColor: "text-purple-600 bg-purple-50",
  },
  {
    id: "need-home",
    title: "For Home & Kitchen",
    category: "Home Appliances",
    query: "Iron",
    icon: Home,
    iconColor: "text-emerald-600 bg-emerald-50",
  },
  {
    id: "need-gifts",
    title: "For Gifts & Gadgets",
    category: "Fashion",
    query: "Watch",
    icon: Gift,
    iconColor: "text-rose-600 bg-rose-50",
  },
  {
    id: "need-phone",
    title: "For Your Phone",
    category: "Mobiles & Wearables",
    query: "Smartphone",
    icon: Smartphone,
    iconColor: "text-cyan-600 bg-cyan-50",
  },
  {
    id: "need-fitness",
    title: "For Fitness & Sports",
    category: "Fashion",
    query: "Shoes",
    icon: Dumbbell,
    iconColor: "text-amber-600 bg-amber-50",
  },
  {
    id: "need-work",
    title: "For Work & Calls",
    category: "Computers & Gaming",
    query: "Webcam",
    icon: Laptop,
    iconColor: "text-indigo-600 bg-indigo-50",
  },
  {
    id: "need-kids",
    title: "For Kids & Fun",
    category: "Toys & Stress Relief",
    query: "Toy",
    icon: Baby,
    iconColor: "text-pink-600 bg-pink-50",
  },
];

export default function ShopByNeedSection({ onSelectNeed }: ShopByNeedSectionProps) {
  return (
    <section className="px-3 sm:px-6 lg:px-8 py-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            What are you looking for?
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Explore products curated by practical everyday use
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-3">
        {NEED_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectNeed(item.category, item.query)}
              className="flex flex-col items-center justify-center p-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-cyan-300 rounded-xl transition-all text-center group cursor-pointer shadow-sm"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 ${item.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-800 group-hover:text-cyan-700 leading-tight">
                {item.title}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
