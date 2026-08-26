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
  MapPin,
  ArrowRight,
  CheckCircle2,
  Lock,
  CreditCard,
  Smartphone,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface FooterProps {
  onOpenTracking?: () => void;
  onOpenAuth?: () => void;
  onSelectCategory?: (category: string) => void;
}

export default function Footer({ onOpenTracking, onOpenAuth, onSelectCategory }: FooterProps) {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setIsSubscribed(true);
      setNewsletterEmail("");
      setTimeout(() => setIsSubscribed(false), 5000);
    }
  };

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900/80 font-sans text-xs relative overflow-hidden">
      {/* Top Value Proposition Trust Bar */}
      <div className="border-b border-slate-900 bg-slate-900/40 backdrop-blur px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="flex items-center space-x-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-xs sm:text-sm">100% Genuine Products</p>
              <p className="text-[11px] text-slate-400">Direct from certified brands & verified sellers</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 group-hover:scale-105 transition-transform">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-xs sm:text-sm">Free Express Shipping</p>
              <p className="text-[11px] text-slate-400">Fast delivery on all orders above ₹499</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0 group-hover:scale-105 transition-transform">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-xs sm:text-sm">7-Day Easy Returns</p>
              <p className="text-[11px] text-slate-400">Hassle-free replacement & instant refunds</p>
            </div>
          </div>

          <div className="flex items-center space-x-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0 group-hover:scale-105 transition-transform">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-xs sm:text-sm">24/7 Dedicated Support</p>
              <p className="text-[11px] text-slate-400">Expert help via live chat, call & email</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Multi-Column Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 mb-12">
          {/* Column 1: Brand & Contact (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <TechAiLogo size="md" />
            <p className="text-slate-300 text-xs leading-relaxed max-w-sm">
              TECH AI is your premier smart electronics destination for genuine audio gadgets, intelligent wearables, high-performance computing, smart home appliances, and next-gen tech essentials.
            </p>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center space-x-2.5 text-slate-300">
                <Phone className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Helpline: <strong className="text-white">+91 1800-889-TECH</strong> (Toll Free)</span>
              </div>
              <div className="flex items-center space-x-2.5 text-slate-300">
                <Mail className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>Support: <a href="mailto:support@techai.store" className="text-cyan-400 hover:underline">support@techai.store</a></span>
              </div>
              <div className="flex items-start space-x-2.5 text-slate-400 text-[11px] pt-1">
                <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                <span>TECH AI Retail India Pvt. Ltd., Outer Ring Road, Tech Corridor, Bengaluru, Karnataka - 560103</span>
              </div>
            </div>
          </div>

          {/* Column 2: Categories (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">
              Shop Categories
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory?.("Electronics")}
                  className="hover:text-cyan-400 transition-colors text-left"
                >
                  Electronics & Audio
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory?.("Mobiles & Wearables")}
                  className="hover:text-cyan-400 transition-colors text-left"
                >
                  Mobiles & Smartwatches
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory?.("Home Appliances")}
                  className="hover:text-cyan-400 transition-colors text-left"
                >
                  Home & Living
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory?.("Computers & Gaming")}
                  className="hover:text-cyan-400 transition-colors text-left"
                >
                  Computers & Gaming
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory?.("Fashion")}
                  className="hover:text-cyan-400 transition-colors text-left"
                >
                  Fashion & Accessories
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectCategory?.("All Categories")}
                  className="text-cyan-400 font-bold hover:underline text-left flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Explore All Deals</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Service (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/orders" className="hover:text-cyan-400 transition-colors">
                  My Orders & Tax Invoices
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenTracking}
                  className="hover:text-cyan-400 transition-colors text-left"
                >
                  Live Order Fulfillment Tracking
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="hover:text-cyan-400 transition-colors text-left"
                >
                  Customer Account / Sign In
                </button>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-amber-400 transition-colors flex items-center gap-1.5 font-bold">
                  <span>⚡ Admin HQ Portal</span>
                </Link>
              </li>
              <li>
                <span className="text-slate-500">Official Brand Warranty Verification</span>
              </li>
              <li>
                <span className="text-slate-500">Shipping & Delivery Guidelines</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter & Payments (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">
              Stay Updated with Tech Offers
            </h4>
            <p className="text-[11px] text-slate-400">
              Subscribe to receive instant discount alerts, exclusive flash deals, and new product drop notifications.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center transition-all flex-shrink-0 shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              {isSubscribed && (
                <p className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Subscribed! Check your inbox for ₹200 discount code.</span>
                </p>
              )}
            </form>

            <div className="pt-2 space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                100% Safe & Secure Payments Supported
              </p>
              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-300">
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg font-bold">
                  UPI (GPay / PhonePe / Paytm)
                </span>
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg font-bold">
                  RuPay / Visa / Mastercard
                </span>
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg font-bold">
                  NetBanking
                </span>
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg font-bold text-amber-300">
                  Cash on Delivery
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal Copyright Row */}
        <div className="border-t border-slate-900/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} TECH AI Retail India Private Limited. All rights reserved.</p>
          <div className="flex flex-wrap items-center space-x-4">
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Return & Refund Policy</span>
            <span>•</span>
            <span className="hover:text-slate-400 cursor-pointer transition-colors">Security Compliance</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
