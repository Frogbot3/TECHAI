"use client";

import React, { useState, useMemo } from "react";
import { useTechAiStore } from "@/lib/store";
import Navbar from "@/components/Navbar";
import MobileBottomNav from "@/components/MobileBottomNav";
import HeroCarousel from "@/components/HeroCarousel";
import FlashDealsSection from "@/components/FlashDealsSection";
import CategoryBubbles from "@/components/CategoryBubbles";
import ShopByNeedSection from "@/components/ShopByNeedSection";
import FilterSidebar from "@/components/FilterSidebar";
import TrustBadgesBar from "@/components/TrustBadgesBar";
import ProductCard from "@/components/ProductCard";
import MiniCartToast from "@/components/MiniCartToast";
import ProductDetailModal from "@/components/ProductDetailModal";
import ProductComparisonModal from "@/components/ProductComparisonModal";
import CartDrawer from "@/components/CartDrawer";
import AuthModal from "@/components/AuthModal";
import CheckoutModal from "@/components/CheckoutModal";
import OrderTrackingModal from "@/components/OrderTrackingModal";
import InvoicePreviewModal from "@/components/InvoicePreviewModal";
import WriteReviewModal from "@/components/WriteReviewModal";
import AiShoppingAssistant from "@/components/AiShoppingAssistant";
import TechAiLogo from "@/components/TechAiLogo";
import { Product, Order } from "@/lib/types";
import {
  Sparkles,
  SlidersHorizontal,
  ArrowRight,
  ChevronRight,
  Flame,
  Globe,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Search,
  Filter,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const store = useTechAiStore();

  // Navigation & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortBy, setSortBy] = useState<"featured" | "price-low" | "price-high" | "rating" | "newest">("featured");

  // Filter States
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minDiscount, setMinDiscount] = useState<number | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Modals & Drawers
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [compareProduct, setCompareProduct] = useState<Product | null>(null);
  const [lastAddedProduct, setLastAddedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>(undefined);
  const [trackingOrderId, setTrackingOrderId] = useState<string>("");
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);
  const [reviewProduct, setReviewProduct] = useState<any | null>(null);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return store.products
      .filter((product) => {
        // Category Match
        const matchesCategory =
          selectedCategory === "All Categories" || product.category === selectedCategory;

        // Search Match
        const cleanSearch = searchQuery.trim().toLowerCase();
        const matchesSearch =
          !cleanSearch ||
          product.title.toLowerCase().includes(cleanSearch) ||
          product.brand.toLowerCase().includes(cleanSearch) ||
          product.category.toLowerCase().includes(cleanSearch);

        // Brand Filter
        const matchesBrand =
          selectedBrands.length === 0 || selectedBrands.includes(product.brand);

        // Price Filter
        let matchesPrice = true;
        if (selectedPriceRange) {
          const [min, max] = selectedPriceRange.split("-").map(Number);
          matchesPrice = product.price >= min && product.price <= max;
        }

        // Rating Filter
        const matchesRating = minRating === null || product.rating >= minRating;

        // Stock Filter
        const matchesStock = !inStockOnly || product.stock > 0;

        // Discount Filter
        const matchesDiscount = minDiscount === null || product.discountPercent >= minDiscount;

        return (
          matchesCategory &&
          matchesSearch &&
          matchesBrand &&
          matchesPrice &&
          matchesRating &&
          matchesStock &&
          matchesDiscount
        );
      })
      .sort((a, b) => {
        if (sortBy === "price-low") return a.price - b.price;
        if (sortBy === "price-high") return b.price - a.price;
        if (sortBy === "rating") return b.rating - a.rating;
        return 0;
      });
  }, [
    store.products,
    selectedCategory,
    searchQuery,
    selectedBrands,
    selectedPriceRange,
    minRating,
    inStockOnly,
    minDiscount,
    sortBy,
  ]);

  // Section Collections
  const bestSellers = useMemo(
    () => store.products.filter((p) => p.isBestSeller || p.rating >= 4.4).slice(0, 5),
    [store.products]
  );

  const recommendedProducts = useMemo(
    () => store.products.filter((p) => p.isTrending || p.price > 1000).slice(0, 5),
    [store.products]
  );

  const handleAddToCartWithToast = (product: Product, quantity = 1) => {
    store.addToCart(product, quantity);
    setLastAddedProduct(product);
  };

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

  const handleToggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const handleResetFilters = () => {
    setSelectedBrands([]);
    setSelectedPriceRange(null);
    setMinRating(null);
    setInStockOnly(false);
    setMinDiscount(null);
    setSearchQuery("");
    setSelectedCategory("All Categories");
  };

  const cartCount = store.cart.reduce((sum, item) => sum + item.quantity, 0);
  const isHomeShowcase = selectedCategory === "All Categories" && !searchQuery.trim();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950 pb-16 md:pb-0">
      {/* 1. Header with Live Search & Mega Menu */}
      <Navbar
        cartCount={cartCount}
        wishlistCount={store.wishlist.length}
        user={store.user}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        products={store.products}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenTracking={() => {
          setTrackingOrderId("");
          setIsTrackingOpen(true);
        }}
        onSelectProduct={(p) => setQuickViewProduct(p)}
        onLogout={store.logoutUser}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto pb-12">
        {isHomeShowcase ? (
          /* HOMEPAGE SHOWCASE */
          <div className="space-y-4">
            {/* 2. Main Hero Section */}
            <HeroCarousel onExploreCategory={(cat) => setSelectedCategory(cat)} />

            {/* 3. Flash Deals Section with Clean Countdown */}
            <FlashDealsSection
              products={store.products}
              wishlist={store.wishlist}
              onAddToCart={handleAddToCartWithToast}
              onQuickView={(p) => setQuickViewProduct(p)}
              onToggleWishlist={store.toggleWishlist}
              onViewAll={() => setSelectedCategory("Electronics")}
            />

            {/* 4. Popular Categories */}
            <CategoryBubbles
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => setSelectedCategory(cat)}
            />

            {/* 5. Shop By Need Discovery Grid */}
            <ShopByNeedSection
              onSelectNeed={(category, query) => {
                setSelectedCategory(category);
                if (query) setSearchQuery(query);
              }}
            />

            {/* 6. Best Sellers */}
            <section className="px-3 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Best Sellers
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Top-selling verified customer favorites
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("Mobiles & Wearables")}
                  className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 items-stretch">
                {bestSellers.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isInWishlist={store.wishlist.includes(product.id)}
                    onAddToCart={handleAddToCartWithToast}
                    onQuickView={(p) => setQuickViewProduct(p)}
                    onToggleWishlist={store.toggleWishlist}
                  />
                ))}
              </div>
            </section>

            {/* 7. Recommended Products */}
            <section className="px-3 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    Recommended For You
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Curated electronics, lifestyle essentials & gadgets
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("All Categories")}
                  className="text-xs font-bold text-cyan-700 hover:text-cyan-800 flex items-center gap-1"
                >
                  <span>Explore Catalog</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 items-stretch">
                {recommendedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isInWishlist={store.wishlist.includes(product.id)}
                    onAddToCart={handleAddToCartWithToast}
                    onQuickView={(p) => setQuickViewProduct(p)}
                    onToggleWishlist={store.toggleWishlist}
                  />
                ))}
              </div>
            </section>

            {/* 8. Trust Features */}
            <TrustBadgesBar />
          </div>
        ) : (
          /* PRODUCT LISTING & FILTER VIEW (When Searching or Filtering) */
          <div className="px-3 sm:px-6 lg:px-8 pt-5">
            {/* Top Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>{searchQuery ? `Search Results for "${searchQuery}"` : selectedCategory}</span>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {filteredProducts.length} items
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Showing in-stock items with fast delivery
                </p>
              </div>

              <div className="flex items-center space-x-2 self-start sm:self-auto">
                {/* Mobile Filter Button */}
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen((prev) => !prev)}
                  className="md:hidden flex items-center space-x-1.5 px-3 py-2 bg-slate-100 rounded-lg text-xs font-bold text-slate-800"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter</span>
                </button>

                {/* Sort Dropdown */}
                <div className="flex items-center space-x-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold">
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
            </div>

            {/* Main Listing Layout (Sidebar Filter + Product Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Desktop Filter Sidebar (3 cols) */}
              <div className="hidden md:block md:col-span-3">
                <FilterSidebar
                  products={store.products}
                  selectedBrands={selectedBrands}
                  selectedPriceRange={selectedPriceRange}
                  minRating={minRating}
                  inStockOnly={inStockOnly}
                  minDiscount={minDiscount}
                  onToggleBrand={handleToggleBrand}
                  onSelectPriceRange={setSelectedPriceRange}
                  onSelectMinRating={setMinRating}
                  onToggleInStock={() => setInStockOnly((prev) => !prev)}
                  onSelectMinDiscount={setMinDiscount}
                  onResetFilters={handleResetFilters}
                />
              </div>

              {/* Mobile Slide-down Filter */}
              {isMobileFilterOpen && (
                <div className="md:hidden col-span-1 mb-4">
                  <FilterSidebar
                    products={store.products}
                    selectedBrands={selectedBrands}
                    selectedPriceRange={selectedPriceRange}
                    minRating={minRating}
                    inStockOnly={inStockOnly}
                    minDiscount={minDiscount}
                    onToggleBrand={handleToggleBrand}
                    onSelectPriceRange={setSelectedPriceRange}
                    onSelectMinRating={setMinRating}
                    onToggleInStock={() => setInStockOnly((prev) => !prev)}
                    onSelectMinDiscount={setMinDiscount}
                    onResetFilters={handleResetFilters}
                  />
                </div>
              )}

              {/* Product Cards Grid (9 cols) */}
              <div className="md:col-span-9">
                {filteredProducts.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
                    <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-800">No products match your filters</h3>
                    <p className="text-xs text-slate-500">
                      Try removing some filters or search for another item.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        isInWishlist={store.wishlist.includes(product.id)}
                        onAddToCart={handleAddToCartWithToast}
                        onQuickView={(p) => setQuickViewProduct(p)}
                        onToggleWishlist={store.toggleWishlist}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 9. Professional Marketplace Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pt-12 pb-8 px-4 sm:px-6 lg:px-8 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-2 space-y-3">
            <TechAiLogo size="md" />
            <p className="text-slate-400 leading-relaxed max-w-sm">
              TECH AI is an online shopping destination for genuine electronics, smart wearables, gaming gear, home appliances, and daily essentials.
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Demo Marketplace Platform • Built with Next.js & React
            </p>
          </div>

          {/* Col 2: Customer Care */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-[11px]">
              Customer Service
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link href="/orders" className="hover:text-white transition-colors">
                  My Orders & Invoices
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsTrackingOpen(true)}
                  className="hover:text-white transition-colors text-left"
                >
                  Live Order Tracking
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsAuthOpen(true)}
                  className="hover:text-white transition-colors text-left"
                >
                  Account Login
                </button>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-amber-400 transition-colors">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Categories */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-[11px]">
              Shop Categories
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("Electronics")}
                  className="hover:text-white transition-colors"
                >
                  Electronics & Audio
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("Mobiles & Wearables")}
                  className="hover:text-white transition-colors"
                >
                  Mobiles & Smartwatches
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("Home Appliances")}
                  className="hover:text-white transition-colors"
                >
                  Home & Kitchen
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("Computers & Gaming")}
                  className="hover:text-white transition-colors"
                >
                  Computers & Gaming
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Payments & Security */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3 text-[11px]">
              Payment & Security
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              We support UPI, Cards, NetBanking, and Cash on Delivery. All transactions are securely processed.
            </p>
            <span className="inline-block px-2.5 py-1 bg-slate-900 border border-slate-800 text-emerald-400 font-semibold rounded text-[11px]">
              ✓ 256-Bit SSL Encrypted
            </span>
          </div>
        </div>

        {/* Bottom Legal Row */}
        <div className="max-w-7xl mx-auto border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} TECH AI E-Commerce. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Return Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Contact Support</span>
          </div>
        </div>
      </footer>

      {/* Mini-Cart Non-Blocking Feedback Toast */}
      <MiniCartToast
        product={lastAddedProduct}
        onClose={() => setLastAddedProduct(null)}
        onViewCart={() => setIsCartOpen(true)}
        onCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={quickViewProduct}
        user={store.user}
        allProducts={store.products}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCartWithToast}
        onBuyNow={handleBuyNow}
        onReviewSubmitted={store.addReviewToProduct}
        onOpenCompare={(p) => {
          setCompareProduct(p);
          setQuickViewProduct(null);
        }}
      />

      {/* Product Comparison Modal */}
      <ProductComparisonModal
        isOpen={!!compareProduct}
        baseProduct={compareProduct}
        comparisonProducts={store.products}
        onClose={() => setCompareProduct(null)}
        onAddToCart={handleAddToCartWithToast}
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

      {/* Checkout Modal */}
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

      {/* Order Tracking Modal */}
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

      {/* Floating AI Shopping Assistant */}
      <AiShoppingAssistant
        products={store.products}
        onSelectProduct={(p) => setQuickViewProduct(p)}
        onAddToCart={handleAddToCartWithToast}
      />

      {/* Mobile Bottom Navigation Bar (5 tabs) */}
      <MobileBottomNav
        cartCount={cartCount}
        wishlistCount={store.wishlist.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => {
          if (!store.user) setIsAuthOpen(true);
        }}
        onOpenCategories={() => {
          setSelectedCategory("All Categories");
          const el = document.getElementById("categories-section");
          if (el) el.scrollIntoView({ behavior: "smooth" });
        }}
        onOpenSearch={() => {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </div>
  );
}
