"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import TechAiLogo from "@/components/TechAiLogo";
import { useTechAiStore } from "@/lib/store";
import OrderTrackingModal from "@/components/OrderTrackingModal";
import { Search, Package, Truck, CheckCircle2, Clock, MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function OrdersPage() {
  const store = useTechAiStore();
  const [searchId, setSearchId] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <Navbar
        cartCount={store.cart.reduce((sum, i) => sum + i.quantity, 0)}
        wishlistCount={store.wishlist.length}
        user={store.user}
        searchQuery=""
        setSearchQuery={() => {}}
        selectedCategory="All Categories"
        setSelectedCategory={() => {}}
        onOpenCart={() => {}}
        onOpenAuth={() => {}}
        onOpenTracking={() => setIsModalOpen(true)}
        onLogout={store.logoutUser}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex items-center space-x-2">
          <Link href="/" className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center space-x-1">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Storefront</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-slate-900">Track Your TECH AI Order</h1>
            <p className="text-xs text-slate-500">
              Enter your Order ID (e.g., TECHAI-ORD-98412) or phone number to view live courier status.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-4 bg-slate-900 hover:bg-cyan-600 text-white font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md"
          >
            <Truck className="w-5 h-5 text-cyan-400" />
            <span>Launch Live Shipment Tracker</span>
          </button>
        </div>
      </main>

      <OrderTrackingModal
        isOpen={isModalOpen}
        orders={store.orders}
        initialOrderId={searchId}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
