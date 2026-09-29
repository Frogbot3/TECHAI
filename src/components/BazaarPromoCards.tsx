"use client";

import React, { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Crown, Gem, Gift, KeyRound, Phone, ShoppingBag, Sparkles } from "lucide-react";
import { Product } from "@/lib/types";

interface BazaarPromoCardsProps {
  products?: Product[];
  onExploreCategory: (category: string) => void;
  onSelectPriceRange: (range: string) => void;
}

const fallbackImages = [
  "/generated-products/ai-pulse-earbuds.png",
  "/generated-products/ai-orbit-camera.png",
  "/generated-products/ai-deck-keyboard.png",
];

const tiers = [
  { label: "Under", amount: "₹1,999", range: "0-1999", icon: Gift, tone: "rose" },
  { label: "Under", amount: "₹2,999", range: "0-2999", icon: Gem, tone: "violet" },
  { label: "Premium", amount: "₹2,999+", range: "3000-999999", icon: Crown, tone: "amber" },
] as const;

const tierTone = {
  rose: "bg-[#fff0f3] hover:bg-[#ffe7ed] text-[#163847]",
  violet: "bg-[#f1edff] hover:bg-[#eae4ff] text-[#163847]",
  amber: "bg-[#fff7e8] hover:bg-[#fff0d5] text-[#163847]",
};

