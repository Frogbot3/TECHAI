"use client";

import React, { useState, useMemo } from "react";
import { useTechAiStore } from "@/lib/store";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import HeroCarousel from "@/components/HeroCarousel";
import ProductCard from "@/components/ProductCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import CartDrawer from "@/components/CartDrawer";
import AuthModal from "@/components/AuthModal";
import CheckoutModal from "@/components/CheckoutModal";
import OrderTrackingModal from "@/components/OrderTrackingModal";
import InvoicePreviewModal from "@/components/InvoicePreviewModal";
import WriteReviewModal from "@/components/WriteReviewModal";
import TechAiLogo from "@/components/TechAiLogo";
import { Product, CartItem, ShippingAddress, Order } from "@/lib/types";
import { Sparkles, ShieldCheck, Truck, RefreshCw, Filter, SlidersHorizontal, Package, Heart } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const store = useTechAiStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState<"featured" | "price-low" | "price-high" | "rating">("featured");

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>(undefined);
  const [trackingOrderId, setTrackingOrderId] = useState<string>("");
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);
  const [reviewProduct, setReviewProduct] = useState<any | null>(null);

  const filteredProducts = useMemo(() => {
    return store.products
      .filter((product) => {
        const matchesCategory =
          selectedCategory === "All Categories" || product.category === selectedCategory;
        const matchesSearch =
          product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "rating") return b.rating - a.rating;
        return 0;
      });
  }, [store.products, selectedCategory, searchQuery, sortBy]);

  const handleBuyNow = (product: Product, quantity: number) => {
    store.addToCart(product, quantity);
    setQuickViewProduct(null);
    if (!store.user) {
      setIsAuthOpen(true);
    } else {
      setIsCheckoutOpen(true);
    }
  };

  const handleProceedToCheckout = (couponCode?: string) => {
    setAppliedCoupon(couponCode);
    if (!store.user) {
      setIsAuthOpen(true);
    } else {
      setIsCheckoutOpen(true);
    }
  };

  const cartCount = store.cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950 pb-20 md:pb-0">
      <Navbar
        cartCount={cartCount}
        wishlistCount={store.wishlist.length}
        user={store.user}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenTracking={() => {
          setTrackingOrderId("");
          setIsTrackingOpen(true);
        }}
        onLogout={store.logoutUser}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto pb-16">
        {selectedCategory === "All Categories" && !searchQuery && (
          <HeroCarousel onExploreCategory={(cat) => setSelectedCategory(cat)} />
        )}

        <div className="px-4 sm:px-6 lg:px-8 pt-8 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center space-x-2">
              <span>{selectedCategory}</span>
              <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2.5 py-0.5 rounded-full">
                {filteredProducts.length} items
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Explore authentic AI gadgets, luxury watches, cleats, and stress toys at TECH AI.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-white px-3.5 py-2 rounded-2xl border border-slate-200 shadow-sm text-xs font-bold">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent focus:outline-none text-slate-900 font-extrabold cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No products found</h3>
              <p className="text-xs text-slate-500">Try searching for a different keyword or category.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All Categories");
                }}
                className="px-5 py-2.5 bg-slate-900 text-white rounded-full text-xs font-bold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6 items-stretch">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isInWishlist={store.wishlist.includes(product.id)}
                  onAddToCart={store.addToCart}
                  onQuickView={(p) => setQuickViewProduct(p)}
                  onToggleWishlist={store.toggleWishlist}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pt-12 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 text-xs">
          <div className="space-y-4">
            <TechAiLogo size="md" />
            <p className="text-slate-400 leading-relaxed">
              TECH AI is your trusted destination for cutting-edge spatial electronics, lifestyle innovations, luxury sports gear, and anti-stress companions.
            </p>
          </div>

          <div>
            <h4 className="font-extrabold text-white uppercase tracking-wider mb-3">Shop Categories</h4>
            <ul className="space-y-2">
              <li><button onClick={() => setSelectedCategory("AI Electronics")} className="hover:text-white">AI Electronics</button></li>
              <li><button onClick={() => setSelectedCategory("Toys & Stress Relief")} className="hover:text-white">Toys & Stress Relief</button></li>
              <li><button onClick={() => setSelectedCategory("Fashion")} className="hover:text-white">Fashion & Wearables</button></li>
              <li><button onClick={() => setSelectedCategory("Mobiles & Wearables")} className="hover:text-white">Mobiles & Wearables</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-white uppercase tracking-wider mb-3">Customer Care</h4>
            <ul className="space-y-2">
              <li><Link href="/orders" className="hover:text-cyan-400 font-bold text-slate-300">My Orders & Invoices</Link></li>
              <li><button onClick={() => setIsTrackingOpen(true)} className="hover:text-white">Live Order Tracking</button></li>
              <li><button onClick={() => setIsAuthOpen(true)} className="hover:text-white">Account Login & OTP</button></li>
              <li><Link href="/admin/login" className="hover:text-amber-400 text-slate-300 font-bold">Admin Control Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-extrabold text-white uppercase tracking-wider mb-3">Guaranteed Security</h4>
            <p className="text-slate-400 mb-3">256-bit SSL encrypted checkout powered by TECH AI Gateway.</p>
            <div className="flex items-center space-x-2 text-white font-bold bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>100% Genuine & Verified Store</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} TECH AI Inc. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Support</span>
          </div>
        </div>
      </footer>

      {/* Product Quick View & Reviews Modal */}
      <ProductDetailModal
        product={quickViewProduct}
        user={store.user}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={store.addToCart}
        onBuyNow={handleBuyNow}
        onReviewSubmitted={store.addReviewToProduct}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        cart={store.cart}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={store.updateCartQuantity}
        onRemoveItem={store.removeFromCart}
        onProceedToCheckout={handleProceedToCheckout}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => {
          store.setAuthenticatedUser(user);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Overhauled Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        cart={store.cart}
        appliedCoupon={appliedCoupon}
        user={store.user}
        onClose={() => setIsCheckoutOpen(false)}
        onCreateOrder={store.createOrder}
        onOpenOrderTracking={(orderId) => {
          setTrackingOrderId(orderId);
          setIsTrackingOpen(true);
        }}
      />

      {/* Animated Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={isTrackingOpen}
        orders={store.orders}
        initialOrderId={trackingOrderId}
        onClose={() => setIsTrackingOpen(false)}
        onOpenInvoice={(ord) => setActiveInvoiceOrder(ord)}
        onWriteReview={(prod) => setReviewProduct(prod)}
      />

      {/* Printable Invoice Modal */}
      <InvoicePreviewModal
        isOpen={!!activeInvoiceOrder}
        order={activeInvoiceOrder}
        onClose={() => setActiveInvoiceOrder(null)}
      />

      {/* Standalone Write Review Modal */}
      <WriteReviewModal
        isOpen={!!reviewProduct}
        product={reviewProduct}
        user={store.user}
        onClose={() => setReviewProduct(null)}
        onReviewSubmitted={(productId, rev) => {
          store.addReviewToProduct(productId, rev);
        }}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        cartCount={cartCount}
        wishlistCount={store.wishlist.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => {
          if (!store.user) setIsAuthOpen(true);
        }}
      />
    </div>
  );
}
