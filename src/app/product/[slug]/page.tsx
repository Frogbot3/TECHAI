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
} from "lucide-react";
import { useTechAiStore } from "@/lib/store";
import { Product } from "@/lib/types";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import CartDrawer from "@/components/CartDrawer";
import AuthModal from "@/components/AuthModal";
import CheckoutModal from "@/components/CheckoutModal";
import MiniCartToast from "@/components/MiniCartToast";
import ProductReviewsSection from "@/components/ProductReviewsSection";

type ProductTab = "overview" | "specifications" | "reviews";

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const store = useTechAiStore();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<ProductTab>("overview");
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

  const addToCart = (item: Product, itemQuantity = 1) => {
    store.addToCart(item, itemQuantity);
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
      <div className="min-h-screen bg-slate-50 text-slate-900">
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
        />
        <main className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 py-12 text-center">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-xl font-black text-slate-950">Product not found</h1>
            <p className="mt-2 text-sm text-slate-500">It may no longer be available or the link is incomplete.</p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition-colors hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to the store
            </Link>
          </div>
        </main>
        <CartDrawer
          isOpen={isCartOpen}
          cart={store.cart}
          onClose={() => setIsCartOpen(false)}
          onUpdateQuantity={store.updateCartQuantity}
          onRemoveItem={store.removeFromCart}
          onProceedToCheckout={handleCheckout}
        />
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;
  const reviewLabel = product.reviews?.length || product.reviewCount;

  return (
    <div className="min-h-screen bg-slate-50 pb-16 text-slate-900 md:pb-0">
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
      />

      <main className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link href="/" className="inline-flex items-center gap-1.5 hover:text-cyan-700">
            <ArrowLeft className="h-3.5 w-3.5" />
            Store
          </Link>
          <span aria-hidden="true">/</span>
          <span className="truncate">{product.category}</span>
        </nav>

        <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-12 lg:gap-10 lg:p-8">
          <div className="lg:col-span-5">
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-6 sm:p-10">
              {product.discountPercent > 0 && (
                <span className="absolute left-3 top-3 rounded bg-rose-600 px-2 py-1 text-[11px] font-bold text-white shadow-sm">
                  {product.discountPercent}% OFF
                </span>
              )}
              <img src={product.image} alt={product.title} className="h-full w-full object-contain" />
            </div>
          </div>

          <div className="space-y-5 lg:col-span-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-700">{product.brand}</p>
              <h1 className="mt-1 text-xl font-black leading-snug tracking-tight text-slate-950 sm:text-3xl">{product.title}</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 font-bold text-amber-800">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {product.rating.toFixed(1)}
              </span>
              <span className="font-medium text-slate-500">{product.reviewCount.toLocaleString()} verified ratings</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-3xl font-black text-slate-950">₹{product.price.toLocaleString("en-IN")}</span>
                {product.originalPrice > product.price && (
                  <span className="text-sm text-slate-400 line-through">MRP ₹{product.originalPrice.toLocaleString("en-IN")}</span>
                )}
                {product.discountPercent > 0 && (
                  <span className="text-xs font-bold text-emerald-700">{product.discountPercent}% off</span>
                )}
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-500">Inclusive of all taxes</p>
            </div>

            <div className="space-y-2 text-xs">
              {isOutOfStock ? (
                <p className="font-bold text-rose-600">Currently out of stock</p>
              ) : (
                <p className="flex items-center gap-1.5 font-bold text-emerald-700">
                  <Check className="h-4 w-4" />
                  In stock · ready to dispatch
                </p>
              )}
              <p className="flex items-center gap-1.5 font-medium text-slate-600">
                <Truck className="h-4 w-4 text-cyan-600" />
                Free express delivery in 2–3 business days
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
              <span className="text-xs font-bold text-slate-700">Quantity</span>
              <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                  className="p-2 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-9 text-center text-sm font-bold text-slate-900">{quantity}</span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={quantity >= product.stock}
                  onClick={() => setQuantity((current) => Math.min(product.stock, current + 1))}
                  className="p-2 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {!isOutOfStock && <span className="text-[11px] font-medium text-slate-500">{product.stock} available</span>}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={() => addToCart(product, quantity)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                <ShoppingCart className="h-4 w-4 text-amber-400" />
                Add to Cart
              </button>
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 text-sm font-bold text-white transition-colors hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                <Zap className="h-4 w-4 text-amber-200" />
                Buy Now
              </button>
            </div>

            <div className="grid gap-3 border-t border-slate-100 pt-4 text-[11px] font-medium text-slate-600 sm:grid-cols-3">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-cyan-600" />100% genuine</span>
              <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-600" />7-day replacement</span>
              <span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-amber-600" />Free shipping</span>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex gap-5 overflow-x-auto border-b border-slate-200 text-sm font-bold">
            {([
              ["overview", "Overview & highlights"],
              ["specifications", "Specifications"],
              ["reviews", `Customer reviews (${reviewLabel})`],
            ] as const).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 border-b-2 px-1 pb-3 transition-colors ${
                  activeTab === tab ? "border-cyan-600 text-cyan-700" : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="pt-5 text-sm">
            {activeTab === "overview" && (
              <div className="max-w-3xl space-y-5">
                <p className="leading-7 text-slate-700">{product.description}</p>
                {product.features.length > 0 && (
                  <div>
                    <h2 className="text-base font-black text-slate-950">Key features</h2>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {product.features.map((feature) => (
                        <li key={feature} className="flex gap-2 text-sm leading-6 text-slate-700">
                          <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-cyan-600" />
                          {feature}
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
                    <dd className="col-span-2 px-4 py-3 text-sm font-medium text-slate-900">{value}</dd>
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
      </main>

      <MiniCartToast
        product={lastAddedProduct}
        onClose={() => setLastAddedProduct(null)}
        onViewCart={() => setIsCartOpen(true)}
        onCheckout={handleCheckout}
      />

      <CartDrawer
        isOpen={isCartOpen}
        cart={store.cart}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={store.updateCartQuantity}
        onRemoveItem={store.removeFromCart}
        onProceedToCheckout={handleCheckout}
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
        onOpenCart={() => setIsCartOpen(true)}
        onOpenCategories={() => router.push("/#categories-section")}
        onOpenSearch={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        onOpenAuth={() => setIsAuthOpen(true)}
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
