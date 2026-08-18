"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import TechAiLogo from "@/components/TechAiLogo";
import OrderTrackingModal from "@/components/OrderTrackingModal";
import InvoicePreviewModal from "@/components/InvoicePreviewModal";
import WriteReviewModal from "@/components/WriteReviewModal";
import CartDrawer from "@/components/CartDrawer";
import AuthModal from "@/components/AuthModal";
import { useTechAiStore } from "@/lib/store";
import { Order, Product } from "@/lib/types";
import { generateOrderInvoice } from "@/lib/generateInvoice";
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowLeft,
  FileText,
  MessageSquare,
  Repeat,
  Sparkles,
  ChevronRight,
  Filter,
  ShieldCheck,
  ShoppingBag,
  ExternalLink
} from "lucide-react";

export default function OrdersPage() {
  const store = useTechAiStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PLACED" | "SHIPPED" | "DELIVERED">("ALL");

  // Modals
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState("");
  const [invoiceModalOrder, setInvoiceModalOrder] = useState<Order | null>(null);
  const [reviewProduct, setReviewProduct] = useState<any | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const totalOrders = store.orders.length;
  const inTransitCount = store.orders.filter(
    (o) => o.status === "Processing" || o.status === "Shipped" || o.status === "Out for Delivery"
  ).length;
  const deliveredCount = store.orders.filter((o) => o.status === "Delivered").length;
  const totalSpent = store.orders.reduce((sum, o) => sum + o.finalAmount, 0);

  const filteredOrders = store.orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.some((i) => i.product.title.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === "PLACED") return order.status === "Placed" || order.status === "Processing";
    if (statusFilter === "SHIPPED") return order.status === "Shipped" || order.status === "Out for Delivery";
    if (statusFilter === "DELIVERED") return order.status === "Delivered";
    return true;
  });

  const handleOpenTracking = (orderId: string) => {
    setActiveTrackingOrderId(orderId);
    setTrackingModalOpen(true);
  };

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      store.addToCart(item.product, item.quantity);
    });
    setIsCartOpen(true);
  };

  const cartCount = store.cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950 pb-20 md:pb-0">
      <Navbar
        cartCount={cartCount}
        wishlistCount={store.wishlist.length}
        user={store.user}
        searchQuery=""
        setSearchQuery={() => {}}
        selectedCategory="All Categories"
        setSelectedCategory={() => {}}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenTracking={() => {
          setActiveTrackingOrderId("");
          setTrackingModalOpen(true);
        }}
        onLogout={store.logoutUser}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-xs font-black text-slate-600 hover:text-slate-950 flex items-center space-x-1.5 transition-colors bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-600" />
            <span>Back to Storefront</span>
          </Link>

          {store.user && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Signed in as {store.user.name || store.user.phone}</span>
            </span>
          )}
        </div>

        {/* Header Title & Metrics */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight flex items-center gap-2">
              <Package className="w-7 h-7 text-cyan-600" />
              <span>My Orders & Shipments</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              View all your placed orders, download tax invoices, write verified reviews, and track live courier shipments.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</span>
              <p className="text-xl font-black text-slate-950">{totalOrders}</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider">In Transit</span>
              <p className="text-xl font-black text-cyan-700">{inTransitCount}</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Delivered</span>
              <p className="text-xl font-black text-emerald-700">{deliveredCount}</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Spent</span>
              <p className="text-xl font-black text-slate-950">₹{totalSpent.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Order ID (e.g. TECHAI-ORD-12345), product name or AWB..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => {
                setActiveTrackingOrderId("");
                setTrackingModalOpen(true);
              }}
              className="px-5 py-2.5 bg-slate-900 hover:bg-cyan-600 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-md flex-shrink-0"
            >
              <Truck className="w-4 h-4 text-cyan-400" />
              <span>Track Any Courier</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 text-xs">
            <span className="font-bold text-slate-400 text-[11px] flex-shrink-0 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Filter:</span>
            </span>
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3.5 py-1.5 rounded-xl border font-bold text-xs whitespace-nowrap transition-colors ${
                statusFilter === "ALL"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              All Orders ({totalOrders})
            </button>
            <button
              onClick={() => setStatusFilter("PLACED")}
              className={`px-3.5 py-1.5 rounded-xl border font-bold text-xs whitespace-nowrap transition-colors ${
                statusFilter === "PLACED"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Confirmed & Packed
            </button>
            <button
              onClick={() => setStatusFilter("SHIPPED")}
              className={`px-3.5 py-1.5 rounded-xl border font-bold text-xs whitespace-nowrap transition-colors ${
                statusFilter === "SHIPPED"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              In Transit / Out for Delivery ({inTransitCount})
            </button>
            <button
              onClick={() => setStatusFilter("DELIVERED")}
              className={`px-3.5 py-1.5 rounded-xl border font-bold text-xs whitespace-nowrap transition-colors ${
                statusFilter === "DELIVERED"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Delivered ({deliveredCount})
            </button>
          </div>
        </div>

        {/* Orders Feed */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Package className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">No orders found</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {searchQuery
                    ? "Try searching for a different order ID or product keyword."
                    : "You haven't placed any orders yet. Discover trending AI gadgets!"}
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-cyan-600 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md"
              >
                <ShoppingBag className="w-4 h-4 text-cyan-400" />
                <span>Start Shopping</span>
              </Link>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              const isDelivered = order.status === "Delivered";

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden hover:border-slate-300 transition-all space-y-4 p-5 sm:p-6"
                >
                  {/* Order Card Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-950 text-sm">#{order.id}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] flex items-center gap-1.5 ${
                            isDelivered
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-cyan-100 text-cyan-800 border border-cyan-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isDelivered ? "bg-emerald-600" : "bg-cyan-600 animate-ping"
                            }`}
                          />
                          <span>{order.status}</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">Placed on {orderDate}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-slate-500 font-medium">Total Amount:</span>
                      <span className="font-black text-slate-950 text-sm sm:text-base">
                        ₹{order.finalAmount.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {order.paymentMethod} • {order.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img
                            src={item.product.image}
                            alt={item.product.title}
                            className="w-14 h-14 object-contain bg-white rounded-xl p-1 border border-slate-200 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {item.product.brand || "TECH AI"}
                            </span>
                            <h4 className="font-extrabold text-slate-900 text-xs truncate max-w-md">
                              {item.product.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                              Qty: {item.quantity} × ₹{item.product.price.toLocaleString("en-IN")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                          {/* Write Review Button */}
                          <button
                            onClick={() => setReviewProduct(item.product)}
                            className="px-3 py-1.5 bg-white hover:bg-cyan-50 text-slate-800 hover:text-cyan-700 font-extrabold text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors shadow-sm"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-cyan-600" />
                            <span>Write Review</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Delivery & Quick Actions Bottom Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-cyan-600 flex-shrink-0" />
                      <span className="truncate max-w-xs text-[11px]">
                        Deliver to: {order.shippingAddress.fullName}, {order.shippingAddress.city} - {order.shippingAddress.pincode}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Track Live Order */}
                      <button
                        onClick={() => handleOpenTracking(order.id)}
                        className="px-4 py-2 bg-slate-900 hover:bg-cyan-600 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md"
                      >
                        <Truck className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Track Live Courier</span>
                      </button>

                      {/* View / Download Invoice */}
                      <button
                        onClick={() => setInvoiceModalOrder(order)}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-600" />
                        <span>Tax Invoice</span>
                      </button>

                      {/* Reorder / Buy Again */}
                      <button
                        onClick={() => handleReorder(order)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                        title="Re-add items to cart"
                      >
                        <Repeat className="w-3.5 h-3.5 text-slate-600" />
                        <span>Reorder</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Modals */}
      <OrderTrackingModal
        isOpen={trackingModalOpen}
        orders={store.orders}
        initialOrderId={activeTrackingOrderId}
        onClose={() => setTrackingModalOpen(false)}
        onOpenInvoice={(ord) => setInvoiceModalOrder(ord)}
        onWriteReview={(prod) => setReviewProduct(prod)}
      />

      <InvoicePreviewModal
        isOpen={!!invoiceModalOrder}
        order={invoiceModalOrder}
        onClose={() => setInvoiceModalOrder(null)}
      />

      <WriteReviewModal
        isOpen={!!reviewProduct}
        product={reviewProduct}
        user={store.user}
        onClose={() => setReviewProduct(null)}
        onReviewSubmitted={(productId, rev) => {
          store.addReviewToProduct(productId, rev);
        }}
      />

      <CartDrawer
        isOpen={isCartOpen}
        cart={store.cart}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={store.updateCartQuantity}
        onRemoveItem={store.removeFromCart}
        onProceedToCheckout={() => {}}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => {
          store.setAuthenticatedUser(user);
        }}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        cartCount={cartCount}
        wishlistCount={store.wishlist.length}
        activeTab="orders"
        onOpenCart={() => setIsCartOpen(true)}
      />
    </div>
  );
}
