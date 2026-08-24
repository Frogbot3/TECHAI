"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Order, OrderStatus } from "@/lib/types";
import { generateOrderInvoice } from "@/lib/generateInvoice";
import { useToast } from "@/components/ui/toast";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  FileText,
  MapPin,
  MessageSquare,
  Navigation,
  Package,
  RefreshCw,
  Search,
  Truck,
  X,
} from "lucide-react";

interface OrderTrackingModalProps {
  isOpen: boolean;
  orders: Order[];
  initialOrderId?: string;
  onClose: () => void;
  onOpenInvoice?: (order: Order) => void;
  onWriteReview?: (product: Order["items"][number]["product"]) => void;
}

const STAGES: { status: OrderStatus; label: string; description: string }[] = [
  { status: "Placed", label: "Order placed", description: "Payment confirmed and order received" },
  { status: "Processing", label: "Packed", description: "Prepared at our fulfilment centre" },
  { status: "Shipped", label: "Shipped", description: "Handed to the delivery partner" },
  { status: "Out for Delivery", label: "Out for delivery", description: "On the way to your address" },
  { status: "Delivered", label: "Delivered", description: "Package handed over safely" },
];

const EASE = [0.16, 1, 0.3, 1] as const;

const getStageIndex = (status: OrderStatus) => STAGES.findIndex((stage) => stage.status === status);

