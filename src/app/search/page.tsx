"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ArrowLeft, Sparkles, Filter, SlidersHorizontal } from "lucide-react";
import { useTechAiStore } from "@/lib/store";
import { Product } from "@/lib/types";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import CartDrawer from "@/components/CartDrawer";
import AuthModal from "@/components/AuthModal";
import MiniCartToast from "@/components/MiniCartToast";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = useTechAiStore();

  const query = searchParams.get("q") || "";
  const [localQuery, setLocalQuery] = useState(query);
  const [sortBy, setSortBy] = useState<"featured" | "price-low" | "price-high" | "rating">("featured");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<Product | null>(null);

  const cartCount = store.cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredProducts = useMemo(() => {
    const cleanSearch = (query || localQuery).trim().toLowerCase();
    if (!cleanSearch) return store.products;

    return store.products
      .filter(
        (p) =>
          p.title.toLowerCase().includes(cleanSearch) ||
          p.brand.toLowerCase().includes(cleanSearch) ||
          p.category.toLowerCase().includes(cleanSearch)
      )
      .sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "rating") return b.rating - a.rating;
        return 0;
      });
  }, [store.products, query, localQuery, sortBy]);

  const handleAddToCart = (product: Product) => {
    store.addToCart(product, 1);
    setLastAddedProduct(product);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950 pb-20 md:pb-0">
      <Navbar
        cartCount={cartCount}
        wishlistCount={store.wishlist.length}
        user={store.user}
        searchQuery={localQuery}
        setSearchQuery={setLocalQuery}
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-xs text-slate-500 mb-5">
          <Link href="/" className="hover:text-slate-900 transition-colors flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-bold">Search Results</span>
        </div>

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Results for "{query || localQuery || "All Products"}"</span>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {filteredProducts.length} items
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Verified products with fast doorstep delivery
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold self-start sm:self-auto">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent focus:outline-none text-slate-900 font-bold cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Customer Rating</option>
            </select>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs max-w-lg mx-auto">
            <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">No products found</h3>
            <p className="text-xs text-slate-500">
              We couldn't find matches for "{query}". Try checking for spelling or explore our popular categories.
            </p>
            <Link
              href="/"
              className="inline-flex px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Explore Storefront
            </Link>
          </div>
        ) : (
          <div
            className={`grid gap-3 sm:gap-4 items-stretch ${
              filteredProducts.length === 1
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-xl"
                : filteredProducts.length === 2
                ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl"
                : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            }`}
          >
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isInWishlist={store.wishlist.includes(product.id)}
                onAddToCart={handleAddToCart}
                onQuickView={(p) => router.push(`/product/${encodeURIComponent(p.id)}`)}
                onToggleWishlist={store.toggleWishlist}
              />
            ))}
          </div>
        )}
      </main>

      <Footer
        onOpenTracking={() => router.push("/orders")}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSelectCategory={() => router.push("/")}
      />

      <MiniCartToast
        product={lastAddedProduct}
        onClose={() => setLastAddedProduct(null)}
        onViewCart={() => setIsCartOpen(true)}
        onCheckout={() => {
          if (store.user) router.push("/orders");
          else setIsAuthOpen(true);
        }}
      />

      <CartDrawer
        isOpen={isCartOpen}
        cart={store.cart}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={store.updateCartQuantity}
        onRemoveItem={store.removeFromCart}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          if (store.user) router.push("/orders");
          else setIsAuthOpen(true);
        }}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => {
          store.setAuthenticatedUser(user);
          setIsAuthOpen(false);
        }}
      />

      <MobileBottomNav
        cartCount={cartCount}
        wishlistCount={store.wishlist.length}
        activeTab="search"
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCategories={() => router.push("/")}
        onOpenSearch={() => {}}
        onOpenAuth={() => {
          if (store.user) router.push("/orders");
          else setIsAuthOpen(true);
        }}
        onResetHome={() => router.push("/")}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 p-8 text-center text-xs">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
