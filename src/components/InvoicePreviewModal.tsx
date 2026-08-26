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
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none"
        >
          {/* Top Bar for Screen Actions */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between flex-shrink-0 print:hidden border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <span>Official Tax Invoice</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    {order.paymentStatus}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Order ID: {order.id}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handlePrint}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition border border-slate-700 cursor-pointer"
                title="Print Invoice"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-white text-slate-950 font-bold rounded-lg text-xs transition shadow-sm cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Invoice</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Invoice Document Body */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1 text-slate-800 text-xs space-y-6 print:p-0 bg-white">
            {/* Header branding */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="text-lg font-black tracking-tight text-slate-950">TECH AI RETAIL INDIA PVT. LTD.</span>
                <p className="text-[11px] text-slate-600 mt-0.5">Regd Office: Tech Corridor, Outer Ring Road, Bengaluru, KA - 560103</p>
                <p className="text-[10px] text-slate-500">GSTIN: 29AABCT1337M1Z6 | CIN: U72200KA2024PTC189001</p>
                <p className="text-[10px] text-slate-500">Helpline: 1800-889-TECH | Email: support@techai.store</p>
              </div>

              <div className="sm:text-right space-y-0.5">
                <span className="inline-block bg-slate-100 border border-slate-300 text-slate-800 font-bold text-[11px] px-2.5 py-0.5 rounded">
                  TAX INVOICE
                </span>
                <p className="font-mono font-bold text-slate-900 text-xs">#{order.id}</p>
                <p className="text-[11px] text-slate-500 flex items-center sm:justify-end space-x-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Date: {orderDate}</span>
                </p>
              </div>
            </div>

            {/* Address & Logistics Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer Box */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-slate-900 font-bold uppercase tracking-wider text-[10px]">
                  <MapPin className="w-3.5 h-3.5 text-slate-600" />
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
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-slate-900 font-bold uppercase tracking-wider text-[10px]">
                  <Truck className="w-3.5 h-3.5 text-slate-600" />
                  <span>Shipping & Payment Info</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Logistics Partner:</span>
                    <span className="font-bold text-slate-800">{order.courierName || "Tech AI Express Logistics"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Waybill / AWB No:</span>
                    <span className="font-mono font-bold text-slate-800">{order.trackingNumber || "TA-" + order.id.slice(-8)}</span>
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
                    <span className="text-slate-500">Order Status:</span>
                    <span className="font-bold text-emerald-700">{order.status}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-bold">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Product Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price (INR)</th>
                    <th className="py-2.5 px-3 text-right">GST (18%)</th>
                    <th className="py-2.5 px-3 text-right">Net Total (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {order.items.map((item, index) => {
                    const itemTotal = item.product.price * item.quantity;
                    const baseUnitPrice = Math.round((item.product.price / 1.18) * 100) / 100;
                    const gstTotal = itemTotal - Math.round((itemTotal / 1.18) * 100) / 100;

                    return (
                      <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 text-slate-400 text-center font-mono">{index + 1}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{item.product.title}</div>
                          <div className="text-[10px] text-slate-500">Brand: {item.product.brand || "TECH AI"}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-700">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700">Rs. {baseUnitPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3 text-right font-medium text-slate-700">Rs. {gstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">Rs. {itemTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Summary & Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-2.5">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1">
                  <div className="flex items-center space-x-1.5 text-slate-800 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Digitally Authenticated Tax Invoice</span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-relaxed">
                    This is a computer-generated tax invoice compliant with the GST Act 2017. All goods are 100% genuine with official brand warranty.
                  </p>
                </div>

                <div className="text-[10px] text-slate-500 space-y-0.5">
                  <p>• 7-Day replacement or return as per TECH AI Policy.</p>
                  <p>• 24x7 Customer Helpline: 1800-889-TECH | support@techai.store</p>
                </div>
              </div>

              {/* Price Breakdown Box */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Items Subtotal:</span>
                  <span className="font-bold text-slate-900">Rs. {order.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Promotional Discount:</span>
                  <span className="font-bold text-emerald-700">
                    {order.discountAmount > 0 ? `- Rs. ${order.discountAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "Rs. 0.00"}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Shipping & Delivery:</span>
                  <span className="font-bold text-slate-900">
                    {order.shippingFee === 0 ? "FREE" : `Rs. ${order.shippingFee.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline font-bold text-sm">
                  <span className="text-slate-900">Grand Total (INR):</span>
                  <span className="text-slate-950 font-black">Rs. {order.finalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <p className="text-[10px] text-slate-500 text-right">Includes 18% Integrated GST</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
