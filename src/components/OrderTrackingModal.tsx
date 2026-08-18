"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Order, OrderStatus } from "@/lib/types";
import { generateOrderInvoice } from "@/lib/generateInvoice";
import {
  X,
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  ChevronRight,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  PhoneCall,
  Sparkles,
  ArrowRight,
  FileText,
  MessageSquare,
  Navigation,
  RefreshCw
} from "lucide-react";

interface OrderTrackingModalProps {
  isOpen: boolean;
  orders: Order[];
  initialOrderId?: string;
  onClose: () => void;
  onOpenInvoice?: (order: Order) => void;
  onWriteReview?: (product: any) => void;
}

const STAGES: { status: OrderStatus; label: string; sub: string; stepNum: number }[] = [
  { status: "Placed", label: "Order Confirmed", sub: "Payment verified & order acknowledged", stepNum: 1 },
  { status: "Processing", label: "Packed & Ready", sub: "Processed at TECH AI fulfillment hub", stepNum: 2 },
  { status: "Shipped", label: "In Transit", sub: "Dispatched with express air cargo", stepNum: 3 },
  { status: "Out for Delivery", label: "Out for Delivery", sub: "With courier partner in your city", stepNum: 4 },
  { status: "Delivered", label: "Delivered", sub: "Package handed over safely", stepNum: 5 },
];

