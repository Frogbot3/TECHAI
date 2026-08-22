"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, Check, Search, Navigation } from "lucide-react";

interface LocationModalProps {
  isOpen: boolean;
  currentLocation: string;
  onClose: () => void;
  onSelectLocation: (loc: string) => void;
}

const POPULAR_LOCATIONS = [
  { city: "Dubai", country: "United Arab Emirates", code: "DXB" },
  { city: "Abu Dhabi", country: "United Arab Emirates", code: "AUH" },
  { city: "Sharjah", country: "United Arab Emirates", code: "SHJ" },
  { city: "Mumbai", country: "India", code: "BOM" },
  { city: "Delhi NCR", country: "India", code: "DEL" },
  { city: "Bengaluru", country: "India", code: "BLR" },
  { city: "Hyderabad", country: "India", code: "HYD" },
  { city: "Riyadh", country: "Saudi Arabia", code: "RUH" },
  { city: "London", country: "United Kingdom", code: "LON" },
  { city: "New York", country: "United States", code: "NYC" },
];

export default function LocationModal({
  isOpen,
  currentLocation,
  onSelectLocation,
  onClose,
}: LocationModalProps) {
  const [pincodeInput, setPincodeInput] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  if (!isOpen) return null;

  const handleApplyPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincodeInput.trim()) {
      onSelectLocation(`Delivery to ${pincodeInput.trim()}`);
      onClose();
    }
  };

  const filteredLocations = POPULAR_LOCATIONS.filter(
    (loc) =>
      loc.city.toLowerCase().includes(searchFilter.toLowerCase()) ||
      loc.country.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-2xl bg-cyan-100/80 text-cyan-700 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Choose Delivery Location</h3>
                <p className="text-xs text-slate-500">Delivery options & speeds may vary for different locations</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            {/* Pincode Input Form */}
            <form onSubmit={handleApplyPincode} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Pincode or Postal Code"
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-cyan-600 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Apply
              </button>
            </form>

            {/* Quick Detect Button */}
            <button
              type="button"
              onClick={() => {
                onSelectLocation("Current Location (Express)");
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-cyan-200 bg-cyan-50/50 hover:bg-cyan-100/60 text-cyan-800 text-xs font-bold transition-colors"
            >
              <Navigation className="w-4 h-4 text-cyan-600" />
              <span>Use Current Location (Auto Detect)</span>
            </button>

            {/* Search Filter */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search city or country..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Popular Locations List */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Popular Delivery Hubs
              </p>
              <div className="max-h-48 overflow-y-auto no-scrollbar space-y-1.5 pr-1">
                {filteredLocations.map((loc) => {
                  const label = `Delivering to ${loc.city}`;
                  const isSelected = currentLocation.toLowerCase().includes(loc.city.toLowerCase());

                  return (
                    <button
                      key={loc.city}
                      onClick={() => {
                        onSelectLocation(`Delivering to ${loc.city}`);
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all ${
                        isSelected
                          ? "bg-slate-900 text-white font-bold"
                          : "hover:bg-slate-100 text-slate-700 bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <MapPin className={`w-4 h-4 ${isSelected ? "text-cyan-400" : "text-slate-400"}`} />
                        <div>
                          <p className="font-bold">{loc.city}</p>
                          <p className={`text-[10px] ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                            {loc.country}
                          </p>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
