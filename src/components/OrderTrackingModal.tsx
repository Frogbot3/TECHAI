"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Order, OrderStatus } from "@/lib/types";
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
  ArrowRight
} from "lucide-react";

interface OrderTrackingModalProps {
  isOpen: boolean;
  orders: Order[];
  initialOrderId?: string;
  onClose: () => void;
}

const STAGES: { status: OrderStatus; label: string; icon: string }[] = [
  { status: "Placed", label: "Order Placed", icon: "1" },
  { status: "Processing", label: "Processing & Packed", icon: "2" },
  { status: "Shipped", label: "Shipped in Transit", icon: "3" },
  { status: "Out for Delivery", label: "Out for Delivery", icon: "4" },
  { status: "Delivered", label: "Delivered", icon: "5" },
];

export default function OrderTrackingModal({
  isOpen,
  orders,
  initialOrderId,
  onClose,
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
        setSearchError("No order found matching that ID or phone number.");
      }
    } catch {
      setSearchError("Error searching order tracking.");
    } finally {
      setIsSearchingApi(false);
    }
  };

  const copyTrackingNumber = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handlePrintInvoice = () => {
    window.print();
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
  const progressPercent = Math.min(100, Math.max(10, (currentStageIndex / 4) * 100));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto selection:bg-cyan-500 selection:text-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 relative my-auto flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                  <span>TECH AI Live Order Tracking</span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
                    Live GPS Sync
                  </span>
                </h3>
                <p className="text-xs text-slate-400">Real-time status updates and delivery tracking</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
            {/* Search Bar & Order Selector */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter Order ID (e.g. TECHAI-ORD-123456) or Phone..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearchingApi}
                  className="px-4 py-2 bg-slate-900 hover:bg-cyan-600 text-white font-extrabold rounded-xl text-xs transition disabled:opacity-50 flex items-center space-x-1"
                >
                  <span>{isSearchingApi ? "Searching..." : "Track Order"}</span>
                </button>
              </form>

              {orders.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Your Orders:</span>
                  <select
                    value={selectedOrder?.id || ""}
                    onChange={(e) => {
                      const match = orders.find((o) => o.id === e.target.value);
                      if (match) setSelectedOrder(match);
                    }}
                    className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    {orders.map((ord) => (
                      <option key={ord.id} value={ord.id}>
                        {ord.id} ({ord.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {searchError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl">
                {searchError}
              </div>
            )}

            {selectedOrder ? (
              <div className="space-y-6">
                {/* Order Summary Overview Card */}
                <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4 shadow-xl relative overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div className="space-y-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Order Reference</span>
                      <p className="text-xl font-black font-mono text-cyan-400">{selectedOrder.id}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyTrackingNumber(selectedOrder.trackingNumber)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition border border-slate-700"
                      >
                        {copiedTracking ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{selectedOrder.trackingNumber}</span>
                      </button>

                      <button
                        onClick={handlePrintInvoice}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-bold transition border border-cyan-500/30"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Invoice</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-[11px] text-slate-400 font-bold uppercase">Estimated Delivery</p>
                      <p className="font-extrabold text-emerald-400 mt-0.5">{selectedOrder.estimatedDelivery}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-bold uppercase">Courier Partner</p>
                      <p className="font-bold text-slate-200 mt-0.5">{selectedOrder.courierName}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-bold uppercase">Payment Status</p>
                      <span className="inline-block mt-0.5 font-bold text-xs text-emerald-400">
                        {selectedOrder.paymentStatus} ({selectedOrder.paymentMethod})
                      </span>
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-400 font-bold uppercase">Total Amount</p>
                      <p className="font-black text-cyan-400 mt-0.5">₹{selectedOrder.finalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Visual 5-Stage Stepper Progress Tracker */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-6">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-cyan-600" />
                    <span>Shipment Progress Tracker</span>
                  </h4>

                  <div className="relative pt-2 pb-4">
                    {/* Background Line */}
                    <div className="absolute top-7 left-4 right-4 h-1 bg-slate-200 -z-0 rounded-full" />
                    {/* Active Progress Fill */}
                    <div
                      className="absolute top-7 left-4 h-1 bg-gradient-to-r from-cyan-500 to-emerald-500 -z-0 rounded-full transition-all duration-700"
                      style={{ width: `${progressPercent}%` }}
                    />

                    <div className="grid grid-cols-5 relative z-10 text-center">
                      {STAGES.map((stg, idx) => {
                        const isDone = idx <= currentStageIndex;
                        const isCurrent = idx === currentStageIndex;
                        return (
                          <div key={stg.status} className="flex flex-col items-center space-y-2">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-xs transition-all shadow-md ${
                                isCurrent
                                  ? "bg-cyan-500 text-slate-950 ring-4 ring-cyan-200 scale-110"
                                  : isDone
                                  ? "bg-emerald-500 text-white"
                                  : "bg-white text-slate-400 border-2 border-slate-200"
                              }`}
                            >
                              {isDone ? <Check className="w-5 h-5" /> : stg.icon}
                            </div>
                            <span
                              className={`text-[11px] font-bold max-w-[80px] leading-tight ${
                                isCurrent ? "text-cyan-700 font-black" : isDone ? "text-slate-900" : "text-slate-400"
                              }`}
                            >
                              {stg.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Timeline History Log & Shipping Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Status History Logs */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
                      Tracking Log History
                    </h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {selectedOrder.statusHistory.map((hist, idx) => (
                        <div key={idx} className="flex items-start space-x-3 text-xs">
                          <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5 flex-shrink-0" />
                          <div className="space-y-0.5">
                            <p className="font-extrabold text-slate-900">{hist.status}</p>
                            <p className="text-slate-600">{hist.note}</p>
                            <p className="text-[10px] text-slate-400">{hist.timestamp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Address & Contact Details */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3 text-xs">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
                      Delivery Address
                    </h4>
                    <div className="space-y-1">
                      <p className="font-extrabold text-slate-900 text-sm">{selectedOrder.shippingAddress.fullName}</p>
                      <p className="text-slate-600 font-bold">Phone: {selectedOrder.shippingAddress.phone}</p>
                      {selectedOrder.shippingAddress.email && (
                        <p className="text-slate-600">Email: {selectedOrder.shippingAddress.email}</p>
                      )}
                      <p className="text-slate-500 pt-1 leading-relaxed">
                        <MapPin className="w-3.5 h-3.5 inline mr-1 text-cyan-600" />
                        {selectedOrder.shippingAddress.street}, {selectedOrder.shippingAddress.city},{" "}
                        {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ordered Products Breakdown */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
                    Ordered Products ({selectedOrder.items.length})
                  </h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-white p-3 rounded-xl border border-slate-200">
                        <div className="flex items-center space-x-3">
                          <img
                            src={item.product.image}
                            alt={item.product.title}
                            className="w-10 h-10 object-contain rounded-lg p-1 bg-slate-50 border border-slate-200 flex-shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{item.product.title}</p>
                            <p className="text-[10px] text-slate-500">{item.product.brand} • Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-extrabold text-slate-900">
                          ₹{(item.product.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Package className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-700">No Order Selected</p>
                <p className="text-xs">Enter your Order ID above or pick an order from your account history.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
