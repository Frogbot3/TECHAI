"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
  Zap,
  Heart,
  ChevronRight,
  Package,
} from "lucide-react";
import { useTechAiStore } from "@/lib/store";
import { Product } from "@/lib/types";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import CartDrawer from "@/components/CartDrawer";
import AuthModal from "@/components/AuthModal";
import CheckoutModal from "@/components/CheckoutModal";
import MiniCartToast from "@/components/MiniCartToast";
import ProductReviewsSection from "@/components/ProductReviewsSection";
import RecentlyViewedSection, { recordRecentlyViewed } from "@/components/RecentlyViewedSection";

type ProductTab = "overview" | "specifications" | "reviews";

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const store = useTechAiStore();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<ProductTab>("overview");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<Product | null>(null);

  const productId = useMemo(() => {
    try {
      return decodeURIComponent(params.slug || "");
    } catch {
      return params.slug || "";
    }
  }, [params.slug]);

  const product = store.products.find((item) => item.id === productId);
  const cartCount = store.cart.reduce((total, item) => total + item.quantity, 0);

  // Similar Products in the same category
  const similarProducts = useMemo(() => {
    if (!product) return [];
    return store.products
      .filter((p) => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [store.products, product]);

  const addToCart = (item: Product, itemQuantity = 1) => {
    store.addToCart(item, itemQuantity);
    recordRecentlyViewed(item.id);
    setLastAddedProduct(item);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, quantity);
    if (store.user) {
      setIsCheckoutOpen(true);
    } else {
      setIsAuthOpen(true);
    }
  };

  const handleCheckout = () => {
    if (store.user) {
      setIsCheckoutOpen(true);
    } else {
      setIsAuthOpen(true);
    }
  };

  if (!store.isLoaded) {
    return <ProductPageSkeleton />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
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
          onSelectProduct={(item) => router.push(`/product/${encodeURIComponent(item.id)}`)}
          onLogout={store.logoutUser}
          onResetHome={() => router.push("/")}
        />
        <main className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 py-12 text-center">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
            <h1 className="text-xl font-black text-slate-950">Product not found</h1>
            <p className="mt-2 text-sm text-slate-500">It may no longer be available or the link is incomplete.</p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to storefront
            </Link>
          </div>
        </main>
        <Footer
          onOpenTracking={() => router.push("/orders")}
          onOpenAuth={() => setIsAuthOpen(true)}
          onSelectCategory={() => router.push("/")}
        />
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= 5;
  const reviewLabel = product.reviews?.length || product.reviewCount;
  const isInWishlist = store.wishlist.includes(product.id);

  const galleryImages =
    product.images && product.images.length > 0 ? product.images : [product.image];
  const currentImage = galleryImages[selectedImageIndex] || product.image;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-900 md:pb-8 flex flex-col justify-between">
      {/* 1. Header */}
      <Navbar
        cartCount={cartCount}
        wishlistCount={store.wishlist.length}
        user={store.user}
        searchQuery=""
        setSearchQuery={() => {}}
        selectedCategory={product.category}
        setSelectedCategory={() => router.push("/")}
        products={store.products}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => (store.user ? router.push("/orders") : setIsAuthOpen(true))}
        onOpenTracking={() => router.push("/orders")}
        onSelectProduct={(item) => router.push(`/product/${encodeURIComponent(item.id)}`)}
        onLogout={store.logoutUser}
        onResetHome={() => router.push("/")}
      />

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-6 lg:px-8 flex-1">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/" className="inline-flex items-center gap-1.5 hover:text-cyan-700">
            <ArrowLeft className="h-3.5 w-3.5" />
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="hover:text-cyan-700 truncate cursor-pointer"
          >
            {product.category}
          </button>
          <span aria-hidden="true">/</span>
          <span className="truncate text-slate-900 font-bold max-w-xs">{product.title}</span>
        </nav>

        {/* Product Hero Layout */}
        <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6 lg:grid-cols-12 lg:gap-10 lg:p-8">
          {/* Left Column: Image Box & Gallery */}
          <div className="lg:col-span-5 space-y-3">
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 p-6 sm:p-10 shadow-inner">
              {product.discountPercent > 0 && (
                <span className="absolute left-3 top-3 rounded-md bg-rose-600 px-2 py-0.5 text-[11px] font-extrabold text-white shadow-xs">
                  {product.discountPercent}% OFF
                </span>
              )}

              {/* Wishlist Button on Product Page */}
              <button
                type="button"
                onClick={() => store.toggleWishlist(product.id)}
                className="absolute right-3 top-3 w-8 h-8 rounded-full bg-white/95 border border-slate-100 shadow-xs flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                title={isInWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
                aria-label="Toggle wishlist"
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    isInWishlist ? "fill-rose-500 text-rose-500" : "hover:text-rose-500"
                  }`}
                />
              </button>

              <img
                src={currentImage}
                alt={product.title}
                className="h-full w-full object-contain transition-all duration-300"
              />
            </div>

            {/* Thumbnail Strip */}
            {galleryImages.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {galleryImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-14 h-14 rounded-xl p-1 bg-slate-50 border transition-all flex-shrink-0 cursor-pointer overflow-hidden ${
                      selectedImageIndex === idx
                        ? "border-cyan-600 ring-2 ring-cyan-500/20 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 opacity-75 hover:opacity-100"
                    }`}
                  >
                    <img src={imgUrl} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Title, Price, Delivery & Actions */}
          <div className="space-y-4 lg:col-span-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-800">{product.brand}</p>
              <h1 className="mt-1 text-xl font-black leading-snug tracking-tight text-slate-950 sm:text-2xl lg:text-3xl">
                {product.title}
              </h1>
            </div>

            {/* Rating */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 font-bold text-amber-900">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {product.rating.toFixed(1)}
              </span>
              <span className="font-semibold text-slate-600">
                {product.reviewCount.toLocaleString()} verified customer ratings
              </span>
            </div>

            {/* Price Box */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-3xl font-black text-slate-950">
                  ₹{product.price.toLocaleString("en-IN")}
                </span>
                {product.originalPrice > product.price && (
                  <span className="text-sm text-slate-400 line-through font-medium">
                    MRP ₹{product.originalPrice.toLocaleString("en-IN")}
                  </span>
                )}
                {product.discountPercent > 0 && (
                  <span className="text-xs font-bold text-rose-600">
                    {product.discountPercent}% off
                  </span>
                )}
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-500">
                Inclusive of all taxes · Free shipping on orders over ₹499
              </p>
            </div>

            {/* Availability & Delivery */}
            <div className="space-y-2 text-xs">
              {isOutOfStock ? (
                <p className="font-bold text-rose-600">Currently out of stock</p>
              ) : isLowStock ? (
                <p className="font-bold text-amber-600 flex items-center gap-1">
                  <Zap className="h-4 w-4 fill-amber-500 text-amber-500" />
                  Only {product.stock} items left in stock — order soon
                </p>
              ) : (
                <p className="flex items-center gap-1.5 font-bold text-emerald-700">
                  <Check className="h-4 w-4" />
                  In stock & ready to dispatch
                </p>
              )}
              <p className="flex items-center gap-1.5 font-medium text-slate-600">
                <Truck className="h-4 w-4 text-cyan-600" />
                Free Express Delivery within 2–3 business days
              </p>
            </div>

            {/* Quantity Selector */}
            <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
              <span className="text-xs font-bold text-slate-700">Quantity</span>
              <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  className="p-2 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-bold text-slate-900">{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={quantity >= product.stock}
                  onClick={() => setQuantity((current) => Math.min(product.stock, current + 1))}
                  className="p-2 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {!isOutOfStock && (
                <span className="text-[11px] font-medium text-slate-500">
                  {product.stock} available in warehouse
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => addToCart(product, quantity)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 shadow-xs cursor-pointer"
              >
                <ShoppingCart className="h-4 w-4 text-amber-400" />
                Add to Cart
              </button>
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm transition-colors disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 shadow-xs cursor-pointer"
              >
                <Zap className="h-4 w-4" />
                Buy Now
              </button>
            </div>

            {/* Trust Assurances */}
            <div className="grid gap-2 border-t border-slate-100 pt-4 text-[11px] font-semibold text-slate-600 sm:grid-cols-3">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-cyan-600" />
                100% Genuine Brand Sourced
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-600" />
                7-Day Easy Replacement
              </span>
              <span className="flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-amber-600" />
                Fast Doorstep Delivery
              </span>
            </div>
          </div>
        </section>

        {/* Product Details Tabs (Overview, Specs, Reviews) */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6">
          <div className="flex gap-5 overflow-x-auto border-b border-slate-200 text-sm font-bold no-scrollbar">
            {([
              ["overview", "Overview & Features"],
              ["specifications", "Technical Specifications"],
              ["reviews", `Customer Reviews (${reviewLabel})`],
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 border-b-2 px-1 pb-3 transition-colors cursor-pointer ${
                  activeTab === tab
                    ? "border-cyan-600 text-cyan-800 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="pt-5 text-sm">
            {activeTab === "overview" && (
              <div className="max-w-3xl space-y-5">
                <p className="leading-relaxed text-slate-700">{product.description}</p>
                {product.features.length > 0 && (
                  <div>
                    <h2 className="text-base font-black text-slate-950">Key Features</h2>
                    <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                      {product.features.map((feature) => (
                        <li key={feature} className="flex gap-2 text-xs sm:text-sm leading-snug text-slate-700">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cyan-600" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "specifications" && (
              <div className="max-w-3xl overflow-hidden rounded-xl border border-slate-200">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 border-b border-slate-100 last:border-0">
                    <dt className="bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600">{key}</dt>
                    <dd className="col-span-2 px-4 py-3 text-xs sm:text-sm font-medium text-slate-900">{value}</dd>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "reviews" && (
              <ProductReviewsSection
                product={product}
                user={store.user}
                onReviewSubmitted={store.addReviewToProduct}
              />
            )}
          </div>
        </section>

        {/* Similar Products in this Category */}
        {similarProducts.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Similar Products</h2>
                <p className="text-xs text-slate-500">More choices from {product.category}</p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1 cursor-pointer"
              >
                <span>View More</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
              {similarProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isInWishlist={store.wishlist.includes(p.id)}
                  onAddToCart={(item) => addToCart(item, 1)}
                  onQuickView={(item) => router.push(`/product/${encodeURIComponent(item.id)}`)}
                  onToggleWishlist={store.toggleWishlist}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recently Viewed */}
        <div className="mt-8">
          <RecentlyViewedSection
            allProducts={store.products}
            wishlist={store.wishlist}
            onAddToCart={(item) => addToCart(item, 1)}
            onQuickView={(item) => router.push(`/product/${encodeURIComponent(item.id)}`)}
            onToggleWishlist={store.toggleWishlist}
          />
        </div>
      </main>

      {/* Footer */}
      <Footer
        onOpenTracking={() => router.push("/orders")}
        onOpenAuth={() => setIsAuthOpen(true)}
        onSelectCategory={() => router.push("/")}
      />

      {/* Mini Cart Feedback Toast */}
      <MiniCartToast
        product={lastAddedProduct}
        onClose={() => setLastAddedProduct(null)}
        onViewCart={() => setIsCartOpen(true)}
        onCheckout={handleCheckout}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        cart={store.cart}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={store.updateCartQuantity}
        onRemoveItem={store.removeFromCart}
        onProceedToCheckout={handleCheckout}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(user) => {
          store.setAuthenticatedUser(user);
          setIsAuthOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        cart={store.cart}
        user={store.user}
        onClose={() => setIsCheckoutOpen(false)}
        onCreateOrder={store.createOrder}
        onOpenOrderTracking={() => router.push("/orders")}
      />

      {/* Mobile Sticky Purchase Bar (Bottom) */}
      <div className="md:hidden fixed bottom-14 left-0 right-0 z-30 bg-white border-t border-slate-200 p-2.5 flex items-center justify-between gap-3 shadow-lg">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-500 truncate">Total Price</p>
          <p className="text-base font-black text-slate-950">₹{(product.price * quantity).toLocaleString("en-IN")}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => addToCart(product, quantity)}
            className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-slate-700" />
            <span>Add</span>
          </button>
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleBuyNow}
            className="h-9 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Buy Now</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        cartCount={cartCount}
        wishlistCount={store.wishlist.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCategories={() => router.push("/")}
        onOpenSearch={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        onOpenAuth={() => setIsAuthOpen(true)}
        onResetHome={() => router.push("/")}
      />
    </div>
  );
}

function ProductPageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl animate-pulse space-y-5">
        <div className="h-16 rounded-xl bg-slate-200" />
        <div className="grid gap-6 rounded-2xl bg-white p-6 lg:grid-cols-2">
          <div className="aspect-square rounded-xl bg-slate-100" />
          <div className="space-y-4 py-4">
            <div className="h-4 w-24 rounded bg-slate-100" />
            <div className="h-10 w-4/5 rounded bg-slate-100" />
            <div className="h-20 rounded bg-slate-100" />
            <div className="h-12 rounded bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
