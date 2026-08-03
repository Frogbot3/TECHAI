"use client";

import React, { useState } from "react";
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
  Sparkles
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
    discountCode?: string
  ) => Promise<Order> | Order;
  onOpenOrderTracking: (orderId: string) => void;
}

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
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: user?.name || "Alex Rivera",
    phone: user?.phone || "+91 9876543210",
    email: user?.email || "alex@techai.com",
    street: "Flat 402, HighTech Tech Park Avenue",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560100",
    landmark: "Near Silicon Square"
  });

  const [cardNumber, setCardNumber] = useState("4532 8910 2341 8901");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("892");

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const discount = appliedCoupon === "TECHAI10" ? Math.round(subtotal * 0.1) : 0;
  const shippingFee = subtotal > 499 ? 0 : 49;
  const finalTotal = subtotal - discount + shippingFee;

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.fullName || !address.phone || !address.street || !address.pincode) {
      alert("Please fill in all mandatory delivery fields");
      return;
    }
    setStep("PAYMENT");
  };

  const handlePaymentSubmit = async () => {
    setStep("PROCESSING");

    try {
      const order = await Promise.resolve(onCreateOrder(address, paymentMethod, appliedCoupon));
      setPlacedOrder(order);
      setStep("SUCCESS");

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        console.log("Confetti burst", e);
      }
    } catch (e) {
      alert("Unable to complete your order. Please try again.");
      setStep("PAYMENT");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-100 relative my-auto"
        >
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-extrabold">TECH AI Secure Checkout</h3>
            </div>
            {step !== "PROCESSING" && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="p-6 sm:p-8">
            {step !== "SUCCESS" && step !== "PROCESSING" && (
              <div className="flex items-center justify-between mb-8 max-w-sm mx-auto text-xs font-bold">
                <div className={`flex items-center space-x-2 ${step === "ADDRESS" ? "text-cyan-600" : "text-slate-400"}`}>
                  <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center text-xs">1</span>
                  <span>Address</span>
                </div>
                <div className="w-12 h-0.5 bg-slate-200"></div>
                <div className={`flex items-center space-x-2 ${step === "PAYMENT" ? "text-cyan-600" : "text-slate-400"}`}>
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs">2</span>
                  <span>Payment</span>
                </div>
              </div>
            )}

            {step === "ADDRESS" && (
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-cyan-600" />
                  <span>Delivery Address</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Street / Flat / Locality *</label>
                  <input
                    type="text"
                    required
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">City *</label>
                    <input
                      type="text"
                      required
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">State *</label>
                    <input
                      type="text"
                      required
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Pincode *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={address.pincode}
                      onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:outline-none font-bold"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-slate-500">Payable Amount: </span>
                    <span className="font-extrabold text-slate-900 text-sm">₹{finalTotal.toLocaleString()}</span>
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-slate-900 hover:bg-cyan-600 text-white text-xs font-bold rounded-xl flex items-center space-x-2 transition-all"
                  >
                    <span>Continue to Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {step === "PAYMENT" && (
              <div className="space-y-6">
                <h4 className="text-sm font-extrabold text-slate-900">Select Payment Method</h4>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("UPI")}
                    className={`p-3.5 rounded-2xl border text-left flex items-center space-x-3 transition-all ${
                      paymentMethod === "UPI"
                        ? "border-cyan-600 bg-cyan-50/50 ring-2 ring-cyan-500/20"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-cyan-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">UPI Instant</p>
                      <p className="text-[10px] text-slate-500">Google Pay, PhonePe, Paytm</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("Card")}
                    className={`p-3.5 rounded-2xl border text-left flex items-center space-x-3 transition-all ${
                      paymentMethod === "Card"
                        ? "border-cyan-600 bg-cyan-50/50 ring-2 ring-cyan-500/20"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Credit / Debit Card</p>
                      <p className="text-[10px] text-slate-500">Visa, Mastercard, RuPay</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("NetBanking")}
                    className={`p-3.5 rounded-2xl border text-left flex items-center space-x-3 transition-all ${
                      paymentMethod === "NetBanking"
                        ? "border-cyan-600 bg-cyan-50/50 ring-2 ring-cyan-500/20"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Net Banking</p>
                      <p className="text-[10px] text-slate-500">All Major Banks</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("COD")}
                    className={`p-3.5 rounded-2xl border text-left flex items-center space-x-3 transition-all ${
                      paymentMethod === "COD"
                        ? "border-cyan-600 bg-cyan-50/50 ring-2 ring-cyan-500/20"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">Cash on Delivery</p>
                      <p className="text-[10px] text-slate-500">Pay cash upon arrival</p>
                    </div>
                  </button>
                </div>

                {paymentMethod === "UPI" && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center space-x-4">
                    <div className="w-20 h-20 bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center">
                      <QrCode className="w-14 h-14 text-slate-800" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800">Scan QR Code or Enter VPA</p>
                      <p className="text-[11px] text-slate-500">VPA: <strong>techai@upi</strong></p>
                      <span className="inline-block bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded">
                        Zero Payment Gateway Fee
                      </span>
                    </div>
                  </div>
                )}

                {paymentMethod === "Card" && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">CVV Code</label>
                        <input
                          type="password"
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep("ADDRESS")}
                    className="text-xs text-slate-500 hover:text-slate-800 font-medium"
                  >
                    Back to Address
                  </button>
                  <button
                    type="button"
                    onClick={handlePaymentSubmit}
                    className="px-8 py-3 bg-slate-900 hover:bg-cyan-600 text-white text-xs font-bold rounded-2xl shadow-lg transition-all flex items-center space-x-2"
                  >
                    <span>Pay ₹{finalTotal.toLocaleString()} & Place Order</span>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </button>
                </div>
              </div>
            )}

            {step === "PROCESSING" && (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <Loader2 className="w-12 h-12 text-cyan-600 animate-spin" />
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">Processing Payment...</h4>
                  <p className="text-xs text-slate-500 mt-1">Please do not refresh or close this window</p>
                </div>
              </div>
            )}

            {step === "SUCCESS" && placedOrder && (
              <div className="text-center space-y-6 py-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Order Successfully Placed!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Thank you for shopping at TECH AI. Your order confirmation is below.
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2 max-w-md mx-auto text-xs">
                  <div className="flex justify-between border-b border-slate-200 pb-2 font-bold">
                    <span>Order ID</span>
                    <span className="text-cyan-700 font-mono">{placedOrder.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Items Ordered:</span>
                    <span className="font-semibold">{placedOrder.items.length} Product(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Paid:</span>
                    <span className="font-extrabold text-slate-900">₹{placedOrder.finalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Delivery:</span>
                    <span className="font-bold text-emerald-600">{placedOrder.estimatedDelivery}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenOrderTracking(placedOrder.id);
                    }}
                    className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-cyan-600 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md"
                  >
                    <Package className="w-4 h-4" />
                    <span>Track Order Live</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                  >
                    Back to Store
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
