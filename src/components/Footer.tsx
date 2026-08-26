"use client";

import React, { useState } from "react";
import Link from "next/link";
import TechAiLogo from "./TechAiLogo";
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Mail,
  Phone,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

interface FooterProps {
  onOpenTracking?: () => void;
  onOpenAuth?: () => void;
  onSelectCategory?: (category: string) => void;
}

export default function Footer({ onOpenTracking, onOpenAuth, onSelectCategory }: FooterProps) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-300 font-sans text-xs border-t border-slate-800 mt-12">
      {/* 4-Pillar Trust Highlights */}
      <div className="border-b border-slate-800/80 bg-slate-950/40 px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400 flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">100% Genuine Products</p>
              <p className="text-[11px] text-slate-400">Direct from certified brands</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">Free Express Delivery</p>
              <p className="text-[11px] text-slate-400">On all orders above ₹499</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-purple-400 flex-shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">7-Day Easy Returns</p>
              <p className="text-[11px] text-slate-400">Hassle-free replacement policy</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-white text-xs">24/7 Dedicated Support</p>
              <p className="text-[11px] text-slate-400">Helpline: 1800-889-TECH</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Col 1: Brand & Helpline (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-3">
            <TechAiLogo size="md" />
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              TECH AI is your trusted e-commerce destination for genuine electronics, smart wearables, gaming gear, home appliances, and daily essentials.
            </p>
            <div className="space-y-1.5 pt-1 text-xs text-slate-300">
              <p className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Toll-Free Helpline: <strong className="text-white">1800-889-TECH</strong></span>
              </p>
              <p className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Support: <a href="mailto:support@techai.store" className="text-cyan-400 hover:underline">support@techai.store</a></span>
              </p>
            </div>
          </div>

          {/* Col 2: Shop Categories */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Categories</h3>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory?.("Electronics")}
                  className="hover:text-white transition cursor-pointer text-left"
                >
                  Electronics & Audio
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory?.("Mobiles & Wearables")}
                  className="hover:text-white transition cursor-pointer text-left"
                >
                  Mobiles & Smartwatches
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory?.("Home Appliances")}
                  className="hover:text-white transition cursor-pointer text-left"
                >
                  Home & Living
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory?.("Computers & Gaming")}
                  className="hover:text-white transition cursor-pointer text-left"
                >
                  Computers & Gaming
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory?.("Fashion")}
                  className="hover:text-white transition cursor-pointer text-left"
                >
                  Fashion & Lifestyle
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Customer Service */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Customer Care</h3>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li>
                <Link href="/orders" className="hover:text-white transition">
                  My Orders & Invoices
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenTracking}
                  className="hover:text-white transition cursor-pointer text-left"
                >
                  Track Your Package
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="hover:text-white transition cursor-pointer text-left"
                >
                  Account Login
                </button>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-amber-400 transition font-semibold">
                  Admin Portal
                </Link>
              </li>
              <li>
                <span className="text-slate-500">Official Brand Warranty</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Newsletter & Payments */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Stay Updated</h3>
            <p className="text-[11px] text-slate-400">
              Get price drop alerts and new product launch deals.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-1.5">
              <div className="flex gap-1.5">
                <input
                  type="email"
                  required
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-100 hover:bg-white text-slate-950 font-bold rounded-lg text-xs transition cursor-pointer flex-shrink-0"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {subscribed && (
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> Subscribed successfully!
                </p>
              )}
            </form>

            <div className="pt-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payment Modes</p>
              <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-300">
                <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded">UPI</span>
                <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded">Cards</span>
                <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded">NetBanking</span>
                <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded">COD</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal & Copyright Row */}
        <div className="border-t border-slate-800/80 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} TECH AI Retail India Private Limited. All rights reserved.</p>
          <div className="flex flex-wrap items-center space-x-4">
            <span className="hover:text-slate-400 cursor-pointer transition">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer transition">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer transition">Return Policy</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer transition">Security Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
