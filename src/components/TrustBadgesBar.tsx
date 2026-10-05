"use client";

import React from "react";
import { ShieldCheck, Lock, Truck, RefreshCw } from "lucide-react";

export default function TrustBadgesBar() {
  const TRUST_ITEMS = [
    {
      icon: ShieldCheck,
      title: "Product Details",
      desc: "Compare specifications before you buy",
    },
    {
      icon: Lock,
      title: "Secure Payments",
      desc: "UPI, cards and netbanking via Razorpay",
    },
    {
      icon: Truck,
      title: "Order Tracking",
      desc: "Follow order updates from your account",
    },
    {
      icon: RefreshCw,
      title: "Order Support",
      desc: "Manage return requests from your orders",
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
                  <h3 className="font-bold text-slate-900 text-xs">{item.title}</h3>
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
