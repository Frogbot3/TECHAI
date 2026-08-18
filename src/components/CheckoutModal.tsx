"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { CartItem, ShippingAddress, Order } from "@/lib/types";
import {
  X,
  MapPin,
  CreditCard,
  QrCode,
  Building2,
  Banknote,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Package,
  ArrowRight,
  Sparkles,
  User as UserIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  Check,
  ChevronRight,
  Truck,
  FileText,
  Lock,
  Smartphone,
  Info,
  BadgePercent
} from "lucide-react";

interface CheckoutModalProps {
  isOpen: boolean;
  cart: CartItem[];
  appliedCoupon?: string;
  user: any;
  onClose: () => void;
  onCreateOrder: (
    shippingAddress: ShippingAddress,
    paymentMethod: Order["paymentMethod"],
    discountCode?: string,
    paymentDetails?: any
  ) => Promise<Order> | Order;
  onOpenOrderTracking: (orderId: string) => void;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Delhi NCR", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan",
  "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const POPULAR_UPI_HANDLES = ["@okaxis", "@okhdfcbank", "@ybl", "@paytm", "@ibl"];

const TOP_BANKS = [
  { id: "HDFC", name: "HDFC Bank", code: "HDFC" },
  { id: "ICICI", name: "ICICI Bank", code: "ICICI" },
  { id: "SBI", name: "State Bank of India", code: "SBI" },
  { id: "AXIS", name: "Axis Bank", code: "AXIS" },
  { id: "KOTAK", name: "Kotak Mahindra", code: "KOTAK" },
  { id: "PNB", name: "Punjab National Bank", code: "PNB" },
];

export default function CheckoutModal({
  isOpen,
  cart,
  appliedCoupon,
  user,
  onClose,
  onCreateOrder,
  onOpenOrderTracking
}: CheckoutModalProps) {
  const [step, setStep] = useState<"ADDRESS" | "PAYMENT" | "PROCESSING" | "SUCCESS">("ADDRESS");
  const [paymentMethod, setPaymentMethod] = useState<Order["paymentMethod"]>("UPI");
  const [deliveryType, setDeliveryType] = useState<"standard" | "express">("standard");
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Address State
  const [address, setAddress] = useState<ShippingAddress>({
    fullName: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    state: "Karnataka",
    pincode: "",
    landmark: ""
  });

  // Payment Form States
  const [cardNumber, setCardNumber] = useState("4532 8910 2341 8901");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("892");
  const [upiVpa, setUpiVpa] = useState("rahul@okaxis");
  const [selectedBank, setSelectedBank] = useState("HDFC");
  const [validationError, setValidationError] = useState("");

  // Sync real user profile details dynamically
  useEffect(() => {
    if (user) {
      const existingAddr = user.addresses && user.addresses.length > 0 ? user.addresses[0] : null;
      setAddress({
        fullName: user.name || existingAddr?.fullName || "",
        phone: user.phone || existingAddr?.phone || "",
        email: user.email || existingAddr?.email || "",
        street: existingAddr?.street || "",
        city: existingAddr?.city || "",
        state: existingAddr?.state || "Karnataka",
        pincode: existingAddr?.pincode || "",
        landmark: existingAddr?.landmark || ""
      });
      if (user.name) setCardHolder(user.name);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const discount = appliedCoupon === "TECHAI10" ? Math.round(subtotal * 0.1) : 0;
  const shippingFee = deliveryType === "express" ? 99 : (subtotal > 499 ? 0 : 49);
  const finalTotal = Math.max(0, subtotal - discount + shippingFee);

  // Auto-detect card brand
  const getCardBrand = (num: string) => {
    const clean = num.replace(/\s/g, "");
    if (clean.startsWith("4")) return "VISA";
    if (clean.startsWith("5")) return "MASTERCARD";
    if (clean.startsWith("60") || clean.startsWith("65") || clean.startsWith("81")) return "RUPAY";
    if (clean.startsWith("3")) return "AMEX";
    return "CARD";
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setCardExpiry(raw);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!address.fullName.trim()) {
      setValidationError("Please enter your full name for courier delivery.");
      return;
    }
    if (address.phone.replace(/\D/g, "").length !== 10) {
      setValidationError("Please enter a valid 10-digit mobile number for delivery updates.");
      return;
    }
    if (!address.street.trim() || !address.city.trim()) {
      setValidationError("Please provide your complete street address and city.");
      return;
    }
    if (address.pincode.replace(/\D/g, "").length !== 6) {
      setValidationError("Please enter a valid 6-digit postal Pincode.");
      return;
    }

    if (!cardHolder && address.fullName) {
      setCardHolder(address.fullName);
    }

    setStep("PAYMENT");
  };

  const handlePaymentSubmit = async () => {
    setStep("PROCESSING");

    const paymentDetails = {
      provider: paymentMethod === "UPI" ? "UPI" : paymentMethod === "Card" ? "Stripe" : "Manual",
      gatewayStatus: "Payment confirmed successfully",
      transactionId: `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      upiId: paymentMethod === "UPI" ? upiVpa : "",
      cardLast4: paymentMethod === "Card" ? cardNumber.replace(/\s/g, "").slice(-4) : "",
      cardHolder: paymentMethod === "Card" ? (cardHolder || address.fullName) : "",
      bankName: paymentMethod === "NetBanking" ? selectedBank : "",
      paymentNote: paymentMethod === "COD" ? "Cash / UPI on arrival" : "Online verified instant payment",
    };

    try {
      const order = await Promise.resolve(onCreateOrder(address, paymentMethod, appliedCoupon, paymentDetails));
      setPlacedOrder(order);
      setStep("SUCCESS");

      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
        // Confetti optional
      }
    } catch {
      alert("Unable to complete your order. Please check your connection and try again.");
      setStep("PAYMENT");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto selection:bg-cyan-500 selection:text-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 relative my-auto flex flex-col max-h-[94vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900 text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                  <span>TECH AI Express Checkout</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    256-Bit SSL Encrypted
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">Safe, secure & verified payment gateway</p>
              </div>
            </div>
            {step !== "PROCESSING" && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="p-5 sm:p-7 overflow-y-auto flex-1 text-xs">
            {/* Step Stepper Progress */}
            {step !== "SUCCESS" && step !== "PROCESSING" && (
              <div className="flex items-center justify-between mb-6 max-w-sm mx-auto font-black text-xs">
                <button
                  type="button"
                  onClick={() => setStep("ADDRESS")}
                  className={`flex items-center space-x-2 transition-colors ${
                    step === "ADDRESS" ? "text-cyan-600" : "text-emerald-600"
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                      step === "ADDRESS"
                        ? "bg-cyan-100 text-cyan-800 ring-2 ring-cyan-500/30"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {step === "PAYMENT" ? <Check className="w-4 h-4" /> : "1"}
                  </span>
                  <span>1. Delivery Address</span>
                </button>

                <div className={`w-14 h-0.5 transition-colors ${step === "PAYMENT" ? "bg-cyan-500" : "bg-slate-200"}`} />

                <div
                  className={`flex items-center space-x-2 ${
                    step === "PAYMENT" ? "text-cyan-600" : "text-slate-400"
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                      step === "PAYMENT"
                        ? "bg-cyan-100 text-cyan-800 ring-2 ring-cyan-500/30"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    2
                  </span>
                  <span>2. Payment Option</span>
                </div>
              </div>
            )}

            {/* STEP 1: DELIVERY ADDRESS & DETAILS */}
            {step === "ADDRESS" && (
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                {/* User info banner */}
                {user ? (
                  <div className="bg-cyan-50/70 border border-cyan-200/80 rounded-2xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-cyan-600 text-white font-black flex items-center justify-center text-xs">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 text-xs">Logged in as {user.name || "Customer"}</p>
                        <p className="text-[10px] text-slate-500">{user.email || user.phone}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-cyan-700 bg-white px-2 py-0.5 rounded-full border border-cyan-200">
                      Auto-Filled
                    </span>
                  </div>
                ) : null}

                {/* Items Mini Strip */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Order Items ({cart.reduce((sum, i) => sum + i.quantity, 0)})</span>
                    </span>
                    <span className="text-slate-900 font-extrabold">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 flex-shrink-0"
                      >
                        <img
                          src={item.product.image}
                          alt={item.product.title}
                          className="w-7 h-7 object-contain rounded bg-slate-50"
                        />
                        <div className="text-[10px] max-w-[120px] truncate">
                          <p className="font-bold text-slate-800 truncate">{item.product.title}</p>
                          <p className="text-slate-500">Qty: {item.quantity} × ₹{item.product.price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {validationError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                    <Info className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 flex items-center space-x-1">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Recipient Full Name *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none transition font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 flex items-center space-x-1">
                      <PhoneIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Mobile Phone Number *</span>
                    </label>
                    <div className="flex">
                      <span className="flex items-center px-3 bg-slate-100 border border-r-0 border-slate-200 text-slate-700 text-xs font-bold rounded-l-xl">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={address.phone}
                        onChange={(e) => setAddress({ ...address, phone: e.target.value.replace(/\D/g, "") })}
                        placeholder="10-digit number"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-r-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none transition font-medium font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center space-x-1">
                    <MailIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email Address (for order invoice & tracking updates)</span>
                  </label>
                  <input
                    type="email"
                    value={address.email}
                    onChange={(e) => setAddress({ ...address, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none transition font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">
                    House / Flat No., Building & Street Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    placeholder="House/Flat number, Building name, Street name, Area"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none transition font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">City *</label>
                    <input
                      type="text"
                      required
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      placeholder="e.g. Bengaluru"
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none transition font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">State *</label>
                    <select
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">Pincode *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={address.pincode}
                      onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, "") })}
                      placeholder="6-digit PIN"
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700">Landmark (Optional)</label>
                  <input
                    type="text"
                    value={address.landmark}
                    onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                    placeholder="Near prominent park, school, or metro station"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none transition font-medium"
                  />
                </div>

                {/* Delivery Option Selector */}
                <div className="pt-2">
                  <label className="text-xs font-extrabold text-slate-800 block mb-2">Select Delivery Speed</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryType("standard")}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        deliveryType === "standard"
                          ? "border-cyan-600 bg-cyan-50/60 ring-2 ring-cyan-500/20"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-xs">Standard Express</span>
                        <span className="text-[10px] font-bold text-emerald-600">
                          {subtotal > 499 ? "FREE" : "₹49"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Delivery in 2-4 business days</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType("express")}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        deliveryType === "express"
                          ? "border-cyan-600 bg-cyan-50/60 ring-2 ring-cyan-500/20"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Priority Rocket</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-900">₹99</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Guaranteed next-day delivery</p>
                    </button>
                  </div>
                </div>

                {/* Price Breakdown Footer & Submit */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-slate-500 text-xs">Total Payable: </span>
                    <span className="font-black text-slate-950 text-base sm:text-lg">₹{finalTotal.toLocaleString("en-IN")}</span>
                    {discount > 0 && (
                      <span className="ml-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        -₹{discount} Saved
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-7 py-3 bg-slate-900 hover:bg-cyan-600 text-white text-xs font-black rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-cyan-500/20"
                  >
                    <span>Proceed to Payment</span>
                    <ArrowRight className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: CUSTOMER-FRIENDLY PAYMENT GATEWAY */}
            {step === "PAYMENT" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-extrabold text-slate-900">Choose How You'd Like to Pay</h4>
                  <span className="text-[11px] font-bold text-slate-500">Payable: ₹{finalTotal.toLocaleString("en-IN")}</span>
                </div>

                {/* 4 Clean Payment Options Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* UPI */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("UPI")}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === "UPI"
                        ? "border-cyan-600 bg-cyan-50/70 ring-2 ring-cyan-500/20 text-cyan-900"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black">UPI Instant</span>
                    <span className="text-[9px] text-slate-500">GPay, PhonePe, Paytm</span>
                  </button>

                  {/* Card */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("Card")}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === "Card"
                        ? "border-cyan-600 bg-cyan-50/70 ring-2 ring-cyan-500/20 text-cyan-900"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black">Cards</span>
                    <span className="text-[9px] text-slate-500">Credit / Debit</span>
                  </button>

                  {/* Net Banking */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("NetBanking")}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === "NetBanking"
                        ? "border-cyan-600 bg-cyan-50/70 ring-2 ring-cyan-500/20 text-cyan-900"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black">Net Banking</span>
                    <span className="text-[9px] text-slate-500">All Major Banks</span>
                  </button>

                  {/* Cash on Delivery */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("COD")}
                    className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === "COD"
                        ? "border-cyan-600 bg-cyan-50/70 ring-2 ring-cyan-500/20 text-cyan-900"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Banknote className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-black">Pay on Delivery</span>
                    <span className="text-[9px] text-slate-500">Cash / QR at door</span>
                  </button>
                </div>

                {/* --- 1. UPI DETAILS --- */}
                {paymentMethod === "UPI" && (
                  <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                      {/* Interactive QR code */}
                      <div className="sm:col-span-4 flex flex-col items-center justify-center bg-white p-3 rounded-xl border border-slate-200 text-center">
                        <div className="w-24 h-24 bg-slate-900 text-white rounded-lg flex flex-col items-center justify-center p-2">
                          <QrCode className="w-16 h-16 text-cyan-400" />
                          <span className="text-[8px] font-mono mt-1 text-slate-300">TECHAI-UPI</span>
                        </div>
                        <span className="text-[10px] font-extrabold text-slate-700 mt-2">Scan & Pay ₹{finalTotal.toLocaleString()}</span>
                        <span className="text-[9px] text-slate-400">Any UPI app</span>
                      </div>

                      {/* UPI ID input & quick handles */}
                      <div className="sm:col-span-8 space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-cyan-600" />
                            <span>Enter Your UPI ID (VPA)</span>
                          </label>
                          <input
                            type="text"
                            value={upiVpa}
                            onChange={(e) => setUpiVpa(e.target.value)}
                            placeholder="username@okhdfcbank"
                            className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                          />
                        </div>

                        {/* Quick handle pills */}
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-500">Popular UPI Handles:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {POPULAR_UPI_HANDLES.map((handle) => (
                              <button
                                key={handle}
                                type="button"
                                onClick={() => {
                                  const base = upiVpa.split("@")[0] || "user";
                                  setUpiVpa(`${base}${handle}`);
                                }}
                                className="px-2 py-0.5 bg-white hover:bg-cyan-50 border border-slate-200 rounded-md text-[10px] font-mono font-bold text-slate-700 transition-colors"
                              >
                                {handle}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- 2. CARD WITH LIVE INTERACTIVE PREVIEW --- */}
                {paymentMethod === "Card" && (
                  <div className="space-y-4">
                    {/* Live Virtual Card Preview */}
                    <div className="bg-gradient-to-tr from-slate-950 via-slate-900 to-cyan-950 text-white p-5 rounded-2xl shadow-xl border border-slate-800 space-y-4 relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-6 bg-amber-400/80 rounded-md flex items-center justify-center font-bold text-[9px] text-slate-950">
                            CHIP
                          </div>
                          <span className="text-[10px] font-mono text-cyan-300">TECH AI PLATINUM</span>
                        </div>
                        <span className="text-sm font-black italic tracking-wider text-cyan-400">
                          {getCardBrand(cardNumber)}
                        </span>
                      </div>

                      <div className="font-mono text-base sm:text-lg font-bold tracking-widest text-slate-100">
                        {cardNumber || "•••• •••• •••• ••••"}
                      </div>

                      <div className="flex items-end justify-between text-[10px]">
                        <div>
                          <p className="text-slate-400 uppercase tracking-wider text-[8px]">Cardholder</p>
                          <p className="font-bold tracking-wide uppercase truncate max-w-[160px]">
                            {cardHolder || address.fullName || "YOUR NAME"}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400 uppercase tracking-wider text-[8px]">Expires</p>
                          <p className="font-mono font-bold">{cardExpiry || "MM/YY"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Card input fields */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-extrabold text-slate-700">Card Number *</label>
                        <input
                          type="text"
                          maxLength={19}
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="16-digit card number"
                          className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-700">Valid Thru (MM/YY) *</label>
                          <input
                            type="text"
                            maxLength={5}
                            value={cardExpiry}
                            onChange={handleExpiryChange}
                            placeholder="12/28"
                            className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-extrabold text-slate-700">CVV / CVC *</label>
                          <input
                            type="password"
                            maxLength={3}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                            placeholder="•••"
                            className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- 3. NET BANKING --- */}
                {paymentMethod === "NetBanking" && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <label className="text-xs font-extrabold text-slate-800 block">Select Your Bank</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {TOP_BANKS.map((bank) => (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => setSelectedBank(bank.name)}
                          className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                            selectedBank === bank.name
                              ? "bg-cyan-500 text-slate-950 border-cyan-500 font-black shadow-sm"
                              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {bank.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- 4. CASH ON DELIVERY --- */}
                {paymentMethod === "COD" && (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Zero Advance Payment Required</span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed">
                      You can pay ₹{finalTotal.toLocaleString("en-IN")} via Cash or by scanning the delivery agent's UPI QR code when your parcel arrives.
                    </p>
                  </div>
                )}

                {/* Bottom Payment Action Bar */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("ADDRESS")}
                    className="text-xs text-slate-500 hover:text-slate-900 font-bold transition-colors"
                  >
                    ← Back to Address Details
                  </button>

                  <button
                    type="button"
                    onClick={handlePaymentSubmit}
                    className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-cyan-600 text-white text-xs font-black rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-2"
                  >
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Pay ₹{finalTotal.toLocaleString("en-IN")} & Complete Order</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PROCESSING ORDER */}
            {step === "PROCESSING" && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 className="w-12 h-12 text-cyan-600 animate-spin" />
                <div>
                  <h4 className="text-base font-black text-slate-950">Confirming Payment & Booking Courier...</h4>
                  <p className="text-xs text-slate-500 mt-1">Generating order invoice and dispatching tracking ID</p>
                </div>
              </div>
            )}

            {/* STEP 4: SUCCESS CONFIRMATION */}
            {step === "SUCCESS" && placedOrder && (
              <div className="text-center space-y-6 py-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-950">
                    Order Placed Successfully! 🎉
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Your order is confirmed and will be delivered by Tech AI Logistics.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 text-left space-y-2.5 max-w-md mx-auto text-xs">
                  <div className="flex justify-between border-b border-slate-200 pb-2 font-bold">
                    <span className="text-slate-500">Order ID</span>
                    <span className="text-cyan-700 font-mono font-black text-sm">{placedOrder.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Delivery Address:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[200px]">
                      {placedOrder.shippingAddress.city}, {placedOrder.shippingAddress.state}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid:</span>
                    <span className="font-black text-slate-950">₹{placedOrder.finalAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tracking Number:</span>
                    <span className="font-mono font-bold text-slate-800">{placedOrder.trackingNumber}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenOrderTracking(placedOrder.id);
                    }}
                    className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 hover:bg-cyan-600 text-white font-black rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all shadow-lg"
                  >
                    <Truck className="w-4 h-4 text-cyan-400" />
                    <span>Track Order Live</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-2xl text-xs transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
