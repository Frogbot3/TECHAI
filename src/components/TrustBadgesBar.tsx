"use client";

import React from "react";
import { ShieldCheck, Lock, Truck, RefreshCw, Headphones, CheckCircle2 } from "lucide-react";

export default function TrustBadgesBar() {
  const TRUST_ITEMS = [
    {
      icon: ShieldCheck,
      title: "100% Genuine Products",
      desc: "Direct brand sourcing with authentic warranties",
    },
    {
      icon: Lock,
      title: "Secure Payments",
      desc: "256-bit encrypted checkout via UPI & Cards",
    },
    {
      icon: Truck,
      title: "Fast Doorstep Delivery",
      desc: "Express dispatch with live order tracking",
    },
    {
      icon: RefreshCw,
      title: "7-Day Easy Replacement",
      desc: "Hassle-free support for damaged or missing items",
    },
  ];

  return (
    <section className="px-3 sm:px-6 lg:px-8 py-6">
      <div className="rounded-xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TRUST_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-start space-x-3">
                <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-cyan-700" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">{item.title}</h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-snug">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