const formatDateTime = (value?: string) => {
  if (!value) return "Update pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Update pending";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const maskPhone = (phone: string) => {
  if (!phone) return "Not provided";
  if (phone.length <= 4) return phone;
  return `${"•".repeat(Math.max(0, phone.length - 4))}${phone.slice(-4)}`;
};

const statusCopy = (order: Order) => {
  if (order.status === "Delivered") return { heading: "Delivered", message: "Your order has arrived", eta: "Delivered" };
  if (order.status === "Out for Delivery") return { heading: "Out for delivery", message: "Arriving today", eta: order.estimatedDelivery || "Expected today" };
  if (order.status === "Shipped") return { heading: "In transit", message: "Your order is on the move", eta: order.estimatedDelivery || "Expected in 2–3 business days" };
  if (order.status === "Processing") return { heading: "Getting your order ready", message: "Packed and being prepared for dispatch", eta: order.estimatedDelivery || "Expected in 2–3 business days" };
  return { heading: "Order confirmed", message: "We have received your order", eta: order.estimatedDelivery || "Expected in 2–3 business days" };
};

function TrackingSkeleton() {
  return (
    <div className="animate-pulse space-y-5" aria-label="Loading tracking information">
      <div className="h-11 rounded-xl bg-slate-100" />
      <div className="h-44 rounded-2xl bg-slate-100" />
      <div className="h-40 rounded-2xl border border-slate-100 bg-white p-5">
        <div className="h-3 w-32 rounded bg-slate-100" />
        <div className="mt-8 h-2 rounded-full bg-slate-100" />
        <div className="mt-5 flex justify-between"><span className="h-8 w-8 rounded-full bg-slate-100" /><span className="h-8 w-8 rounded-full bg-slate-100" /><span className="h-8 w-8 rounded-full bg-slate-100" /><span className="h-8 w-8 rounded-full bg-slate-100" /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2"><div className="h-32 rounded-2xl bg-slate-100" /><div className="h-32 rounded-2xl bg-slate-100" /></div>
    </div>
  );
}

function TrackingItemThumbnail({ src, alt }: { src: string; alt: string }) {
  const [hasImageError, setHasImageError] = useState(false);

  if (hasImageError || !src) {
    return (
      <div aria-label={`${alt} image unavailable`} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-400">
        <Package className="h-5 w-5" />
      </div>
    );
  }

  return <img src={src} alt={alt} onError={() => setHasImageError(true)} className="h-14 w-14 shrink-0 rounded-xl border border-slate-100 bg-slate-50 object-contain p-1" />;
}

export default function OrderTrackingModal({
  isOpen,
  orders,
  initialOrderId,
  onClose,
  onOpenInvoice,
  onWriteReview,
}: OrderTrackingModalProps) {
  const toast = useToast();
  const reduceMotion = useReducedMotion();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [copiedValue, setCopiedValue] = useState<"order" | "awb" | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setIsTrackingLoading(true);
    const matchedOrder = initialOrderId
      ? orders.find((order) => order.id === initialOrderId || order.trackingNumber === initialOrderId)
      : orders[0];
    setSelectedOrder(matchedOrder || orders[0] || null);

    const timer = window.setTimeout(() => setIsTrackingLoading(false), reduceMotion ? 0 : 220);
    return () => window.clearTimeout(timer);
  }, [initialOrderId, isOpen, orders, reduceMotion]);

  const activeStageIndex = selectedOrder ? Math.max(0, getStageIndex(selectedOrder.status)) : 0;
  const progressPercent = (activeStageIndex / (STAGES.length - 1)) * 100;
  const stageTimestamps = useMemo(() => {
    if (!selectedOrder) return new Map<OrderStatus, string>();
    const timestamps = new Map<OrderStatus, string>();
    (selectedOrder.statusHistory || []).forEach((event) => timestamps.set(event.status, event.timestamp));
    if (!timestamps.has("Placed")) timestamps.set("Placed", selectedOrder.createdAt);
    return timestamps;
  }, [selectedOrder]);

  if (!isOpen) return null;

  const handleSearchSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const query = searchQuery.trim();
    setSearchError("");
    if (!query) return;

    const localMatch = orders.find(
      (order) =>
        order.id.toLowerCase().includes(query.toLowerCase()) ||
        order.trackingNumber.toLowerCase().includes(query.toLowerCase()) ||
        order.shippingAddress.phone.includes(query)
    );

    if (localMatch) {
      setSelectedOrder(localMatch);
      return;
    }

    setIsSearchingApi(true);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.success && data.order) {
        setSelectedOrder(data.order as Order);
      } else {
        setSelectedOrder(null);
        setSearchError("Order not found. Check the Order ID, tracking number, or phone number and try again.");
      }
    } catch {
      setSearchError("Unable to load tracking information. Please try again.");
    } finally {
      setIsSearchingApi(false);
    }
  };

  const copyToClipboard = async (value: string, type: "order" | "awb") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(type);
      toast.success(type === "order" ? "Order ID copied" : "Tracking ID copied");
      window.setTimeout(() => setCopiedValue(null), 1800);
    } catch {
      toast.error("Unable to copy. Please select the ID manually.");
    }
  };

  const orderStatus = selectedOrder ? statusCopy(selectedOrder) : null;
  const StatusIcon = selectedOrder?.status === "Delivered" ? CheckCircle2 : selectedOrder?.status === "Out for Delivery" ? Truck : Package;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-2 backdrop-blur-sm sm:p-4">
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.35, ease: EASE }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tracking-title"
          className="my-auto flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl"
        >
          <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3.5 sm:px-6 sm:py-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700"><Truck className="h-5 w-5" /></div>
              <div className="min-w-0">
                <h2 id="tracking-title" className="text-sm font-black text-slate-950 sm:text-base">Track your order</h2>
                <p className="truncate text-[11px] text-slate-500">Delivery milestones and courier updates</p>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close order tracking" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"><X className="h-5 w-5" /></button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {isTrackingLoading ? (
              <TrackingSkeleton />
            ) : (
              <div className="space-y-5">
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                  <label className="relative block min-w-0 flex-1">
                    <span className="sr-only">Order ID, tracking ID, or phone number</span>
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Order ID, tracking ID, or phone number"
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-xs font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                  </label>
                  <button type="submit" disabled={isSearchingApi} className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                    {isSearchingApi ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5 text-cyan-300" />}
                    Track
                  </button>
                </form>

                {searchError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">{searchError}</div>}

                {selectedOrder && orderStatus ? (
                  <div className="space-y-5">
                    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-lg sm:p-6">
                      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                        <div className="flex items-start gap-3.5">
                          <motion.div
                            animate={selectedOrder.status === "Out for Delivery" && !reduceMotion ? { scale: [1, 1.07, 1] } : { scale: 1 }}
                            transition={{ duration: 2.4, repeat: selectedOrder.status === "Out for Delivery" ? Infinity : 0, ease: "easeInOut" }}
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${selectedOrder.status === "Delivered" ? "bg-emerald-500/15 text-emerald-300" : "bg-cyan-400/15 text-cyan-200"}`}
                          >
                            <StatusIcon className="h-5 w-5" />
                          </motion.div>
                          <div>
                            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Current delivery status</p>
                            <h3 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">{orderStatus.heading}</h3>
                            <p className="mt-1 text-sm text-slate-300">{orderStatus.message}</p>
                          </div>
                        </div>
                        <div className="rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-3 text-left sm:text-right">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Estimated delivery</p>
                          <p className="mt-1 text-sm font-extrabold text-white">{orderStatus.eta}</p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 border-t border-slate-800 pt-4 sm:grid-cols-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Order ID</p>
                          <button type="button" onClick={() => copyToClipboard(selectedOrder.id, "order")} className="mt-1 inline-flex max-w-full items-center gap-1.5 font-mono text-xs font-bold text-cyan-200 transition-colors hover:text-white">
                            <span className="truncate">#{selectedOrder.id}</span>
                            {copiedValue === "order" ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" /> : <Copy className="h-3.5 w-3.5 shrink-0" />}
                          </button>
                        </div>
                        <div className="sm:text-right">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Tracking ID / AWB</p>
                          <button type="button" onClick={() => copyToClipboard(selectedOrder.trackingNumber, "awb")} className="mt-1 inline-flex max-w-full items-center gap-1.5 font-mono text-xs font-bold text-cyan-200 transition-colors hover:text-white">
                            <span className="truncate">{selectedOrder.trackingNumber}</span>
                            {copiedValue === "awb" ? <Check className="h-3.5 w-3.5 shrink-0 text-emerald-300" /> : <Copy className="h-3.5 w-3.5 shrink-0" />}
                          </button>
                        </div>
                      </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-950">Delivery journey</h3>
                          <p className="mt-0.5 text-[11px] text-slate-500">Completed milestones and the next delivery step</p>
                        </div>
                        <span className={`rounded-md px-2 py-1 text-[10px] font-extrabold ${selectedOrder.status === "Delivered" ? "bg-emerald-50 text-emerald-700" : "bg-cyan-50 text-cyan-700"}`}>{selectedOrder.status}</span>
                      </div>

                      <div className="relative mt-7 hidden md:block">
                        <div className="absolute left-[6%] right-[6%] top-4 h-1.5 rounded-full bg-slate-100" />
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent * 0.88}%` }} transition={{ duration: reduceMotion ? 0 : 1.15, ease: "easeOut" }} className="absolute left-[6%] top-4 h-1.5 rounded-full bg-cyan-600" />
                        <div className="relative z-10 grid grid-cols-5 gap-2">
                          {STAGES.map((stage, index) => {
                            const isComplete = index < activeStageIndex || selectedOrder.status === "Delivered";
                            const isCurrent = index === activeStageIndex && selectedOrder.status !== "Delivered";
                            return (
                              <motion.div key={stage.status} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduceMotion ? 0 : index * 0.16, duration: 0.35, ease: EASE }} className="flex flex-col items-center text-center">
                                <motion.div animate={isCurrent && !reduceMotion ? { scale: [1, 1.08, 1] } : { scale: 1 }} transition={{ duration: 2.4, repeat: isCurrent ? Infinity : 0, ease: "easeInOut" }} className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-black ${isComplete ? "border-emerald-600 bg-emerald-600 text-white" : isCurrent ? "border-cyan-600 bg-cyan-600 text-white shadow-[0_0_0_5px_rgba(2,132,199,0.12)]" : "border-slate-200 bg-white text-slate-400"}`}>
                                  {isComplete ? <Check className="h-4 w-4" /> : isCurrent ? <Truck className="h-4 w-4" /> : index + 1}
                                </motion.div>
                                <p className={`mt-3 text-[11px] font-extrabold ${isComplete ? "text-emerald-700" : isCurrent ? "text-cyan-700" : "text-slate-400"}`}>{stage.label}</p>
                                <p className="mt-1 max-w-[108px] text-[9px] leading-3 text-slate-500">{formatDateTime(stageTimestamps.get(stage.status))}</p>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-5 space-y-0 md:hidden">
                        {STAGES.map((stage, index) => {
                          const isComplete = index < activeStageIndex || selectedOrder.status === "Delivered";
                          const isCurrent = index === activeStageIndex && selectedOrder.status !== "Delivered";
                          return (
                            <motion.div key={stage.status} initial={reduceMotion ? false : { opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: reduceMotion ? 0 : index * 0.15, duration: 0.3, ease: EASE }} className="relative flex gap-3 pb-5 last:pb-0">
                              {index < STAGES.length - 1 && <span className={`absolute left-[15px] top-8 h-[calc(100%-20px)] w-px ${index < activeStageIndex ? "bg-emerald-500" : "bg-slate-200"}`} />}
                              <motion.div animate={isCurrent && !reduceMotion ? { scale: [1, 1.08, 1] } : { scale: 1 }} transition={{ duration: 2.4, repeat: isCurrent ? Infinity : 0 }} className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${isComplete ? "border-emerald-600 bg-emerald-600 text-white" : isCurrent ? "border-cyan-600 bg-cyan-600 text-white" : "border-slate-200 bg-white text-slate-400"}`}>
                                {isComplete ? <Check className="h-4 w-4" /> : isCurrent ? <Truck className="h-4 w-4" /> : <span className="text-[11px] font-black">{index + 1}</span>}
                              </motion.div>
                              <div className="pt-0.5">
                                <p className={`text-xs font-black ${isComplete ? "text-emerald-700" : isCurrent ? "text-cyan-700" : "text-slate-500"}`}>{stage.label}</p>
                                <p className="mt-0.5 text-[11px] text-slate-500">{formatDateTime(stageTimestamps.get(stage.status))}</p>
                                {isCurrent && <p className="mt-0.5 text-[11px] text-slate-600">{stage.description}</p>}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </section>

                    <div className="grid gap-4 lg:grid-cols-3">
                      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
                        <h3 className="text-sm font-black text-slate-950">Your items</h3>
                        <div className="mt-3 divide-y divide-slate-100">
                          {selectedOrder.items.map((item) => (
                            <div key={`${item.product.id}-${item.quantity}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                              <TrackingItemThumbnail src={item.product.image} alt={item.product.title} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-extrabold text-slate-900">{item.product.title}</p>
                                <p className="mt-1 text-[11px] text-slate-500">Qty: {item.quantity} · ₹{item.product.price.toLocaleString("en-IN")}</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Link href={`/product/${encodeURIComponent(item.product.id)}`} className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-700 hover:text-cyan-800">View product <ChevronRight className="h-3.5 w-3.5" /></Link>
                                  {onWriteReview && <button type="button" onClick={() => onWriteReview(item.product)} className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-cyan-700"><MessageSquare className="h-3.5 w-3.5" />Write review</button>}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <h3 className="text-sm font-black text-slate-950">Courier details</h3>
                        <dl className="mt-3 space-y-3 text-xs">
                          <div><dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Delivery partner</dt><dd className="mt-0.5 font-bold text-slate-800">{selectedOrder.courierName || "TECH AI Logistics"}</dd></div>
                          <div><dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Current status</dt><dd className="mt-0.5 font-bold text-cyan-700">{selectedOrder.status}</dd></div>
                          <div><dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Location</dt><dd className="mt-0.5 text-slate-600">Live location unavailable</dd></div>
                        </dl>
                      </section>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-cyan-700" /><h3 className="text-sm font-black text-slate-950">Delivering to</h3></div>
                        <div className="mt-3 text-xs leading-5 text-slate-600">
                          <p className="font-extrabold text-slate-900">{selectedOrder.shippingAddress.fullName}</p>
                          <p>{selectedOrder.shippingAddress.street}</p>
                          <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} — {selectedOrder.shippingAddress.pincode}</p>
                          <p className="mt-1 text-[11px] text-slate-500">Phone: {maskPhone(selectedOrder.shippingAddress.phone)}</p>
                        </div>
                      </section>

                      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-black text-slate-950">Order summary</h3><button type="button" onClick={() => { if (onOpenInvoice) onOpenInvoice(selectedOrder); else generateOrderInvoice(selectedOrder); }} className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-700 hover:text-cyan-800"><FileText className="h-3.5 w-3.5" />Invoice</button></div>
                        <dl className="mt-3 space-y-2 text-xs">
                          <div className="flex justify-between text-slate-600"><dt>Item total</dt><dd>₹{selectedOrder.totalAmount.toLocaleString("en-IN")}</dd></div>
                          <div className="flex justify-between text-emerald-700"><dt>Discount</dt><dd>−₹{selectedOrder.discountAmount.toLocaleString("en-IN")}</dd></div>
                          <div className="flex justify-between text-slate-600"><dt>Delivery</dt><dd>{selectedOrder.shippingFee ? `₹${selectedOrder.shippingFee.toLocaleString("en-IN")}` : "Free"}</dd></div>
                          <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-black text-slate-950"><dt>Grand total</dt><dd>₹{selectedOrder.finalAmount.toLocaleString("en-IN")}</dd></div>
                          <div className="pt-1 text-[11px] font-medium text-slate-500">{selectedOrder.paymentMethod} · {selectedOrder.paymentStatus}</div>
                        </dl>
                      </section>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
                    <Package className="mx-auto h-10 w-10 text-slate-300" />
                    <h3 className="mt-3 text-sm font-black text-slate-900">Order not found</h3>
                    <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">Check the Order ID, tracking number, or the phone number used at checkout.</p>
                    <button type="button" onClick={() => { setSearchQuery(""); setSearchError(""); }} className="mt-4 text-xs font-bold text-cyan-700 hover:text-cyan-800">Check another order</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
