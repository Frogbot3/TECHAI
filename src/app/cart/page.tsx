"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { useTechAiStore } from "@/lib/store";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import CheckoutModal from "@/components/CheckoutModal";

export default function CartPage() {
  const router = useRouter();
  const store = useTechAiStore();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  const cartCount = store.cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = store.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalMrp = store.cart.reduce(
    (sum, item) => sum + (item.product.originalPrice || item.product.price) * item.quantity,
    0
  );
  const totalSavings = totalMrp - subtotal;
  const shippingFee = subtotal > 499 || subtotal === 0 ? 0 : 49;
  const discountAmount = appliedCoupon === "TECHAI10" ? Math.round(subtotal * 0.1) : 0;
  const finalTotal = subtotal - discountAmount + shippingFee;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === "TECHAI10") {
      setAppliedCoupon("TECHAI10");
    }
  };

  const handleProceed = () => {
    if (store.user) {
      setIsCheckoutOpen(true);
    } else {
      setIsAuthOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950 pb-20 md:pb-0">
      <Navbar
        cartCount={cartCount}
        wishlistCount={store.wishlist.length}
        user={store.user}
        searchQuery=""
        setSearchQuery={() => {}}
        selectedCategory="All Categories"
        setSelectedCategory={() => router.push("/")}
        products={store.products}
        onOpenCart={() => {}}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenTracking={() => router.push("/orders")}
        onSelectProduct={(p) => router.push(`/product/${encodeURIComponent(p.id)}`)}
        onLogout={store.logoutUser}
        onResetHome={() => router.push("/")}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs text-slate-500 mb-5">
          <Link href="/" className="hover:text-slate-900 transition-colors flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Shopping Cart</span>
        </div>

        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <span>Shopping Cart</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
              {cartCount} items
            </span>
          </h1>

          {store.cart.length > 0 && (
            <button
              type="button"
              onClick={store.clearCart}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Cart</span>
            </button>
          )}
        </div>

        {store.cart.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center max-w-md mx-auto my-8 space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <ShoppingCart className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Your cart is empty</h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Explore our catalog for the latest electronics, smartphones, and daily essentials.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Two Column Cart Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Cart Items List */}
            <div className="lg:col-span-8 space-y-3">
              {store.cart.map((item) => (
                <div
                  key={item.product.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <Link
                      href={`/product/${encodeURIComponent(item.product.id)}`}
                      className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-100 p-2 flex items-center justify-center flex-shrink-0"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.title}
                        className="max-h-full max-w-full object-contain"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {item.product.brand}
                      </p>
                      <Link
                        href={`/product/${encodeURIComponent(item.product.id)}`}
                        className="text-xs sm:text-sm font-bold text-slate-900 hover:text-cyan-700 transition-colors line-clamp-2"
                      >
                        {item.product.title}
                      </Link>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-sm sm:text-base font-black text-slate-950">
                          ₹{item.product.price.toLocaleString("en-IN")}
                        </span>
                        {item.product.originalPrice > item.product.price && (
                          <span className="text-xs text-slate-400 line-through">
                            ₹{item.product.originalPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Delete */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden shadow-xs">
                      <button
                        type="button"
                        onClick={() => store.updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="p-1.5 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Decrease"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold text-slate-900">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => store.updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="p-1.5 text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Increase"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => store.removeFromCart(item.product.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Right: Order Summary Card */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-5 sticky top-24">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Price Details ({cartCount} {cartCount === 1 ? "Item" : "Items"})
              </h2>

              <div className="space-y-2.5 text-xs text-slate-600 border-b border-slate-100 pb-4">
                <div className="flex justify-between">
                  <span>Total MRP</span>
                  <span>₹{totalMrp.toLocaleString("en-IN")}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount on MRP</span>
                    <span>-₹{totalSavings.toLocaleString("en-IN")}</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Coupon Discount (TECHAI10)</span>
                    <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>
                    {shippingFee === 0 ? (
                      <strong className="text-emerald-700 font-bold">FREE</strong>
                    ) : (
                      `₹${shippingFee}`
                    )}
                  </span>
                </div>
              </div>

              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter TECHAI10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </form>
              {appliedCoupon && (
                <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 -mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 10% coupon applied!
                </p>
              )}

              {/* Total Amount */}
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                <span className="text-sm font-extrabold text-slate-900">Total Amount</span>
                <span className="text-xl font-black text-slate-950">
                  ₹{finalTotal.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Checkout Button */}
              <button
                type="button"
                onClick={handleProceed}
                className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-cyan-600" />
                <span>Safe and Secure Payments via UPI & Cards</span>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer
        onOpenTracking={() => router.push("/orders")}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSelectCategory={() => router.push("/")}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => {
          store.setAuthenticatedUser(user);
          setIsAuthOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        cart={store.cart}
        user={store.user}
        onClose={() => setIsCheckoutOpen(false)}
        onCreateOrder={store.createOrder}
        onOpenOrderTracking={() => router.push("/orders")}
      />

      <MobileBottomNav
        cartCount={cartCount}
        wishlistCount={store.wishlist.length}
        activeTab="cart"
        onOpenCart={() => {}}
        onOpenCategories={() => router.push("/")}
        onOpenSearch={() => router.push("/")}
        onOpenAuth={() => {
          if (store.user) router.push("/orders");
          else setIsAuthOpen(true);
        }}
        onResetHome={() => router.push("/")}
      />
    </div>
  );
}
