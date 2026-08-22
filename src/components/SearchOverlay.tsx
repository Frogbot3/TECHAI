"use client";

import React, { useState, useEffect } from "react";
import { Search, Clock, TrendingUp, X, ArrowRight, Sparkles } from "lucide-react";
import { Product } from "@/lib/types";

interface SearchOverlayProps {
  isOpen: boolean;
  query: string;
  products: Product[];
  onSelectQuery: (q: string) => void;
  onSelectProduct: (product: Product) => void;
  onClose: () => void;
}

const POPULAR_SEARCHES = [
  "Wireless Earbuds",
  "Noise Smartwatch",
  "Running Shoes",
  "Titan Watch",
  "Steam Iron",
  "Electric Kettle",
  "Mechanical Keyboard",
  "Toor Dal",
];

const STORAGE_KEY = "techai_recent_searches_v1";

export default function SearchOverlay({
  isOpen,
  query,
  products,
  onSelectQuery,
  onSelectProduct,
  onClose,
}: SearchOverlayProps) {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const cleanQuery = query.trim().toLowerCase();

  // Find matching brands
  const matchedBrands = Array.from(
    new Set(
      products
        .filter((p) => p.brand.toLowerCase().includes(cleanQuery))
        .map((p) => p.brand)
    )
  ).slice(0, 4);

  // Find matching categories
  const matchedCategories = Array.from(
    new Set(
      products
        .filter((p) => p.category.toLowerCase().includes(cleanQuery))
        .map((p) => p.category)
    )
  ).slice(0, 3);

  // Find matching products
  const matchedProducts = products
    .filter(
      (p) =>
        p.title.toLowerCase().includes(cleanQuery) ||
        p.brand.toLowerCase().includes(cleanQuery) ||
        p.category.toLowerCase().includes(cleanQuery)
    )
    .slice(0, 5);

  const handleQueryClick = (term: string) => {
    saveRecentSearch(term);
    onSelectQuery(term);
    onClose();
  };

  const handleProductClick = (product: Product) => {
    saveRecentSearch(product.title);
    onSelectProduct(product);
    onClose();
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden text-slate-900 max-h-[80vh] overflow-y-auto">
      {cleanQuery.length === 0 ? (
        /* Empty State: Recent & Popular Searches */
        <div className="p-4 space-y-4 text-xs">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="font-bold text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Recent Searches</span>
                </span>
                <button
                  type="button"
                  onClick={clearRecentSearches}
                  className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleQueryClick(term)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium transition-colors"
                  >
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches */}
          <div>
            <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-100 font-bold text-slate-500">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-600" />
              <span>Trending & Popular</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SEARCHES.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleQueryClick(term)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-cyan-400 hover:bg-cyan-50/50 text-slate-700 font-medium transition-colors flex items-center gap-1"
                >
                  <Search className="w-3 h-3 text-slate-400" />
                  <span>{term}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Populated Search Results */
        <div className="p-3 space-y-3 text-xs">
          {/* Quick Categories & Brands Suggestions */}
          {(matchedCategories.length > 0 || matchedBrands.length > 0) && (
            <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-100">
              {matchedCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleQueryClick(cat)}
                  className="px-2.5 py-1 rounded-md bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold text-[11px] flex items-center gap-1"
                >
                  <span>In Category:</span>
                  <span className="underline">{cat}</span>
                </button>
              ))}
              {matchedBrands.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => handleQueryClick(brand)}
                  className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center gap-1"
                >
                  <span>Brand:</span>
                  <span>{brand}</span>
                </button>
              ))}
            </div>
          )}

          {/* Product Items List */}
          {matchedProducts.length > 0 ? (
            <div className="space-y-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Products
              </p>
              {matchedProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => handleProductClick(prod)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <img
                      src={prod.image}
                      alt={prod.title}
                      className="w-10 h-10 object-contain rounded-lg bg-slate-100 p-1 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate group-hover:text-cyan-700">
                        {prod.title}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">{prod.brand} • {prod.category}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 pl-3">
                    <p className="font-bold text-slate-950">₹{prod.price.toLocaleString("en-IN")}</p>
                    {prod.originalPrice > prod.price && (
                      <p className="text-[10px] text-emerald-600 font-bold">{prod.discountPercent}% off</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-slate-500">
              <p className="font-medium">No products matching "{query}"</p>
              <button
                type="button"
                onClick={() => handleQueryClick(query)}
                className="mt-2 text-cyan-600 font-bold hover:underline"
              >
                Search all catalog for "{query}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