export default function OrderTrackingModal({
  isOpen,
  orders,
  initialOrderId,
  onClose,
  onOpenInvoice,
  onWriteReview,
}: OrderTrackingModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    if (initialOrderId && orders.length > 0) {
      const match = orders.find((o) => o.id === initialOrderId || o.trackingNumber === initialOrderId);
      if (match) setSelectedOrder(match);
      else setSelectedOrder(orders[0]);
    } else if (orders.length > 0) {
      setSelectedOrder(orders[0]);
    }
  }, [initialOrderId, orders, isOpen]);

  if (!isOpen) return null;

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");
    if (!searchQuery.trim()) return;

    // Search local store orders first
    const match = orders.find(
      (o) =>
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.shippingAddress.phone.includes(searchQuery)
    );

    if (match) {
      setSelectedOrder(match);
      return;
    }

    // Search MongoDB API directly
    setIsSearchingApi(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(searchQuery.trim())}`);
      const data = await res.json();
      if (data.success && data.order) {
        setSelectedOrder(data.order);
      } else {
        setSearchError("No active shipment found matching that Order ID or Phone.");
      }
    } catch {
      setSearchError("Unable to search tracking at the moment.");
    } finally {
      setIsSearchingApi(false);
    }
  };

  const copyTrackingNumber = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const getStageIndex = (status: OrderStatus) => {
    switch (status) {
      case "Placed": return 0;
      case "Processing": return 1;
      case "Shipped": return 2;
      case "Out for Delivery": return 3;
      case "Delivered": return 4;
      default: return 0;
    }
  };

  const currentStageIndex = selectedOrder ? getStageIndex(selectedOrder.status) : 0;
  const progressPercent = (currentStageIndex / (STAGES.length - 1)) * 100;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto selection:bg-cyan-500 selection:text-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 relative my-auto flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  <span>Live Courier & Order Tracking</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full border border-cyan-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>Real-Time GPS Sync</span>
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Real-time transit updates and delivery milestones</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 sm:p-7 overflow-y-auto flex-1 text-xs space-y-6">
            {/* Search order bar */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter Order ID (e.g. TECHAI-ORD-98212) or 10-digit Phone..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingApi}
                className="px-5 py-2.5 bg-slate-900 hover:bg-cyan-600 text-white font-extrabold rounded-2xl text-xs flex items-center gap-1.5 transition-all shadow-md"
              >
                {isSearchingApi ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5 text-cyan-400" />}
                <span>Track</span>
              </button>
            </form>

            {searchError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl">
                {searchError}
              </div>
            )}

            {selectedOrder ? (
              <div className="space-y-6">
                {/* Order Summary & Status Overview Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 sm:p-6 rounded-3xl shadow-xl relative overflow-hidden space-y-4">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400 font-bold">
                        Shipment Overview
                      </span>
                      <h4 className="text-lg sm:text-xl font-black text-white flex items-center gap-2 mt-0.5">
                        <span>Order #{selectedOrder.id}</span>
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        Placed on {new Date(selectedOrder.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => copyTrackingNumber(selectedOrder.trackingNumber)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border border-slate-700 transition"
                      >
                        {copiedTracking ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                        <span>AWB: {selectedOrder.trackingNumber}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (onOpenInvoice) onOpenInvoice(selectedOrder);
                          else generateOrderInvoice(selectedOrder);
                        }}
                        className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Tax Invoice</span>
                      </button>
                    </div>
                  </div>

                  {/* Delivery ETA banner */}
                  <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 relative z-10 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Estimated Delivery Date</p>
                        <p className="font-extrabold text-white text-xs sm:text-sm">
                          {selectedOrder.estimatedDelivery || "Expected in 2-3 Business Days"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right sm:text-right">
                      <span className="text-[10px] text-slate-400 block">Courier Partner</span>
                      <span className="font-bold text-cyan-300">{selectedOrder.courierName || "Tech AI Express Logistics"}</span>
                    </div>
                  </div>
                </div>

                {/* ANIMATED PROGRESS TRACKING STEPPER */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 sm:p-7 space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Truck className="w-4 h-4 text-cyan-600" />
                      <span>Live Journey Timeline</span>
                    </h4>
                    <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2.5 py-0.5 rounded-full border border-cyan-200">
                      Status: {selectedOrder.status}
                    </span>
                  </div>

                  {/* Desktop Progress Bar with animated truck */}
                  <div className="relative pt-8 pb-4">
                    {/* Background track */}
                    <div className="absolute top-11 left-4 right-4 h-2 bg-slate-200 rounded-full" />

                    {/* Active Animated Fill Line */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="absolute top-11 left-4 h-2 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                    />

                    {/* Animated Moving Truck Indicator */}
                    <motion.div
                      initial={{ left: "0%" }}
                      animate={{ left: `calc(${progressPercent}% + 4px)` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="absolute top-3 -translate-x-1/2 z-20 hidden sm:flex flex-col items-center"
                    >
                      <div className="bg-slate-950 text-cyan-300 p-2 rounded-xl shadow-lg border border-cyan-400 flex items-center justify-center animate-bounce">
                        <Truck className="w-4 h-4" />
                      </div>
                    </motion.div>

                    {/* Stage milestone nodes */}
                    <div className="relative z-10 flex items-center justify-between">
                      {STAGES.map((stage, idx) => {
                        const isDone = idx <= currentStageIndex;
                        const isCurrent = idx === currentStageIndex;
                        return (
                          <div key={stage.status} className="flex flex-col items-center text-center max-w-[90px]">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                isDone
                                  ? "bg-slate-950 text-cyan-400 ring-4 ring-cyan-500/20 shadow-md"
                                  : "bg-white border-2 border-slate-300 text-slate-400"
                              }`}
                            >
                              {isDone ? <Check className="w-4 h-4" /> : stage.stepNum}
                            </div>
                            <span
                              className={`text-[11px] font-black mt-2 leading-tight ${
                                isCurrent
                                  ? "text-cyan-700"
                                  : isDone
                                  ? "text-slate-900"
                                  : "text-slate-400"
                              }`}
                            >
                              {stage.label}
                            </span>
                            <span className="text-[9px] text-slate-500 mt-0.5 hidden sm:block">
                              {stage.sub}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Real-Time Activity Logs */}
                  <div className="pt-4 border-t border-slate-200 space-y-2.5">
                    <span className="text-[11px] font-extrabold text-slate-800 uppercase tracking-wider block">
                      Live Transit Activity Logs
                    </span>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3 bg-white p-3 rounded-2xl border border-slate-200 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0 animate-ping" />
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">
                            {selectedOrder.status === "Delivered"
                              ? "Package safely delivered to recipient."
                              : selectedOrder.status === "Out for Delivery"
                              ? "Out for courier delivery. Delivery executive is on the way."
                              : selectedOrder.status === "Shipped"
                              ? "Shipment departed from central hub. In transit."
                              : "Order placed & verified by merchant."}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Destination: {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} • Hub ID: BLR-DC-04
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">Today</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items in this order */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Purchased Items ({selectedOrder.items.length})
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedOrder.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.product.image}
                            alt={item.product.title}
                            className="w-12 h-12 object-contain bg-slate-50 rounded-xl p-1 border border-slate-100 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <h5 className="font-bold text-slate-900 truncate text-xs">{item.product.title}</h5>
                            <p className="text-[11px] text-slate-500">
                              Qty: {item.quantity} × ₹{item.product.price.toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>

                        {onWriteReview && (
                          <button
                            onClick={() => onWriteReview(item.product)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-cyan-50 hover:text-cyan-700 text-slate-700 rounded-xl text-[11px] font-extrabold flex items-center gap-1 transition-colors flex-shrink-0"
                          >
                            <MessageSquare className="w-3 h-3 text-cyan-600" />
                            <span>Review</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">No Orders Found</h4>
                <p className="text-xs text-slate-500">Enter an Order ID above to track any live order shipment.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
