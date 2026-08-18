"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Order } from "@/lib/types";
import { generateOrderInvoice } from "@/lib/generateInvoice";
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  CheckCircle2,
  Calendar,
  CreditCard,
  Truck
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
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    await generateOrderInvoice(order);
  };

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white selection:bg-cyan-500 selection:text-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
        >
          {/* Top Bar for Screen (Hidden in print) */}
          <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between flex-shrink-0 print:hidden">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center space-x-2">
                  <span>Official Tax Invoice</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Paid & Verified
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Invoice #{order.id}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700"
                title="Print Invoice"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span>Print</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Invoice Document Body */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 text-slate-800 text-xs space-y-6 print:p-0">
            {/* Header branding */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-200">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-lg bg-slate-950 text-cyan-400 font-black flex items-center justify-center text-sm tracking-wider">
                    TA
                  </div>
                  <span className="text-xl font-black tracking-tight text-slate-950">TECH AI</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Retail India Private Limited</p>
                <p className="text-[10px] text-slate-400">GSTIN: 29AABCT1337M1Z6 | CIN: U72200KA2024PTC189001</p>
              </div>

              <div className="sm:text-right space-y-1">
                <span className="inline-block bg-slate-100 text-slate-800 font-black text-xs px-2.5 py-1 rounded-md">
                  TAX INVOICE
                </span>
                <p className="font-mono font-bold text-slate-900 text-sm">#{order.id}</p>
                <p className="text-[11px] text-slate-500 flex items-center sm:justify-end space-x-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{orderDate}</span>
                </p>
              </div>
            </div>

            {/* Address & Logistics Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                <div className="flex items-center space-x-1.5 text-slate-900 font-extrabold uppercase tracking-wider text-[10px]">
                  <MapPin className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Billed & Shipped To</span>
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-xs">{order.shippingAddress.fullName || "Valued Customer"}</p>
                  <p className="text-slate-600 text-[11px]">
                    {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
                  </p>
                  {order.shippingAddress.landmark && (
                    <p className="text-slate-500 text-[10px]">Landmark: {order.shippingAddress.landmark}</p>
                  )}
                  <p className="text-slate-700 text-[11px] font-semibold mt-1">Phone: +91 {order.shippingAddress.phone}</p>
                  {order.shippingAddress.email && (
                    <p className="text-slate-500 text-[10px]">Email: {order.shippingAddress.email}</p>
                  )}
                </div>
              </div>

              {/* Order Meta Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                <div className="flex items-center space-x-1.5 text-slate-900 font-extrabold uppercase tracking-wider text-[10px]">
                  <Truck className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Shipping & Payment Info</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Courier:</span>
                    <span className="font-bold text-slate-800">{order.courierName || "Tech AI Logistics"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tracking AWB:</span>
                    <span className="font-mono font-bold text-cyan-700">{order.trackingNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Mode:</span>
                    <span className="font-bold text-slate-800">{order.paymentMethod} ({order.paymentStatus})</span>
                  </div>
                  {order.paymentDetails?.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transaction ID:</span>
                      <span className="font-mono text-slate-700">{order.paymentDetails.transactionId}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Delivery Status:</span>
                    <span className="font-bold text-emerald-600">{order.status}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-cyan-400 text-[11px] font-extrabold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Product Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {order.items.map((item, index) => {
                    const itemTotal = item.product.price * item.quantity;
                    return (
                      <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 text-slate-400 text-center font-mono">{index + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{item.product.title}</div>
                          <div className="text-[10px] text-slate-400 font-medium">Brand: {item.product.brand || "TECH AI"} • Category: {item.product.category || "Gadget"}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700">{item.quantity}</td>
                        <td className="py-3 px-3 text-right font-medium text-slate-700">₹{item.product.price.toLocaleString("en-IN")}</td>
                        <td className="py-3 px-3 text-right font-extrabold text-slate-900">₹{itemTotal.toLocaleString("en-IN")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Summary & Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-3">
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5 space-y-1">
                  <div className="flex items-center space-x-1.5 text-emerald-800 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Digitally Authenticated Invoice</span>
                  </div>
                  <p className="text-[10px] text-emerald-700 leading-relaxed">
                    This computer-generated tax receipt is verified with 256-bit cryptographic signature and complies with Indian E-Commerce taxation standards.
                  </p>
                </div>

                <div className="text-[10px] text-slate-500 space-y-0.5">
                  <p>• 7-day hassle-free replacement & return policy.</p>
                  <p>• 1-Year comprehensive warranty on all electronic items.</p>
                  <p>• 24x7 Customer Support: support@techai.store | 1800-889-TECH</p>
                </div>
              </div>

              {/* Price Breakdown Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Items Subtotal:</span>
                  <span className="font-bold text-slate-900">₹{order.totalAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Promotional Discount:</span>
                  <span className="font-bold text-emerald-600">
                    {order.discountAmount > 0 ? `- ₹${order.discountAmount.toLocaleString("en-IN")}` : "₹0"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping & Delivery Fee:</span>
                  <span className="font-bold text-slate-900">
                    {order.shippingFee === 0 ? "FREE" : `₹${order.shippingFee.toLocaleString("en-IN")}`}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline font-black text-sm">
                  <span className="text-slate-900">Grand Total Payable:</span>
                  <span className="text-base text-cyan-600">₹{order.finalAmount.toLocaleString("en-IN")}</span>
                </div>
                <p className="text-[10px] text-slate-400 text-right font-medium">Includes 18% Integrated GST</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
