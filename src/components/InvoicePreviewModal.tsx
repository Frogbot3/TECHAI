"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Order } from "@/lib/types";
import { generateOrderInvoice } from "@/lib/generateInvoice";
import TechAiLogo from "./TechAiLogo";
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  MapPin,
  FileText,
  Calendar,
  Truck,
  Check,
  Copy,
  QrCode,
  Sparkles,
} from "lucide-react";

interface InvoicePreviewModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function InvoicePreviewModal({
  order,
  isOpen,
  onClose,
}: InvoicePreviewModalProps) {
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen || !order) return null;

  const invoiceNo = `TA-INV-${order.id.replace(/[^0-9a-zA-Z]/g, "").slice(-8).toUpperCase() || "882103"}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await generateOrderInvoice(order);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyInvoiceNo = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(invoiceNo);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const orderTime = new Date(order.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // GST Calculations (18% GST: 9% CGST + 9% SGST)
  const taxableValue = Math.round((order.totalAmount / 1.18) * 100) / 100;
  const gstTotal = Math.round((order.totalAmount - taxableValue) * 100) / 100;
  const cgst = Math.round((gstTotal / 2) * 100) / 100;
  const sgst = Math.round((gstTotal - cgst) * 100) / 100;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="bg-white w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[94vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
        >
          {/* Top Header Bar for Screen Actions */}
          <div className="p-3.5 sm:p-4 bg-slate-950 text-white flex items-center justify-between flex-shrink-0 print:hidden border-b border-slate-800">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 flex-shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>Official Tax Invoice</span>
                  <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 font-bold px-2 py-0.2 rounded-full">
                    {order.paymentStatus}
                  </span>
                </h3>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span className="truncate">Invoice #{invoiceNo}</span>
                  <button
                    type="button"
                    onClick={handleCopyInvoiceNo}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Copy Invoice No"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-700 cursor-pointer"
                title="Print Invoice"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                disabled={isGeneratingPdf}
                onClick={handleDownloadPdf}
                className="flex items-center space-x-1.5 px-3 sm:px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-black rounded-xl text-xs transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close invoice"
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Invoice Document Body - Mobile Optimized */}
          <div className="p-4 sm:p-8 overflow-y-auto flex-1 text-slate-800 text-xs space-y-5 print:p-0 bg-white">
            {/* Header Branding & Metadata */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TechAiLogo size="sm" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                    Retail India Pvt. Ltd.
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  Regd Office: Tech Corridor, Outer Ring Road, Bengaluru, KA - 560103
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  GSTIN: <span className="font-bold text-slate-700">29AABCT1337M1Z6</span> | CIN: U72200KA2024PTC189001
                </p>
                <p className="text-[10px] text-slate-500">
                  Toll-Free Support: 1800-889-TECH | Email: billing@techai.store
                </p>
              </div>

              <div className="w-full sm:w-auto p-3 bg-slate-50 rounded-xl border border-slate-200 sm:text-right space-y-1">
                <span className="inline-block bg-slate-900 text-white font-extrabold text-[10px] tracking-wider px-2.5 py-0.5 rounded-md uppercase">
                  Tax Invoice
                </span>
                <p className="font-mono font-black text-slate-950 text-xs sm:text-sm">#{invoiceNo}</p>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <p className="flex items-center sm:justify-end gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Date: {orderDate} ({orderTime})</span>
                  </p>
                  <p className="font-mono text-[10px] text-slate-500">Order Ref: {order.id}</p>
                </div>
              </div>
            </div>

            {/* Customer Address & Shipping Logistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Customer Box */}
              <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-slate-900 font-bold uppercase tracking-wider text-[10px]">
                  <MapPin className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Billed & Shipped To</span>
                </div>
                <div>
                  <p className="font-bold text-slate-950 text-xs">{order.shippingAddress.fullName || "Valued Customer"}</p>
                  <p className="text-slate-600 text-[11px] leading-relaxed mt-0.5">
                    {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                  </p>
                  {order.shippingAddress.landmark && (
                    <p className="text-slate-500 text-[10px]">Landmark: {order.shippingAddress.landmark}</p>
                  )}
                  <p className="text-slate-800 text-[11px] font-bold mt-1">Phone: +91 {order.shippingAddress.phone}</p>
                  {order.shippingAddress.email && (
                    <p className="text-slate-500 text-[10px]">Email: {order.shippingAddress.email}</p>
                  )}
                </div>
              </div>

              {/* Order Logistics Box */}
              <div className="bg-slate-50/90 rounded-xl p-3.5 border border-slate-200 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-slate-900 font-bold uppercase tracking-wider text-[10px]">
                  <Truck className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Dispatch & Payment Info</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Courier Partner:</span>
                    <span className="font-bold text-slate-900">{order.courierName || "Tech AI Express Logistics"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Waybill / AWB No:</span>
                    <span className="font-mono font-bold text-slate-900">{order.trackingNumber || "TA-" + order.id.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Mode:</span>
                    <span className="font-bold text-slate-900">{order.paymentMethod} ({order.paymentStatus})</span>
                  </div>
                  {order.paymentDetails?.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Txn Reference:</span>
                      <span className="font-mono text-[10px] text-slate-700">{order.paymentDetails.transactionId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Supply State:</span>
                    <span className="font-bold text-slate-800">{order.shippingAddress.state || "Karnataka"} (State Code: 29)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Itemized Table - Fully Responsive with Horizontal Scroll on Phone View */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-500">
                <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">Itemized Breakdown</span>
                <span className="sm:hidden text-[10px] text-cyan-700 font-semibold">Swipe table to view all columns &rarr;</span>
              </div>

              <div className="rounded-xl border border-slate-200 overflow-x-auto shadow-2xs">
                <table className="w-full text-left border-collapse min-w-[560px]">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[11px] font-bold">
                      <th className="py-2.5 px-3 w-8 text-center">#</th>
                      <th className="py-2.5 px-3">Product Description</th>
                      <th className="py-2.5 px-2 text-center">HSN/SAC</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">GST (18%)</th>
                      <th className="py-2.5 px-3 text-right">Net Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {order.items.map((item, index) => {
                      const itemTotal = item.product.price * item.quantity;
                      const baseUnitPrice = Math.round((item.product.price / 1.18) * 100) / 100;
                      const itemGst = itemTotal - Math.round((itemTotal / 1.18) * 100) / 100;

                      return (
                        <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 text-slate-400 text-center font-mono">{index + 1}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 line-clamp-1">{item.product.title}</div>
                            <div className="text-[10px] text-slate-500">Brand: {item.product.brand || "TECH AI"}</div>
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-[10px] text-slate-500">8517 / 8518</td>
                          <td className="py-2.5 px-2 text-center font-bold text-slate-800">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                            ₹{baseUnitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                            ₹{itemGst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-950">
                            ₹{itemTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary & GST Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Compliance, QR Code, and Digital Seal */}
              <div className="space-y-3">
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 flex items-start gap-3">
                  {/* Digital QR Code Simulation */}
                  <div className="w-14 h-14 bg-white p-1 rounded-lg border border-emerald-200 flex-shrink-0 flex flex-col items-center justify-center">
                    <QrCode className="w-8 h-8 text-emerald-800" />
                    <span className="text-[8px] font-bold text-emerald-700 mt-0.5">GST VERIFIED</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1 text-emerald-900 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Digitally Authenticated Tax Invoice</span>
                    </div>
                    <p className="text-[10px] text-emerald-800 mt-0.5 leading-relaxed">
                      Generated pursuant to Sec 31 of Central Goods and Services Tax Act, 2017. All serials are registered with official manufacturer warranty.
                    </p>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <p className="font-semibold text-slate-700">Returns & Warranty Terms:</p>
                  <p>• 7-Day replacement or refund under TECH AI buyer protection policy.</p>
                  <p>• Warranty service honored across 2,400+ authorized brand service centers nationwide.</p>
                </div>
              </div>

              {/* Price Breakdown Card with Full GST Details */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Goods Value:</span>
                  <span className="font-bold text-slate-900">
                    ₹{taxableValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Central GST (CGST 9%):</span>
                  <span className="font-medium text-slate-800">
                    ₹{cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>State GST (SGST 9%):</span>
                  <span className="font-medium text-slate-800">
                    ₹{sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Promotional Discount:</span>
                  <span className="font-bold text-emerald-700">
                    {order.discountAmount > 0
                      ? `- ₹${order.discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                      : "₹0.00"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Express Shipping & Logistics:</span>
                  <span className="font-bold text-emerald-700">
                    {order.shippingFee === 0
                      ? "FREE"
                      : `₹${order.shippingFee.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between items-baseline font-bold">
                  <span className="text-slate-900 text-sm">Grand Total (INR):</span>
                  <span className="text-slate-950 font-black text-base sm:text-lg">
                    ₹{order.finalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 text-right">
                  (Inclusive of all applicable Central & State Taxes)
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
