"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import TechAiLogo from "@/components/TechAiLogo";
import { Product, Order, OrderStatus, User, Review } from "@/lib/types";
import { CATEGORIES } from "@/lib/data";
import { generateOrderInvoice } from "@/lib/generateInvoice";
import { exportSingleOrderToExcel, exportAllOrdersToExcel } from "@/lib/exportOrderExcel";
import { exportAnalyticsToPdf, exportAnalyticsToExcel } from "@/lib/exportAnalyticsReport";
import * as XLSX from "xlsx";
import {
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  Truck,
  Phone,
  Mail,
  Search,
  LogOut,
  ShieldCheck,
  MapPin,
  ExternalLink,
  Sparkles,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Check,
  SlidersHorizontal,
  ArrowUpRight,
  Download,
  FileText,
  FileSpreadsheet,
  Edit,
  Star,
  Image as ImageIcon,
  Upload,
  X,
  Layers,
  Award,
  CreditCard,
  Tag,
  Gift,
  HelpCircle,
  Eye
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"ANALYTICS" | "PRODUCTS" | "ORDERS" | "CUSTOMERS">("ANALYTICS");
  const [productSearch, setProductSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrdersCount: 0,
    totalProductsCount: 0,
    lowStockCount: 0,
    totalCustomersCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  // Product Add / Edit Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [productForm, setProductForm] = useState({
    title: "",
    brand: "TECH AI",
    category: "Electronics",
    price: 1499,
    originalPrice: 1999,
    stock: 25,
    isAiProduct: true,
    isTrending: false,
    isBestSeller: false,
    isHeroFeatured: false,
    heroBannerHeadline: "",
    heroBannerSubtitle: "",
    heroBadge: "",
    heroOfferText: "",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
    images: ["https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80"],
    description: "High-performance smart device designed for premium speed, durability, and seamless convenience.",
    features: ["Intelligent Next-Gen Processing", "Fast Charging & Long Battery", "100% Genuine Build"],
    specs: { "Warranty": "1 Year Official Brand Warranty", "Connectivity": "Bluetooth & Type-C" } as Record<string, string>,
  });

  // Specifications Form State
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");

  // Features Form State
  const [newFeatureText, setNewFeatureText] = useState("");

  // Reviews Manager Modal State
  const [reviewModalProduct, setReviewModalProduct] = useState<Product | null>(null);
  const [newReviewForm, setNewReviewForm] = useState({
    userName: "",
    rating: 5,
    comment: "",
    verifiedPurchase: true,
  });
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  // Stock Refill Modal State
  const [refillModalProduct, setRefillModalProduct] = useState<Product | null>(null);
  const [refillAmount, setRefillAmount] = useState(10);

  const [authChecking, setAuthChecking] = useState(true);

  // Fetch real-time live statistics and orders from MongoDB
  const fetchLiveData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setOrders(data.orders || []);
        setProducts(data.products || []);
        setCustomers(data.customers || []);
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error("Error fetching live admin stats:", error);
    } finally {
      setIsLoading(false);
      if (showIndicator) setIsRefreshing(false);
    }
  }, []);

  // Verify admin session via secure cookie
  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await fetch("/api/admin/session", { cache: "no-store" });
        const data = await res.json();
        if (!data.success) {
          router.push("/admin/login");
          return;
        }
        setAuthChecking(false);
        fetchLiveData();
      } catch {
        router.push("/admin/login");
      }
    };
    verifySession();
  }, [router, fetchLiveData]);

  // Periodic polling for live updates
  useEffect(() => {
    if (authChecking) return;
    const interval = setInterval(() => fetchLiveData(false), 6000);
    return () => clearInterval(interval);
  }, [authChecking, fetchLiveData]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // Proceed
    }
    router.push("/admin/login");
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    note?: string
  ) => {
    try {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note }),
      });
      fetchLiveData();
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  const handleRefillStock = async (productId: string, addQty: number) => {
    try {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock: Math.max(0, p.stock + addQty) } : p))
      );
      await fetch(`/api/products/${productId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: addQty }),
      });
      fetchLiveData();
      setRefillModalProduct(null);
    } catch (err) {
      console.error("Failed to refill stock:", err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      await fetch(`/api/products/${productId}`, { method: "DELETE" });
      fetchLiveData();
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  };

  // Open modal for Adding a new product
  const handleOpenAddProduct = () => {
    setIsEditing(false);
    setEditingProductId(null);
    setProductForm({
      title: "",
      brand: "TECH AI",
      category: "Electronics",
      price: 1499,
      originalPrice: 1999,
      stock: 25,
      isAiProduct: true,
      isTrending: false,
      isBestSeller: false,
      isHeroFeatured: false,
      heroBannerHeadline: "",
      heroBannerSubtitle: "",
      heroBadge: "SPECIAL DROP",
      heroOfferText: "Buy 3 Get Small Gift Free",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
      images: ["https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80"],
      description: "High-performance smart device designed for premium speed, durability, and seamless convenience.",
      features: ["Intelligent Next-Gen Processing", "Fast Charging & Long Battery", "100% Genuine Build"],
      specs: { "Warranty": "1 Year Official Brand Warranty", "Connectivity": "Bluetooth & Type-C" },
    });
    setIsProductModalOpen(true);
  };

  // Open modal for Editing an existing product
  const handleOpenEditProduct = (product: Product) => {
    setIsEditing(true);
    setEditingProductId(product.id);
    const existingImages = (product.images && product.images.length > 0)
      ? product.images
      : [product.image];

    setProductForm({
      title: product.title,
      brand: product.brand,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice || product.price,
      stock: product.stock,
      isAiProduct: !!product.isAiProduct,
      isTrending: !!product.isTrending,
      isBestSeller: !!product.isBestSeller,
      isHeroFeatured: !!product.isHeroFeatured,
      heroBannerHeadline: product.heroBannerHeadline || product.title,
      heroBannerSubtitle: product.heroBannerSubtitle || product.description,
      heroBadge: product.heroBadge || (product.discountPercent > 0 ? `${product.discountPercent}% OFF` : "SPECIAL OFFER"),
      heroOfferText: product.heroOfferText || "Buy 3 Get Small Gift Free",
      image: product.image,
      images: existingImages,
      description: product.description || "",
      features: product.features || [],
      specs: product.specs || {},
    });
    setIsProductModalOpen(true);
  };

  // Handle local computer image upload (up to 7 images)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 7 - productForm.images.length;
    if (remainingSlots <= 0) {
      alert("Maximum of 7 images allowed per product.");
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result as string;
        if (result) {
          setProductForm((prev) => {
            if (prev.images.length >= 7) return prev;
            const updatedImages = [...prev.images, result];
            return {
              ...prev,
              images: updatedImages,
              image: updatedImages[0],
            };
          });
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
  };

  // Remove an image from the list
  const handleRemoveImage = (indexToRemove: number) => {
    setProductForm((prev) => {
      const filtered = prev.images.filter((_, idx) => idx !== indexToRemove);
      const newPrimary = filtered[0] || "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80";
      return {
        ...prev,
        images: filtered,
        image: newPrimary,
      };
    });
  };

  // Set image as primary (index 0)
  const handleSetPrimaryImage = (index: number) => {
    setProductForm((prev) => {
      const selected = prev.images[index];
      const rest = prev.images.filter((_, idx) => idx !== index);
      const reordered = [selected, ...rest];
      return {
        ...prev,
        images: reordered,
        image: reordered[0],
      };
    });
  };

  // Add Spec key-value pair
  const handleAddSpec = () => {
    if (!newSpecKey.trim() || !newSpecValue.trim()) return;
    setProductForm((prev) => ({
      ...prev,
      specs: { ...prev.specs, [newSpecKey.trim()]: newSpecValue.trim() },
    }));
    setNewSpecKey("");
    setNewSpecValue("");
  };

  // Remove Spec key-value pair
  const handleRemoveSpec = (keyToRemove: string) => {
    setProductForm((prev) => {
      const newSpecs = { ...prev.specs };
      delete newSpecs[keyToRemove];
      return { ...prev, specs: newSpecs };
    });
  };

  // Add Feature item
  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setProductForm((prev) => ({
      ...prev,
      features: [...prev.features, newFeatureText.trim()],
    }));
    setNewFeatureText("");
  };

  // Remove Feature item
  const handleRemoveFeature = (idxToRemove: number) => {
    setProductForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, idx) => idx !== idxToRemove),
    }));
  };

  // Submit Add or Edit Product Form
  const handleProductFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const discount = productForm.originalPrice > productForm.price
      ? Math.round(((productForm.originalPrice - productForm.price) / productForm.originalPrice) * 100)
      : 0;

    const payload = {
      ...productForm,
      discountPercent: discount,
      image: productForm.images[0] || productForm.image,
      images: productForm.images.length > 0 ? productForm.images : [productForm.image],
    };

    try {
      if (isEditing && editingProductId) {
        // Update product via PATCH
        const res = await fetch(`/api/products/${editingProductId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          setIsProductModalOpen(false);
          fetchLiveData(true);
        } else {
          alert(data.message || "Failed to update product");
        }
      } else {
        // Add new product via POST
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...payload,
            rating: 4.8,
            reviewCount: 1,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setIsProductModalOpen(false);
          fetchLiveData(true);
        } else {
          alert(data.message || "Failed to create product");
        }
      }
    } catch (err) {
      alert("An error occurred while saving the product.");
    }
  };

  // Reviews Manager Submit
  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalProduct || !newReviewForm.userName || !newReviewForm.comment) return;

    const newRev: Review = {
      id: editingReviewId || `rev-${Date.now()}`,
      productId: reviewModalProduct.id,
      userName: newReviewForm.userName,
      rating: Number(newReviewForm.rating),
      comment: newReviewForm.comment,
      date: new Date().toISOString().slice(0, 10),
      verifiedPurchase: newReviewForm.verifiedPurchase,
    };

    let updatedReviews: Review[];
    if (editingReviewId) {
      updatedReviews = (reviewModalProduct.reviews || []).map((r) =>
        r.id === editingReviewId ? newRev : r
      );
    } else {
      updatedReviews = [newRev, ...(reviewModalProduct.reviews || [])];
    }

    // Recalculate average rating
    const avgRating = Number(
      (updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length).toFixed(1)
    );

    try {
      const res = await fetch(`/api/products/${reviewModalProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviews: updatedReviews,
          rating: avgRating,
          reviewCount: updatedReviews.length,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReviewModalProduct((prev) => prev ? { ...prev, reviews: updatedReviews, rating: avgRating, reviewCount: updatedReviews.length } : null);
        setNewReviewForm({ userName: "", rating: 5, comment: "", verifiedPurchase: true });
        setEditingReviewId(null);
        fetchLiveData();
      }
    } catch (err) {
      console.error("Failed to save review:", err);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!reviewModalProduct) return;
    const updatedReviews = (reviewModalProduct.reviews || []).filter((r) => r.id !== reviewId);
    const avgRating = updatedReviews.length > 0
      ? Number((updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length).toFixed(1))
      : 4.5;

    try {
      await fetch(`/api/products/${reviewModalProduct.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviews: updatedReviews,
          rating: avgRating,
          reviewCount: updatedReviews.length,
        }),
      });
      setReviewModalProduct((prev) => prev ? { ...prev, reviews: updatedReviews, rating: avgRating, reviewCount: updatedReviews.length } : null);
      fetchLiveData();
    } catch (err) {
      console.error("Failed to delete review:", err);
    }
  };

  // Bulk Export Orders
  const exportAllOrdersToExcel = () => {
    const exportData = orders.map((order) => ({
      "Order ID": order.id,
      "Customer Name": order.shippingAddress.fullName,
      "Phone": order.shippingAddress.phone,
      "Email": order.shippingAddress.email,
      "Delivery Address": `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
      "Items Count": order.items.reduce((s, i) => s + i.quantity, 0),
      "Payment Mode": order.paymentMethod,
      "Payment Status": order.paymentStatus,
      "Order Status": order.status,
      "Tracking Number": order.trackingNumber,
      "Courier": order.courierName,
      "Subtotal (₹)": order.totalAmount,
      "Discount (₹)": order.discountAmount,
      "Grand Total (₹)": order.finalAmount,
      "Date Placed": order.createdAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "All Orders");
    XLSX.writeFile(workbook, `TECHAI-Orders-Ledger-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Filtered lists
  const filteredOrders = useMemo(() => {
    const query = orderSearch.toLowerCase();
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(query) ||
        o.shippingAddress.fullName.toLowerCase().includes(query) ||
        o.shippingAddress.phone.toLowerCase().includes(query) ||
        o.shippingAddress.email.toLowerCase().includes(query) ||
        o.status.toLowerCase().includes(query)
    );
  }, [orders, orderSearch]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    );
  }, [products, productSearch]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query)
    );
  }, [customers, customerSearch]);

  // Analytics Computations
  const categoryAnalytics = useMemo(() => {
    const map: Record<string, { count: number; revenue: number }> = {};
    orders.forEach((ord) => {
      ord.items.forEach((item) => {
        const cat = item.product.category || "General";
        if (!map[cat]) map[cat] = { count: 0, revenue: 0 };
        map[cat].count += item.quantity;
        map[cat].revenue += item.product.price * item.quantity;
      });
    });
    return Object.entries(map).map(([name, val]) => ({
      name,
      count: val.count,
      revenue: val.revenue,
      share: stats.totalRevenue > 0 ? Math.round((val.revenue / stats.totalRevenue) * 100) : 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }, [orders, stats.totalRevenue]);

  const paymentAnalytics = useMemo(() => {
    const map: Record<string, number> = { UPI: 0, Card: 0, NetBanking: 0, COD: 0 };
    orders.forEach((ord) => {
      const mode = ord.paymentMethod || "COD";
      map[mode] = (map[mode] || 0) + ord.finalAmount;
    });
    return Object.entries(map).map(([method, amount]) => ({
      method,
      amount,
      share: stats.totalRevenue > 0 ? Math.round((amount / stats.totalRevenue) * 100) : 0,
    }));
  }, [orders, stats.totalRevenue]);

  const topProductsAnalytics = useMemo(() => {
    const map: Record<string, { id: string; title: string; brand: string; units: number; revenue: number; image: string }> = {};
    orders.forEach((ord) => {
      ord.items.forEach((item) => {
        const id = item.product.id;
        if (!map[id]) {
          map[id] = {
            id,
            title: item.product.title,
            brand: item.product.brand || "TECH AI",
            units: 0,
            revenue: 0,
            image: item.product.image,
          };
        }
        map[id].units += item.quantity;
        map[id].revenue += item.product.price * item.quantity;
      });
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [orders]);

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-sans">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full"
        />
      </div>
    );
  }

  const statCards = [
    { label: "Total Gross Revenue", value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`, sub: `From ${stats.totalOrdersCount} order(s)`, icon: DollarSign, color: "emerald", glow: "shadow-emerald-500/20" },
    { label: "Total Orders", value: String(stats.totalOrdersCount), sub: "Live sync active", icon: ShoppingBag, color: "cyan", glow: "shadow-cyan-500/20" },
    { label: "Catalog Products", value: String(stats.totalProductsCount), sub: "In database store", icon: Package, color: "purple", glow: "shadow-purple-500/20" },
    { label: "Low Stock Alert", value: String(stats.lowStockCount), sub: "≤ 5 units remaining", icon: AlertCircle, color: "amber", glow: "shadow-amber-500/20", highlight: stats.lowStockCount > 0 },
    { label: "Registered Users", value: String(stats.totalCustomersCount), sub: "Customers directory", icon: Users, color: "blue", glow: "shadow-blue-500/20" },
  ];

  const tabs = [
    { id: "ANALYTICS" as const, label: "Overview & Analytics", icon: BarChart3 },
    { id: "PRODUCTS" as const, label: `Products & Stock (${products.length})`, icon: Package },
    { id: "ORDERS" as const, label: `Live Orders (${orders.length})`, icon: Truck },
    { id: "CUSTOMERS" as const, label: `Customers (${customers.length})`, icon: Users },
  ];

  const discountPercentCalculated = productForm.originalPrice > productForm.price
    ? Math.round(((productForm.originalPrice - productForm.price) / productForm.originalPrice) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-cyan-500 selection:text-slate-950 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[130px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Top Header Navigation */}
      <header className="bg-slate-900/70 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-30 shadow-lg shadow-black/30 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TechAiLogo size="md" />
            <div className="flex items-center space-x-2">
              <span className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                ⚡ ADMIN HQ
              </span>
              <span className="hidden sm:flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Synced</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <button
              type="button"
              onClick={() => fetchLiveData(true)}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl font-bold transition-all border border-slate-700 disabled:opacity-50 cursor-pointer"
              title="Sync live data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{isRefreshing ? "Syncing..." : "Sync Live"}</span>
            </button>

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all border border-slate-700"
            >
              <span>Customer Storefront</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 relative z-10">
        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-5 rounded-2xl space-y-2 relative overflow-hidden shadow-xl ${
                  idx === 4 ? "col-span-2 md:col-span-1" : ""
                }`}
              >
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider">{card.label}</span>
                  <Icon className={`w-4 h-4 text-${card.color}-400`} />
                </div>
                <p className={`text-xl sm:text-2xl font-black ${card.highlight ? "text-amber-400" : "text-white"}`}>
                  {card.value}
                </p>
                <p className={`text-[11px] font-semibold text-${card.color}-400`}>{card.sub}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Tab Navigation & Action Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-3 gap-3">
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/30"
                      : "bg-slate-900/60 backdrop-blur text-slate-400 hover:text-white border border-slate-700/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeTab === "ANALYTICS" && (
              <>
                <button
                  type="button"
                  onClick={() => exportAnalyticsToPdf(stats, orders, products)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Download Analytics PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportAnalyticsToExcel(stats, orders, products)}
                  className="px-3.5 py-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Download Analytics Excel</span>
                </button>
              </>
            )}

            {activeTab === "PRODUCTS" && (
              <button
                type="button"
                onClick={handleOpenAddProduct}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-black flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product (Up to 7 Images)</span>
              </button>
            )}

            {activeTab === "ORDERS" && (
              <button
                type="button"
                onClick={exportAllOrdersToExcel}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black flex items-center space-x-1.5 transition shadow-md cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export All Orders (Excel)</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        <AnimatePresence mode="wait">
          {activeTab === "ANALYTICS" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Row 1: Sales Trend Overview + Category Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sales Activity & Visual Revenue Graph (8 cols) */}
                <div className="lg:col-span-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
                    <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-cyan-400" />
                      <span>Sales Activity & Live Revenue Breakdown</span>
                    </h3>
                    <span className="text-[11px] text-slate-400">Last Synced: {lastSyncTime || "Real-time"}</span>
                  </div>

                  {/* Summary Metric Strip */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg Order Value (AOV)</p>
                      <p className="text-lg font-black text-emerald-400 mt-1">
                        ₹{stats.totalOrdersCount > 0 ? Math.round(stats.totalRevenue / stats.totalOrdersCount).toLocaleString("en-IN") : 0}
                      </p>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Fulfillment</p>
                      <p className="text-lg font-black text-cyan-400 mt-1">
                        {orders.filter((o) => o.status === "Placed" || o.status === "Processing").length}
                      </p>
                    </div>
                    <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Successfully Delivered</p>
                      <p className="text-lg font-black text-purple-400 mt-1">
                        {orders.filter((o) => o.status === "Delivered").length}
                      </p>
                    </div>
                  </div>

                  {/* Interactive Visual Sales Volume Chart */}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                      <span>Recent Orders Activity Stream</span>
                      <span className="text-cyan-400 text-[11px]">{orders.length} Order(s) Recorded</span>
                    </div>

                    <div className="space-y-2.5">
                      {orders.slice(0, 5).map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between bg-slate-950 p-3.5 rounded-2xl border border-slate-800/60 text-xs hover:border-slate-700 transition"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-cyan-400 font-bold">{order.id}</span>
                              <span className="text-slate-400">• {order.shippingAddress.fullName} ({order.shippingAddress.city})</span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {order.items.length} item(s) • Payment: {order.paymentMethod} ({order.paymentStatus})
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <p className="font-black text-emerald-400 text-sm">₹{order.finalAmount.toLocaleString("en-IN")}</p>
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300">
                              {order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Category Revenue Distribution & Shares (4 cols) */}
                <div className="lg:col-span-4 bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
                  <h3 className="text-sm font-extrabold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Sales by Category</span>
                  </h3>

                  <div className="space-y-3.5">
                    {categoryAnalytics.length === 0 ? (
                      <p className="text-xs text-slate-500 py-6 text-center">No orders placed yet.</p>
                    ) : (
                      categoryAnalytics.map((cat) => (
                        <div key={cat.name} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-slate-300">
                            <span className="truncate max-w-[160px]">{cat.name}</span>
                            <span className="text-emerald-400">₹{cat.revenue.toLocaleString("en-IN")} ({cat.share}%)</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
                              style={{ width: `${Math.max(5, cat.share)}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Payment Method Distribution */}
                  <div className="pt-4 border-t border-slate-800/80 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Payment Modes Share</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {paymentAnalytics.map((p) => (
                        <div key={p.method} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                          <span className="text-[10px] font-bold text-slate-400 block">{p.method}</span>
                          <span className="font-extrabold text-white">₹{p.amount.toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Top Selling Products Leaderboard */}
              <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Top Performing Products Leaderboard</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-bold">Ranked by gross sales volume</span>
                </div>

                {topProductsAnalytics.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No sales recorded yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topProductsAnalytics.map((prod, idx) => (
                      <div
                        key={prod.id}
                        className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center space-x-3.5 shadow-sm"
                      >
                        <span className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-800 text-cyan-400 font-black text-xs flex items-center justify-center flex-shrink-0">
                          #{idx + 1}
                        </span>
                        <img
                          src={prod.image}
                          alt={prod.title}
                          className="w-12 h-12 object-contain bg-white rounded-xl p-1 border border-slate-700 flex-shrink-0"
                        />
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{prod.title}</p>
                          <p className="text-[11px] text-slate-400">{prod.brand} • {prod.units} sold</p>
                          <p className="text-xs font-black text-emerald-400">₹{prod.revenue.toLocaleString("en-IN")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: PRODUCTS & STOCK MANAGEMENT */}
          {activeTab === "PRODUCTS" && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-xl space-y-4"
            >
              <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="relative max-w-sm w-full">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search products by title, brand, category..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400 font-bold">{filteredProducts.length} Product(s)</span>
                  <button
                    type="button"
                    onClick={handleOpenAddProduct}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl transition cursor-pointer"
                  >
                    + Add Product
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Product Info</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Price & Discount</th>
                      <th className="py-3.5 px-4">Hero Featured</th>
                      <th className="py-3.5 px-4">Stock Level</th>
                      <th className="py-3.5 px-4 text-center">Refill Inventory</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 flex items-center space-x-3">
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-11 h-11 object-contain bg-white rounded-xl p-1 border border-slate-700 flex-shrink-0"
                          />
                          <div className="space-y-0.5 max-w-xs">
                            <p className="font-bold text-white line-clamp-1">{product.title}</p>
                            <p className="text-[11px] text-slate-400">
                              {product.brand} • {product.images?.length || 1} image(s)
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-semibold">{product.category}</td>
                        <td className="py-3 px-4">
                          <p className="font-black text-emerald-400">₹{product.price.toLocaleString("en-IN")}</p>
                          {product.originalPrice > product.price && (
                            <p className="text-[10px] text-slate-400 line-through">
                              MRP ₹{product.originalPrice.toLocaleString("en-IN")} ({product.discountPercent}% OFF)
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {product.isHeroFeatured ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-cyan-950 text-cyan-300 border border-cyan-700">
                              <Sparkles className="w-3 h-3 text-cyan-400" />
                              <span>Hero Carousel</span>
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[11px]">Standard</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-bold px-2.5 py-1 rounded-full text-[11px] inline-block ${
                              product.stock <= 5
                                ? "bg-rose-950 text-rose-400 border border-rose-800"
                                : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            }`}
                          >
                            {product.stock} units
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleRefillStock(product.id, 10)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px] font-bold rounded-lg transition cursor-pointer"
                            >
                              +10
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRefillStock(product.id, 50)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-bold rounded-lg transition cursor-pointer"
                            >
                              +50
                            </button>
                            <button
                              type="button"
                              onClick={() => setRefillModalProduct(product)}
                              className="px-2.5 py-1 bg-cyan-950 text-cyan-300 hover:bg-cyan-900 text-[11px] font-bold rounded-lg border border-cyan-800 transition cursor-pointer"
                            >
                              Custom
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => setReviewModalProduct(product)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg transition cursor-pointer"
                              title="Manage Reviews"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEditProduct(product)}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition cursor-pointer"
                              title="Edit Product & Hero Offers"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-500 hover:text-rose-400 rounded-lg transition cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 3: LIVE ORDERS & FULFILLMENT WITH ONE-CLICK PDF & EXCEL */}
          {activeTab === "ORDERS" && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-xl space-y-4 p-4 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                    <Truck className="w-4 h-4 text-cyan-400" />
                    <span>Customer Orders & One-Click PDF / Excel Downloads</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Download full Amazon/Flipkart-style Tax Invoice PDF or complete individual Excel file with address, payment ID, and itemized specs.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={exportAllOrdersToExcel}
                    className="px-3.5 py-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-sm flex-shrink-0"
                    title="Export all database orders into single master Excel spreadsheet"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Export All Orders (Excel)</span>
                  </button>

                  <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Filter by Order ID, Phone, Customer..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <ShoppingBag className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-sm font-bold text-slate-400">No orders found</p>
                  <p className="text-xs">When customers place orders, they will appear here automatically.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-slate-950 border border-slate-800/80 p-5 rounded-3xl space-y-4 shadow-lg hover:border-slate-700 transition"
                    >
                      {/* Order Header Row */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-slate-400">Order ID: </span>
                          <span className="font-bold font-mono text-cyan-400 text-sm">{order.id}</span>
                          <span className="ml-3 text-[11px] text-slate-500">{order.createdAt}</span>
                        </div>

                        {/* Status Dropdown & Download Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => generateOrderInvoice(order)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
                            title="Download official Tax Invoice PDF"
                          >
                            <FileText className="w-3.5 h-3.5 text-rose-400" />
                            <span>Download PDF Invoice</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => exportSingleOrderToExcel(order)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-800/60 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
                            title="Download order details in Excel format"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Download Order Excel</span>
                          </button>

                          <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-800">
                            <span className="text-slate-400 font-bold text-xs">Status:</span>
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)
                              }
                              className="bg-slate-900 border border-slate-700 text-cyan-300 font-bold px-3 py-1 rounded-xl text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none cursor-pointer"
                            >
                              <option value="Placed">Placed</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Out for Delivery">Out for Delivery</option>
                              <option value="Delivered">Delivered</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Customer Info & Order Breakdown Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Customer & Address Details */}
                        <div className="space-y-2 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                          <p className="font-bold text-white text-sm flex items-center justify-between">
                            <span>{order.shippingAddress.fullName}</span>
                            <span className="text-[11px] font-normal text-slate-400">
                              Payment: <strong className="text-emerald-400">{order.paymentStatus} ({order.paymentMethod})</strong>
                            </span>
                          </p>
                          <p className="text-slate-300 flex items-center space-x-2">
                            <Phone className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{order.shippingAddress.phone}</span>
                          </p>
                          {order.shippingAddress.email && (
                            <p className="text-slate-300 flex items-center space-x-2">
                              <Mail className="w-3.5 h-3.5 text-purple-400" />
                              <span>{order.shippingAddress.email}</span>
                            </p>
                          )}
                          <p className="text-slate-300 text-[11px] pt-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 inline mr-1" />
                            {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
                            {order.shippingAddress.state} - {order.shippingAddress.pincode}
                          </p>
                          {order.paymentDetails?.transactionId && (
                            <p className="text-[11px] text-slate-400 pt-1 font-mono">
                              Txn/UPI Ref: <strong className="text-cyan-300">{order.paymentDetails.transactionId}</strong>
                            </p>
                          )}
                        </div>

                        {/* Ordered Items Breakdown */}
                        <div className="space-y-2 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                          <p className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-800 pb-1">
                            Ordered Items ({order.items.length})
                          </p>
                          <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs text-slate-300">
                                <span className="truncate max-w-[200px]">{item.product.title} (x{item.quantity})</span>
                                <span className="font-bold text-emerald-400">
                                  ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 border-t border-slate-800 flex justify-between font-black text-white text-xs">
                            <span>Grand Total Amount:</span>
                            <span className="text-cyan-400 text-sm font-black">₹{order.finalAmount.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Status Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between pt-1 text-xs border-t border-slate-900/80">
                        <div className="text-[11px] text-slate-400 space-x-2">
                          <span>Tracking Number: <strong className="font-mono text-slate-200">{order.trackingNumber}</strong></span>
                          <span>• Courier: <strong className="text-slate-300">{order.courierName}</strong></span>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, "Shipped", "Dispatched with delivery partner")}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-lg transition cursor-pointer"
                          >
                            Mark Shipped
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, "Out for Delivery", "Out for local delivery")}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold rounded-lg transition cursor-pointer"
                          >
                            Out for Delivery
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, "Delivered", "Delivered to customer successfully")}
                            className="px-3 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 font-bold rounded-lg transition cursor-pointer"
                          >
                            Mark Delivered
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 4: CUSTOMERS DIRECTORY */}
          {activeTab === "CUSTOMERS" && (
            <motion.div
              key="customers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden shadow-xl space-y-4"
            >
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-4">
                <div className="relative max-w-sm w-full">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search customers by name, email, phone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <span className="text-xs text-slate-400 font-bold">{filteredCustomers.length} Customer(s)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4">Customer Name</th>
                      <th className="py-3.5 px-4">Contact Phone</th>
                      <th className="py-3.5 px-4">Email Address</th>
                      <th className="py-3.5 px-4">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredCustomers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-bold text-white flex items-center space-x-2.5">
                          {user.avatar && (
                            <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700" />
                          )}
                          <span>{user.name}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-cyan-400">{user.phone || "N/A"}</td>
                        <td className="py-3 px-4 text-slate-300">{user.email || "N/A"}</td>
                        <td className="py-3 px-4 font-bold">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800">
                            {user.role || "customer"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* FULL PRODUCT ADD / EDIT MODAL WITH 7-IMAGE UPLOAD, SPECS, & HERO BANNER SETTINGS */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] flex flex-col text-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
                {isEditing ? <Edit className="w-5 h-5 text-cyan-400" /> : <Plus className="w-5 h-5 text-emerald-400" />}
                <span>{isEditing ? "Edit Product & Hero Promotions" : "Add New Product to Store"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleProductFormSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Product Basic Details */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">Product Title</label>
                <input
                  type="text"
                  required
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  placeholder="e.g. NoiseFit Pulse 3 Bluetooth Calling Smartwatch"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold cursor-pointer"
                  >
                    {CATEGORIES.filter((c) => c !== "All Categories").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-bold">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    placeholder="e.g. Noise, Apple, Samsung, TECH AI"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* Pricing, Discount & Stock */}
              <div className="grid grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Selling Price (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-black text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">MRP Price (₹)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 font-bold text-sm"
                  />
                  <span className="text-[10px] text-emerald-400 font-bold block">
                    Calculated: {discountPercentCalculated}% OFF
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Inventory Stock</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-cyan-400 font-bold text-sm"
                  />
                </div>
              </div>

              {/* SECTION: 7-IMAGE COMPUTER UPLOAD & URL MANAGER */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-white font-extrabold flex items-center space-x-1.5">
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span>Product Images (Max 7 Images from Computer or URL)</span>
                  </label>
                  <span className="text-[11px] font-bold text-cyan-400">{productForm.images.length} / 7 Images</span>
                </div>

                {/* Upload Buttons */}
                <div className="flex flex-wrap items-center gap-3">
                  <label className="px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 rounded-xl font-black text-xs flex items-center space-x-2 cursor-pointer transition shadow-sm">
                    <Upload className="w-4 h-4" />
                    <span>Choose Images from Computer</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="flex-1 flex gap-2 min-w-[240px]">
                    <input
                      type="text"
                      placeholder="Or paste an Image URL here"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (val && productForm.images.length < 7) {
                            setProductForm((prev) => ({
                              ...prev,
                              images: [...prev.images, val],
                              image: prev.images.length === 0 ? val : prev.image,
                            }));
                            (e.target as HTMLInputElement).value = "";
                          }
                        }
                      }}
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>

                {/* Thumbnail Strip Preview of up to 7 images */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5 pt-1">
                  {productForm.images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative group aspect-square rounded-xl bg-slate-900 border border-slate-700 p-1 overflow-hidden flex items-center justify-center shadow-sm"
                    >
                      <img src={imgUrl} alt="" className="max-h-full max-w-full object-contain" />
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 bg-cyan-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded shadow">
                          PRIMARY
                        </span>
                      )}
                      <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            className="text-[9px] px-1 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold"
                          >
                            Set Main
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="p-1 text-rose-400 hover:text-rose-300 bg-slate-900 rounded-full"
                          title="Remove Image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION: HERO SECTION BANNER & OFFERS INTEGRATION */}
              <div className="bg-gradient-to-r from-cyan-950/50 via-slate-900 to-purple-950/50 p-4 rounded-2xl border border-cyan-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-cyan-300 font-extrabold flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Hero Carousel Feature & Promotional Offers</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={productForm.isHeroFeatured}
                      onChange={(e) => setProductForm({ ...productForm, isHeroFeatured: e.target.checked })}
                      className="w-4 h-4 rounded text-cyan-500 bg-slate-950 border-slate-700 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-white">Show in Hero Banner</span>
                  </label>
                </div>

                {productForm.isHeroFeatured && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">Hero Headline Title</label>
                      <input
                        type="text"
                        value={productForm.heroBannerHeadline}
                        onChange={(e) => setProductForm({ ...productForm, heroBannerHeadline: e.target.value })}
                        placeholder="e.g. Price Dropped 20% - Limited Drop"
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-300 font-bold">Hero Badge Tag</label>
                      <input
                        type="text"
                        value={productForm.heroBadge}
                        onChange={(e) => setProductForm({ ...productForm, heroBadge: e.target.value })}
                        placeholder="e.g. FESTIVE SALE • 20% OFF"
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                      />
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-slate-300 font-bold">Hero Offer Promo Text</label>
                      <input
                        type="text"
                        value={productForm.heroOfferText}
                        onChange={(e) => setProductForm({ ...productForm, heroOfferText: e.target.value })}
                        placeholder="e.g. Buy 3 Get Small Gift Free / Purchase above ₹20,000 get Free Gift"
                        className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-cyan-300 font-bold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION: DYNAMIC SPECIFICATIONS MANAGER */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
                <label className="text-white font-extrabold flex items-center space-x-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                  <span>Technical Specifications (Key-Value)</span>
                </label>

                {/* Existing Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(productForm.specs || {}).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                      <span className="font-bold text-slate-400 truncate max-w-[120px]">{key}:</span>
                      <span className="text-white font-semibold truncate max-w-[140px] ml-1">{val}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpec(key)}
                        className="text-slate-500 hover:text-rose-400 ml-2"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new spec input row */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Spec Name (e.g. Battery, RAM, Warranty)"
                    value={newSpecKey}
                    onChange={(e) => setNewSpecKey(e.target.value)}
                    className="w-1/2 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. 5000 mAh, 8GB, 1 Year)"
                    value={newSpecValue}
                    onChange={(e) => setNewSpecValue(e.target.value)}
                    className="w-1/2 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpec}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex-shrink-0 cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold">Product Description</label>
                <textarea
                  rows={3}
                  required
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  {isEditing ? "Save Product Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEWS MANAGER MODAL */}
      {reviewModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-3xl p-6 shadow-2xl space-y-4 my-auto max-h-[90vh] flex flex-col text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                <Star className="w-4 h-4 text-amber-400" />
                <span>Manage Customer Reviews: {reviewModalProduct.title}</span>
              </h3>
              <button
                type="button"
                onClick={() => setReviewModalProduct(null)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of current reviews */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-60">
              {(reviewModalProduct.reviews || []).length === 0 ? (
                <p className="text-slate-500 py-4 text-center">No reviews submitted yet.</p>
              ) : (
                (reviewModalProduct.reviews || []).map((rev) => (
                  <div key={rev.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{rev.userName}</span>
                        <div className="flex items-center text-amber-400">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        {rev.verifiedPurchase && (
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                            Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReviewId(rev.id);
                            setNewReviewForm({
                              userName: rev.userName,
                              rating: rev.rating,
                              comment: rev.comment,
                              verifiedPurchase: !!rev.verifiedPurchase,
                            });
                          }}
                          className="text-cyan-400 hover:underline text-[11px]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(rev.id)}
                          className="text-rose-400 hover:underline text-[11px]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-300">{rev.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add / Edit Review Form */}
            <form onSubmit={handleSaveReview} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
              <h4 className="font-bold text-white text-xs">
                {editingReviewId ? "Edit Review" : "Add Verified Review"}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Customer Name"
                  value={newReviewForm.userName}
                  onChange={(e) => setNewReviewForm({ ...newReviewForm, userName: e.target.value })}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
                <select
                  value={newReviewForm.rating}
                  onChange={(e) => setNewReviewForm({ ...newReviewForm, rating: Number(e.target.value) })}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-amber-400 font-bold"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                  <option value={3}>⭐⭐⭐ (3 Stars)</option>
                  <option value={2}>⭐⭐ (2 Stars)</option>
                  <option value={1}>⭐ (1 Star)</option>
                </select>
              </div>
              <textarea
                required
                rows={2}
                placeholder="Review comment content..."
                value={newReviewForm.comment}
                onChange={(e) => setNewReviewForm({ ...newReviewForm, comment: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-white"
              />
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-1.5 text-slate-300">
                  <input
                    type="checkbox"
                    checked={newReviewForm.verifiedPurchase}
                    onChange={(e) => setNewReviewForm({ ...newReviewForm, verifiedPurchase: e.target.checked })}
                    className="w-3.5 h-3.5 rounded"
                  />
                  <span>Verified Purchase</span>
                </label>
                <div className="space-x-2">
                  {editingReviewId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReviewId(null);
                        setNewReviewForm({ userName: "", rating: 5, comment: "", verifiedPurchase: true });
                      }}
                      className="text-slate-400 px-2"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl"
                  >
                    {editingReviewId ? "Save Review" : "Add Review"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REFILL STOCK MODAL */}
      {refillModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              <span>Refill Inventory Stock</span>
            </h3>

            <p className="text-slate-300">
              Refilling stock for: <strong className="text-white">{refillModalProduct.title}</strong>
            </p>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold">Add Quantity Units</label>
              <input
                type="number"
                min={1}
                value={refillAmount}
                onChange={(e) => setRefillAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-cyan-400 font-bold text-base"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRefillModalProduct(null)}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRefillStock(refillModalProduct.id, refillAmount)}
                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl"
              >
                Confirm Refill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