export default function BazaarPromoCards({
  products = [],
  onExploreCategory,
  onSelectPriceRange,
}: BazaarPromoCardsProps) {
  const [phone, setPhone] = useState("");
  const [couponClaimed, setCouponClaimed] = useState(false);

  const collageImages = useMemo(() => {
    const productImages = products
      .map((product) => product.image || product.images?.[0])
      .filter(Boolean) as string[];
    return [...fallbackImages, ...productImages].slice(0, 3);
  }, [products]);

  const handleCouponSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phone.trim().length >= 10) setCouponClaimed(true);
  };

  return (
    <section className="space-y-4 px-3 pt-3 sm:px-6 lg:px-8" aria-label="Shopping offers">
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        {tiers.map(({ label, amount, range, icon: Icon, tone }) => (
          <button
            key={amount}
            type="button"
            onClick={() => onSelectPriceRange(range)}
            className={`group flex min-h-[104px] items-center gap-2 rounded-[22px] px-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:min-h-[132px] sm:gap-4 sm:px-5 ${tierTone[tone]}`}
            aria-label={`Browse ${label.toLowerCase()} ${amount}`}
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-[#163847] shadow-sm sm:h-14 sm:w-14">
              <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.8} />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-medium text-slate-600 sm:text-base">{label}</span>
              <span className="block text-lg font-black tracking-tight text-slate-950 sm:text-2xl">{amount}</span>
            </span>
          </button>
        ))}
      </div>

      <article className="relative isolate min-h-[244px] overflow-hidden rounded-[25px] bg-[linear-gradient(110deg,#24103f_0%,#4e1570_58%,#72289e_100%)] px-5 py-6 text-white shadow-lg sm:min-h-[292px] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-5 top-0 h-full w-[58%] opacity-80 [background:radial-gradient(circle_at_55%_42%,rgba(255,202,48,.85),transparent_14%),radial-gradient(circle_at_30%_75%,rgba(255,112,42,.76),transparent_18%)]" />
        <div className="pointer-events-none absolute -right-1 bottom-0 flex w-[54%] items-end justify-center gap-1 sm:gap-3">
          {collageImages.map((image, index) => (
            <img
              key={`${image}-${index}`}
              src={image}
              alt=""
              className={`h-28 w-[31%] object-contain drop-shadow-[0_18px_18px_rgba(16,4,35,.45)] sm:h-40 ${index === 0 ? "-rotate-12" : index === 2 ? "rotate-6" : "-translate-y-2"}`}
              loading="lazy"
            />
          ))}
        </div>
        <div className="relative z-10 max-w-[64%] sm:max-w-[52%]">
          <p className="text-sm font-medium text-fuchsia-100 sm:text-lg">Trending now</p>
          <h2 className="mt-2 text-2xl font-black leading-tight tracking-tight sm:text-4xl">Up to 70% off</h2>
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-fuchsia-100 sm:text-base">Limited-time deals on your favourite tech, fashion, and everyday upgrades.</p>
          <button
            type="button"
            onClick={() => onExploreCategory("All Categories")}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-4 py-2.5 text-sm font-extrabold backdrop-blur-sm transition hover:bg-white/25 sm:px-6 sm:py-3 sm:text-base"
          >
            Shop deals <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <Sparkles className="absolute right-[42%] top-7 h-5 w-5 rotate-12 text-yellow-200/85 sm:right-[39%] sm:h-7 sm:w-7" />
      </article>

      <article className="relative isolate min-h-[270px] overflow-hidden rounded-[25px] bg-[#071924] px-5 py-6 text-white shadow-lg sm:min-h-[260px] sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-7 -bottom-10 h-52 w-[38%] min-w-[142px] rotate-6 rounded-[22px] bg-[#f8f5ed] shadow-2xl sm:right-10 sm:h-72 sm:w-64">
          <div className="absolute left-1/2 top-0 h-12 w-1 -translate-x-1/2 rounded-full bg-slate-900/85 sm:h-16" />
          <div className="absolute left-1/2 top-1 h-14 w-24 -translate-x-1/2 -translate-y-1 rounded-t-[50%] border-[5px] border-b-0 border-slate-900/80 sm:h-24 sm:w-36" />
          <ShoppingBag className="absolute bottom-12 left-1/2 h-14 w-14 -translate-x-1/2 text-slate-300 sm:bottom-16 sm:h-20 sm:w-20" strokeWidth={1.3} />
        </div>
        <div className="relative z-10 max-w-[68%] sm:max-w-[55%]">
          <p className="text-sm text-slate-300 sm:text-lg">New around here?</p>
          <h2 className="mt-2 text-2xl font-black leading-tight tracking-tight sm:text-4xl">Get 5% off your first order.</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-300 sm:text-base">Enter your mobile number to claim your welcome coupon.</p>
          <form onSubmit={handleCouponSubmit} className="mt-5 flex max-w-md items-center rounded-full bg-white p-1 shadow-md sm:mt-6">
            <Phone className="ml-3 h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value.replace(/[^0-9+ ]/g, ""));
                setCouponClaimed(false);
              }}
              placeholder={couponClaimed ? "Coupon claimed — happy shopping" : "Your mobile number"}
              className="min-w-0 flex-1 bg-transparent px-2.5 py-3 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 sm:text-base"
              aria-label="Mobile number"
            />
            <button type="submit" className="rounded-full bg-[#f2c94c] px-3 py-2 text-xs font-black text-slate-950 transition hover:bg-[#ffd866] sm:px-4 sm:text-sm">
              {couponClaimed ? "Claimed" : "Claim"}
            </button>
          </form>
        </div>
      </article>

      <article className="relative overflow-hidden rounded-[25px] bg-[#edf8f2] px-5 py-6 text-[#163847] shadow-sm sm:min-h-[220px] sm:px-8 sm:py-7">
        <div className="relative z-10 max-w-[64%] sm:max-w-[52%]">
          <p className="text-sm text-slate-600 sm:text-lg">Sell with ease</p>
          <h2 className="mt-2 text-2xl font-black leading-tight tracking-tight sm:text-4xl">Turn your products into income.</h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-base">List in minutes, reach more shoppers, and grow your store with TechAI.</p>
          <button
            type="button"
            onClick={() => onExploreCategory("All Categories")}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#163847] px-4 py-2.5 text-sm font-extrabold text-white transition hover:bg-[#22586a] sm:px-6 sm:py-3 sm:text-base"
          >
            Start selling <ArrowRight className="h-4 w-4" />
          </button>
        </div>
        <div className="absolute -right-2 bottom-0 h-44 w-[42%] sm:right-8 sm:h-56 sm:w-[35%]">
          <div className="absolute bottom-0 right-0 h-36 w-28 rounded-[20px] border-[5px] border-slate-700 bg-white shadow-xl sm:h-48 sm:w-36">
            <div className="m-2 grid grid-cols-2 gap-1.5 sm:m-3 sm:gap-2">
              <span className="h-12 rounded-lg bg-[#f2e9db] sm:h-16" />
              <span className="h-12 rounded-lg bg-[#d9eee3] sm:h-16" />
              <span className="h-12 rounded-lg bg-[#dce8f6] sm:h-16" />
              <span className="h-12 rounded-lg bg-[#f2d5dc] sm:h-16" />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 h-28 w-20 rounded-t-[50%] bg-[#bcdcae]/75 blur-[1px] sm:h-36 sm:w-24" />
        </div>
        <KeyRound className="absolute right-[35%] top-6 h-5 w-5 rotate-12 text-[#91c79d] sm:right-[33%] sm:h-7 sm:w-7" />
      </article>
    </section>
  );
}
