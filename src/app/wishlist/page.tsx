"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowLeft,
  Star,
  Package,
  Truck,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useTechAiStore } from "@/lib/store";
import { Product } from "@/lib/types";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import AuthModal from "@/components/AuthModal";
import MiniCartToast from "@/components/MiniCartToast";

export default function WishlistPage() {
  const router = useRouter();
  const store = useTechAiStore();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<Product | null>(null);

  const cartCount = store.cart.reduce((sum, item) => sum + item.quantity, 0);

  // Products matching wishlist IDs
  const wishlistProducts = store.products.filter((p) =>
    store.wishlist.includes(p.id)
  );

  const handleAddToCart = (product: Product) => {
    store.addToCart(product, 1);
    setLastAddedProduct(product);
  };

  const handleMoveToCart = (product: Product) => {
    store.addToCart(product, 1);
    store.removeFromWishlist(product.id);
    setLastAddedProduct(product);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-cyan-500 selection:text-slate-950 pb-20 md:pb-0">
      {/* 1. Header */}
      <Navbar
        cartCount={cartCount}
        wishlistCount={store.wishlist.length}
        user={store.user}
        searchQuery=""
        setSearchQuery={() => {}}
        selectedCategory="All Categories"
        setSelectedCategory={() => router.push("/")}
        products={store.products}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenTracking={() => router.push("/orders")}
        onSelectProduct={(p) => router.push(`/product/${encodeURIComponent(p.id)}`)}
        onLogout={store.logoutUser}
        onResetHome={() => router.push("/")}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between gap-2 mb-5">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Link
              href="/"
              className="hover:text-slate-900 transition-colors flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">My Wishlist</span>
          </div>

          {wishlistProducts.length > 0 && (
            <button
              type="button"
              onClick={store.clearWishlist}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Wishlist</span>
            </button>
          )}
        </div>

        {/* Page Title */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <span>My Wishlist</span>
              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {store.wishlist.length} {store.wishlist.length === 1 ? "item" : "items"}
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Saved products you are watching or planning to buy
            </p>
          </div>
        </div>

        {/* Guest Sync Banner */}
        {!store.user && store.wishlist.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-cyan-50 border border-cyan-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-600 text-white flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-cyan-950">
                  Save your wishlist permanently across devices
                </p>
                <p className="text-cyan-800 text-[11px]">
                  Sign in or create a free account to sync your saved products to the cloud.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer self-start sm:self-auto flex-shrink-0"
            >
              Sign In to Sync
            </button>
          </div>
        )}

        {/* Wishlist Items Grid or Empty State */}
        {wishlistProducts.length === 0 ? (
          /* Empty State */
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center max-w-md mx-auto my-8 space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500">
              <Heart className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">Your wishlist is empty</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Explore our catalog of certified electronics, wearables, and essentials to save items you love.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                <span>Explore Storefront</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Product Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {wishlistProducts.map((product) => {
              const isOutOfStock = product.stock <= 0;
              return (
                <article
                  key={product.id}
                  className="group relative flex flex-col justify-between bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all overflow-hidden p-3.5"
                >
                  {/* Top Badge & Delete */}
                  <div className="flex items-center justify-between mb-2">
                    {product.discountPercent > 0 ? (
                      <span className="rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        {product.discountPercent}% OFF
                      </span>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={() => store.removeFromWishlist(product.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove from Wishlist"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Image */}
                  <Link
                    href={`/product/${encodeURIComponent(product.id)}`}
                    className="relative aspect-square w-full bg-slate-50 rounded-xl border border-slate-100 p-4 flex items-center justify-center overflow-hidden mb-3 group-hover:bg-slate-100/60 transition-colors"
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.title}
                        className="h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <Package className="w-10 h-10 text-slate-300" />
                    )}
                  </Link>

                  {/* Details */}
                  <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {product.brand}
                      </p>
                      <Link
                        href={`/product/${encodeURIComponent(product.id)}`}
                        className="block text-xs sm:text-sm font-bold text-slate-900 line-clamp-2 hover:text-cyan-700 transition-colors min-h-[34px] leading-snug"
                      >
                        {product.title}
                      </Link>

                      {/* Rating */}
                      <div className="flex items-center gap-1 text-xs pt-1">
                        <div className="flex items-center text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="ml-1 font-bold text-slate-900 text-[11px]">
                            {product.rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-slate-400 text-[11px]">
                          ({product.reviewCount.toLocaleString()})
                        </span>
                      </div>
                    </div>

                    {/* Price & Stock Strip */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-baseline gap-1.5 flex-wrap">
                        <span className="text-base font-black text-slate-950">
                          ₹{product.price.toLocaleString("en-IN")}
                        </span>
                        {product.originalPrice > product.price && (
                          <span className="text-xs text-slate-400 line-through">
                            ₹{product.originalPrice.toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      {/* Availability status */}
                      <div className="text-[11px] font-semibold flex items-center justify-between">
                        {isOutOfStock ? (
                          <span className="text-rose-600 font-bold">Currently Out of Stock</span>
                        ) : product.stock <= 5 ? (
                          <span className="text-amber-600 font-bold">Only {product.stock} left in stock</span>
                        ) : (
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <Truck className="w-3 h-3" /> In Stock & Ready to Ship
                          </span>
                        )}
                      </div>

                      {/* Move to Cart Action */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleMoveToCart(product)}
                          className={`flex-1 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer ${
                            isOutOfStock
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-slate-900 hover:bg-slate-800 text-white active:scale-98"
                          }`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
                          <span>Move to Cart</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer
        onOpenTracking={() => router.push("/orders")}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSelectCategory={() => router.push("/")}
      />

      {/* Toast Feedback */}
      <MiniCartToast
        product={lastAddedProduct}
        onClose={() => setLastAddedProduct(null)}
        onViewCart={() => setIsCartOpen(true)}
        onCheckout={() => {
          if (store.user) {
            window.location.assign("/orders");
          } else {
            setIsAuthOpen(true);
          }
        }}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        cart={store.cart}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={store.updateCartQuantity}
        onRemoveItem={store.removeFromCart}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          if (store.user) {
            window.location.assign("/orders");
          } else {
            setIsAuthOpen(true);
          }
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(u) => {
          store.setAuthenticatedUser(u);
          setIsAuthOpen(false);
        }}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        cartCount={cartCount}
        wishlistCount={store.wishlist.length}
        activeTab="home"
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => {
          if (store.user) {
            router.push("/orders");
          } else {
            setIsAuthOpen(true);
          }
        }}
        onOpenCategories={() => router.push("/")}
        onOpenSearch={() => router.push("/")}
      />
    </div>
  );
}
