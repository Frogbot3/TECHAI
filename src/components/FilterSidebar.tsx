"use client";

import React from "react";
import { Filter, Star, X, Check, RotateCcw } from "lucide-react";
import { Product } from "@/lib/types";

interface FilterSidebarProps {
  products: Product[];
  selectedBrands: string[];
  selectedPriceRange: string | null;
  minRating: number | null;
  inStockOnly: boolean;
  minDiscount: number | null;
  onToggleBrand: (brand: string) => void;
  onSelectPriceRange: (range: string | null) => void;
  onSelectMinRating: (rating: number | null) => void;
  onToggleInStock: () => void;
  onSelectMinDiscount: (discount: number | null) => void;
  onResetFilters: () => void;
}

const PRICE_RANGES = [
  { label: "Under ₹1,000", value: "0-1000" },
  { label: "₹1,000 - ₹2,500", value: "1000-2500" },
  { label: "₹2,500 - ₹5,000", value: "2500-5000" },
  { label: "₹5,000 - ₹15,000", value: "5000-15000" },
  { label: "Above ₹15,000", value: "15000-999999" },
];

export default function FilterSidebar({
  products,
  selectedBrands,
  selectedPriceRange,
  minRating,
  inStockOnly,
  minDiscount,
  onToggleBrand,
  onSelectPriceRange,
  onSelectMinRating,
  onToggleInStock,
  onSelectMinDiscount,
  onResetFilters,
}: FilterSidebarProps) {
  // Get all unique brands available in the product list
  const availableBrands = Array.from(new Set(products.map((p) => p.brand))).filter(Boolean);

  const hasActiveFilters =
    selectedBrands.length > 0 ||
    selectedPriceRange !== null ||
    minRating !== null ||
    inStockOnly ||
    minDiscount !== null;

  return (
    <aside className="w-full bg-white rounded-xl border border-slate-200 p-4 space-y-5 text-xs text-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-1.5 font-bold text-slate-900 text-sm">
          <Filter className="w-4 h-4 text-cyan-700" />
          <span>Filters</span>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Availability */}
      <div>
        <h4 className="font-bold text-slate-900 mb-2">Availability</h4>
        <label className="flex items-center space-x-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={onToggleInStock}
            className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 cursor-pointer"
          />
          <span className="font-medium text-slate-700">In Stock Only</span>
        </label>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="font-bold text-slate-900 mb-2">Price</h4>
        <div className="space-y-1.5">
          {PRICE_RANGES.map((range) => {
            const isSelected = selectedPriceRange === range.value;
            return (
              <button
                key={range.value}
                type="button"
                onClick={() => onSelectPriceRange(isSelected ? null : range.value)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-between ${
                  isSelected ? "bg-cyan-50 text-cyan-800 font-bold" : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span>{range.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-cyan-700" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Brands */}
      {availableBrands.length > 0 && (
        <div>
          <h4 className="font-bold text-slate-900 mb-2">Brand</h4>
          <div className="space-y-1 max-h-44 overflow-y-auto no-scrollbar">
            {availableBrands.map((brand) => {
              const isChecked = selectedBrands.includes(brand);
              return (
                <label
                  key={brand}
                  className="flex items-center space-x-2 py-1 px-1 rounded hover:bg-slate-50 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleBrand(brand)}
                    className="w-3.5 h-3.5 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 cursor-pointer"
                  />
                  <span className="font-medium text-slate-700 truncate">{brand}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer Rating */}
      <div>
        <h4 className="font-bold text-slate-900 mb-2">Customer Rating</h4>
        <div className="space-y-1">
          {[4, 3, 2].map((r) => {
            const isSelected = minRating === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => onSelectMinRating(isSelected ? null : r)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                  isSelected ? "bg-cyan-50 text-cyan-800 font-bold" : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <div className="flex items-center space-x-1">
                  <div className="flex items-center text-amber-500">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  </div>
                  <span>{r}★ & above</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-cyan-700" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Discount */}
      <div>
        <h4 className="font-bold text-slate-900 mb-2">Discount</h4>
        <div className="space-y-1">
          {[50, 30, 20].map((d) => {
            const isSelected = minDiscount === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => onSelectMinDiscount(isSelected ? null : d)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                  isSelected ? "bg-cyan-50 text-cyan-800 font-bold" : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span>{d}% off or more</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-cyan-700" />}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
