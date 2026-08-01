"use client";

import React, { useState } from "react";
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
  ShieldCheck,
  AlertCircle,
  PhoneCall
} from "lucide-react";

interface OrderTrackingModalProps {
  isOpen: boolean;
  orders: Order[];
  initialOrderId?: string;
  onClose: () => void;
}

const STEPS: { status: OrderStatus; label: string; icon: any }[] = [
  { status: "Placed", label: "Order Placed", icon: Clock },
  { status: "Processing", label: "Processing & Packed", icon: Package },
  { status: "Shipped", label: "Shipped in Transit", icon: Truck },
  { status: "Out for Delivery", label: "Out for Delivery", icon: PhoneCall },
  { status: "Delivered", label: "Delivered", icon: CheckCircle2 }
];

export default function OrderTrackingModal({
  isOpen,
  orders,
  initialOrderId = "",
  onClose
}: OrderTrackingModalProps) {
  const [searchId, setSearchId] = useState(initialOrderId);
  const [activeOrder, setActiveOrder] = useState<Order | null>(
    orders.find((o) => o.id.toLowerCase() === initialOrderId.toLowerCase()) || orders[0] || null
  );

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = orders.find(
      (o) =>
        o.id.toLowerCase() === searchId.trim().toLowerCase() ||
        o.shippingAddress.phone.includes(searchId.trim())
    );
    if (found) {
      setActiveOrder(found);
    } else {
      alert("No matching order found for this Order ID or Phone number.");
    }
  };

  const getStepIndex = (status: OrderStatus) => {
    return STEPS.findIndex((s) => s.status === status);
  };

  const currentStepIdx = activeOrder ? getStepIndex(activeOrder.status) : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 relative my-auto max-h-[90vh] flex flex-col"
        >
          <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Truck className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-extrabold">TECH AI Live Order Tracking</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
            <form onSubmit={handleSearch} className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter Order ID (e.g. TECHAI-ORD-98412) or Phone number"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono font-bold"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
              >
                Track
              </button>
            </form>

            {activeOrder ? (
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Order ID: </span>
                    <span className="font-extrabold font-mono text-cyan-700">{activeOrder.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Courier: </span>
                    <span className="font-bold text-slate-800">{activeOrder.courierName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Tracking #: </span>
                    <span className="font-mono text-slate-800">{activeOrder.trackingNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Est. Delivery: </span>
                    <span className="font-bold text-emerald-600">{activeOrder.estimatedDelivery}</span>
                  </div>
                </div>

                <div className="pt-4 pb-2">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-6">
                    Shipment Progress Status
                  </h4>

                  <div className="relative flex items-center justify-between max-w-2xl mx-auto">
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 -z-0"></div>
                    <div
                      className="absolute top-1/2 left-0 h-1 bg-cyan-500 -translate-y-1/2 -z-0 transition-all duration-500"
                      style={{
                        width: `${(currentStepIdx / (STEPS.length - 1)) * 100}%`
                      }}
                    ></div>

                    {STEPS.map((step, idx) => {
                      const Icon = step.icon;
                      const isDone = idx <= currentStepIdx;
                      const isCurrent = idx === currentStepIdx;

                      return (
                        <div key={step.status} className="relative z-10 flex flex-col items-center group">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              isCurrent
                                ? "bg-cyan-500 text-slate-950 ring-4 ring-cyan-100 shadow-lg scale-110"
                                : isDone
                                ? "bg-slate-900 text-white"
                                : "bg-white border-2 border-slate-300 text-slate-400"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <span
                            className={`mt-2 text-[10px] font-bold text-center max-w-[80px] leading-tight ${
                              isCurrent
                                ? "text-cyan-600"
                                : isDone
                                ? "text-slate-900"
                                : "text-slate-400"
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Tracking History Log
                  </h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {activeOrder.statusHistory.map((hist, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-3 text-xs"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between font-bold text-slate-800">
                            <span>{hist.status}</span>
                            <span className="text-[10px] font-normal text-slate-400">{hist.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">{hist.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-4 rounded-xl space-y-1">
                    <p className="font-extrabold text-slate-900 flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Delivery Address</span>
                    </p>
                    <p className="font-bold text-slate-800">{activeOrder.shippingAddress.fullName}</p>
                    <p className="text-slate-600">{activeOrder.shippingAddress.street}</p>
                    <p className="text-slate-600">
                      {activeOrder.shippingAddress.city}, {activeOrder.shippingAddress.state} - {activeOrder.shippingAddress.pincode}
                    </p>
                    <p className="text-slate-500 font-semibold">Phone: {activeOrder.shippingAddress.phone}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                    <p className="font-extrabold text-slate-900">Items Ordered ({activeOrder.items.length})</p>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {activeOrder.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-[11px] text-slate-700">
                          <span className="truncate pr-2 font-medium">{item.product.title} (x{item.quantity})</span>
                          <span className="font-bold">₹{(item.product.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-slate-900">
                      <span>Total Paid:</span>
                      <span className="text-cyan-700">₹{activeOrder.finalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No order selected</p>
                <p className="text-xs text-slate-500">Search by your Order ID above to view live progress.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
