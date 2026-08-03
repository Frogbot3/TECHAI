"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CartItem } from "@/lib/types";
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingCart, Tag, Trash2, X } from "lucide-react";

interface CartDrawerProps {
  isOpen: boolean;
  cart: CartItem[];
  onClose: () => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onProceedToCheckout: (couponCode?: string) => void;
}

export default function CartDrawer({
  isOpen,
  cart,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
}: CartDrawerProps) {
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discount = appliedCoupon === "TECHAI10" ? Math.round(subtotal * 0.1) : 0;
  const shippingFee = subtotal > 499 || cart.length === 0 ? 0 : 49;
  const finalTotal = subtotal - discount + shippingFee;

  const handleApplyCoupon = () => {
    if (coupon.trim().toUpperCase() === "TECHAI10") {
      setAppliedCoupon("TECHAI10");
    } else {
      alert("Coupon not valid. Try TECHAI10.");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50">
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 220 }}
          className="flex h-full w-full max-w-md flex-col bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-slate-700" />
              <h2 className="text-base font-extrabold text-slate-950">Cart</h2>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
            <button onClick={onClose} className="rounded-md p-2 text-slate-500 hover:bg-slate-100" aria-label="Close cart">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <ShoppingCart className="h-7 w-7" />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Your cart is empty</p>
                  <p className="mt-1 text-sm text-slate-500">Add products to continue checkout.</p>
                </div>
                <button onClick={onClose} className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800">
                  Continue shopping
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product.id} className="grid grid-cols-[72px_1fr_auto] gap-3 rounded-lg border border-slate-200 bg-white p-3">
                  <img src={item.product.image} alt={item.product.title} className="h-[72px] w-[72px] rounded-md bg-slate-50 object-contain p-1" />
                  <div className="min-w-0 space-y-2">
                    <h4 className="line-clamp-2 text-sm font-semibold text-slate-900">{item.product.title}</h4>
                    <p className="text-xs text-slate-500">Rs. {item.product.price.toLocaleString("en-IN")} each</p>
                    <div className="flex w-fit items-center rounded-md border border-slate-200">
                      <button onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)} className="p-1.5 text-slate-600 hover:bg-slate-50">
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-8 px-2 text-center text-sm font-bold text-slate-900">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)} className="p-1.5 text-slate-600 hover:bg-slate-50">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => onRemoveItem(item.product.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Remove item">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <span className="text-sm font-extrabold text-slate-950">Rs. {(item.product.price * item.quantity).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50 p-4 space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <button onClick={handleApplyCoupon} className="rounded-md bg-slate-900 px-4 text-sm font-bold text-white hover:bg-slate-800">
                  Apply
                </button>
              </div>

              {appliedCoupon && (
                <div className="flex items-center justify-between rounded-md bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                  <span>{appliedCoupon} applied</span>
                  <button onClick={() => setAppliedCoupon(null)} className="text-red-600">Remove</button>
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">Rs. {subtotal.toLocaleString("en-IN")}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount</span>
                    <span>- Rs. {discount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Delivery</span>
                  <span className="font-semibold text-slate-900">{shippingFee === 0 ? "Free" : `Rs. ${shippingFee}`}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-extrabold text-slate-950">
                  <span>Total</span>
                  <span>Rs. {finalTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onProceedToCheckout(appliedCoupon || undefined);
                  onClose();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-amber-400 py-3 text-sm font-extrabold text-slate-950 hover:bg-amber-500"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Address and payment reference are saved securely.</span>
              </div>
            </div>
          )}
        </motion.aside>
      </div>
    </AnimatePresence>
  );
}
