"use client";
import { useAdminFeedback } from "@/components/admin/AdminFeedback";

import { checkProductImages } from "@/lib/product-images";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import AdminShell, { type AdminTab } from "@/components/admin/AdminShell";
import CouponManager from "@/components/admin/CouponManager";
import CustomerDetails from "@/components/admin/CustomerDetails";
import AdminOverview from "@/components/admin/AdminOverview";
import {
  AdminImage,
  AdminModal,
  AdminError,
  AdminEmpty,
  AdminLoading,
  FormSection,
} from "@/components/admin/AdminUI";
import HeroCampaignManager from "@/components/HeroCampaignManager";
import RefundManagement from "@/components/RefundManagement";
import { Product, Order, OrderStatus, User, Review } from "@/lib/types";
import { CATEGORIES } from "@/lib/data";
import { generateOrderInvoice } from "@/lib/generateInvoice";
import { exportSingleOrderToExcel } from "@/lib/exportOrderExcel";
import {
  exportAnalyticsToPdf,
  exportAnalyticsToExcel,
} from "@/lib/exportAnalyticsReport";
import { normalizeProductImage } from "@/lib/normalizeProductImage";
import * as XLSX from "xlsx";
import {
  ShoppingBag,
  Plus,
  RefreshCw,
  Trash2,
  Truck,
  Phone,
  Mail,
  Search,
  MapPin,
  Sparkles,
  SlidersHorizontal,
  FileText,
  FileSpreadsheet,
  Edit,
  Star,
  Image as ImageIcon,
  Upload,
  X,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { notify, confirm: confirmAction } = useAdminFeedback();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<AdminTab>("ANALYTICS");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    null,
  );
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
  const [syncError, setSyncError] = useState("");
  const liveDataAbortRef = useRef<AbortController | null>(null);

  // Product Add / Edit Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
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
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
    images: [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
    ],
    originalImage:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
    normalizedImage: "",
    imageFit: "auto" as "auto" | "standard" | "full-product",
    imageScale: "medium" as "small" | "medium" | "large",
    imagePosition: "center" as "center" | "top" | "bottom",
    description:
      "High-performance smart device designed for premium speed, durability, and seamless convenience.",
    features: [
      "Intelligent Next-Gen Processing",
      "Fast Charging & Long Battery",
      "100% Genuine Build",
    ],
    specs: {
      Warranty: "1 Year Official Brand Warranty",
      Connectivity: "Bluetooth & Type-C",
    } as Record<string, string>,
  });

  // Specifications Form State
  const [newSpecKey, setNewSpecKey] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");

  // Features Form State
  const [newFeatureText, setNewFeatureText] = useState("");

  // Reviews Manager Modal State
  const [reviewModalProduct, setReviewModalProduct] = useState<Product | null>(
    null,
  );
  const [newReviewForm, setNewReviewForm] = useState({
    userName: "",
    rating: 5,
    comment: "",
    verifiedPurchase: true,
  });
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);

  // Stock Refill Modal State
  const [refillModalProduct, setRefillModalProduct] = useState<Product | null>(
    null,
  );
  const [refillAmount, setRefillAmount] = useState(10);

  const [authChecking, setAuthChecking] = useState(true);
  const [isNormalizingImage, setIsNormalizingImage] = useState(false);
  const [imagesReviewed, setImagesReviewed] = useState(false);
  useEffect(() => {
    setImagesReviewed(false);
  }, [productForm.title, productForm.images, productForm.normalizedImage]);
  const [normalizationMessage, setNormalizationMessage] = useState("");
  const [normalizingProductId, setNormalizingProductId] = useState<
    string | null
  >(null);
  const [isNormalizingAll, setIsNormalizingAll] = useState(false);

  // Fetch real-time live statistics and orders from MongoDB
  const fetchLiveData = useCallback(async (showIndicator = false) => {
    // Never queue another full dashboard request while MongoDB is reconnecting.
    if (liveDataAbortRef.current) return;
    if (showIndicator) setIsRefreshing(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    liveDataAbortRef.current = controller;
    try {
      const res = await fetch("/api/admin/stats", {
        cache: "no-store",
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        // A reported service outage is a recoverable UI state, not a render error.
        setSyncError(
          data?.message || "Unable to refresh dashboard data. Please retry.",
        );
        return;
      }
      setStats(data.stats);
      setOrders(data.orders || []);
      setProducts(data.products || []);
      setCustomers(data.customers || []);
      setLastSyncTime(
        new Date(data.lastUpdated || Date.now()).toLocaleTimeString(),
      );
      setSyncError(
        data.isStale
          ? "Showing the last successful dashboard data while the database reconnects."
          : "",
      );
    } catch (error) {
      if ((error as Error).name !== "AbortError")
        console.error("Error fetching live admin stats:", error);
      setSyncError(
        (error as Error).name === "AbortError"
          ? "Dashboard sync timed out. Please retry."
          : "Dashboard data is temporarily unavailable. Please retry.",
      );
    } finally {
      window.clearTimeout(timeout);
      if (liveDataAbortRef.current === controller)
        liveDataAbortRef.current = null;
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

  // A full dashboard snapshot is expensive. Poll sparingly and never overlap requests.
  useEffect(() => {
    if (authChecking) return;
    const interval = setInterval(() => fetchLiveData(false), 30000);
    return () => clearInterval(interval);
  }, [authChecking, fetchLiveData]);

  useEffect(() => () => liveDataAbortRef.current?.abort(), []);

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
    note?: string,
  ) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note }),
      });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message || "Order update failed.");
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order,
        ),
      );
      notify("Order status updated.", "success");
      fetchLiveData();
    } catch (err) {
      console.error("Failed to update order status:", err);
      notify(
        err instanceof Error ? err.message : "The action failed. Please retry.",
      );
    }
  };

  const handleRefillStock = async (productId: string, addQty: number) => {
    try {
      const response = await fetch(`/api/products/${productId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: addQty }),
      });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message || "Stock update failed.");
      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId
            ? { ...product, stock: Math.max(0, product.stock + addQty) }
            : product,
        ),
      );
      notify("Inventory updated.", "success");
      fetchLiveData();
      setRefillModalProduct(null);
    } catch (err) {
      console.error("Failed to refill stock:", err);
      notify(
        err instanceof Error ? err.message : "The action failed. Please retry.",
      );
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!(await confirmAction("Are you sure you want to delete this product?")))
      return;
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message || "Product could not be deleted.");
      setProducts((prev) => prev.filter((product) => product.id !== productId));
      notify("Product deleted.", "success");
      fetchLiveData();
    } catch (err) {
      console.error("Failed to delete product:", err);
      notify(
        err instanceof Error ? err.message : "The action failed. Please retry.",
      );
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
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
      images: [
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
      ],
      originalImage:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
      normalizedImage: "",
      imageFit: "auto",
      imageScale: "medium",
      imagePosition: "center",
      description:
        "High-performance smart device designed for premium speed, durability, and seamless convenience.",
      features: [
        "Intelligent Next-Gen Processing",
        "Fast Charging & Long Battery",
        "100% Genuine Build",
      ],
      specs: {
        Warranty: "1 Year Official Brand Warranty",
        Connectivity: "Bluetooth & Type-C",
      },
    });
    setIsProductModalOpen(true);
  };

  // Open modal for Editing an existing product
  const handleOpenEditProduct = (product: Product) => {
    setIsEditing(true);
    setEditingProductId(product.id);
    const existingImages =
      product.images && product.images.length > 0
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
      heroBadge:
        product.heroBadge ||
        (product.discountPercent > 0
          ? `${product.discountPercent}% OFF`
          : "SPECIAL OFFER"),
      heroOfferText: product.heroOfferText || "Buy 3 Get Small Gift Free",
      image: product.image,
      images: existingImages,
      originalImage: product.originalImage || product.image,
      normalizedImage: product.normalizedImage || "",
      imageFit: product.imageFit || "auto",
      imageScale: product.imageScale || "medium",
      imagePosition: product.imagePosition || "center",
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
      notify("Maximum of 7 images allowed per product.");
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
              originalImage:
                prev.images.length === 0
                  ? updatedImages[0]
                  : prev.originalImage,
              normalizedImage:
                prev.images.length === 0 ? "" : prev.normalizedImage,
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
      const newPrimary =
        filtered[0] ||
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80";
      return {
        ...prev,
        images: filtered,
        image: newPrimary,
        originalImage: newPrimary,
        normalizedImage: "",
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
        originalImage: reordered[0],
        normalizedImage: "",
      };
    });
  };

  const handleNormalizeFormImage = async () => {
    const source =
      productForm.originalImage || productForm.images[0] || productForm.image;
    if (!source) return;

    setIsNormalizingImage(true);
    setNormalizationMessage("");
    try {
      const normalized = await normalizeProductImage(source, {
        fit: productForm.imageFit,
        scale: productForm.imageScale,
        position: productForm.imagePosition,
      });
      setProductForm((prev) => ({
        ...prev,
        originalImage: source,
        normalizedImage: normalized,
      }));
      setNormalizationMessage(
        "Normalized preview ready. Save the product to keep it.",
      );
    } catch (error) {
      setNormalizationMessage(
        "This image cannot be normalized in the browser. The original will remain available.",
      );
    } finally {
      setIsNormalizingImage(false);
    }
  };

  const normalizeProductForCatalog = async (product: Product) => {
    const source = product.originalImage || product.image;
    if (!source) return false;

    try {
      const normalized = await normalizeProductImage(source, {
        fit: product.imageFit || "auto",
        scale: product.imageScale || "medium",
        position: product.imagePosition || "center",
      });
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalImage: source,
          normalizedImage: normalized,
          imageFit: product.imageFit || "auto",
          imageScale: product.imageScale || "medium",
          imagePosition: product.imagePosition || "center",
        }),
      });
      const data = await response.json();
      if (!data.success) return false;
      setProducts((prev) =>
        prev.map((item) => (item.id === product.id ? data.product : item)),
      );
      return true;
    } catch (error) {
      console.error("Failed to normalize product image:", error);
      return false;
    }
  };

  const handleNormalizeSingleProduct = async (product: Product) => {
    setNormalizingProductId(product.id);
    await normalizeProductForCatalog(product);
    setNormalizingProductId(null);
  };

  const handleNormalizeAllProducts = async () => {
    if (
      !products.length ||
      !(await confirmAction(
        `Normalize catalog images for all ${products.length} products? Originals will be preserved.`,
      ))
    )
      return;
    setIsNormalizingAll(true);
    for (const product of products) await normalizeProductForCatalog(product);
    setIsNormalizingAll(false);
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
    if (isSavingProduct) return;
    if (!imagesReviewed) {
      notify(
        "Check that every image shows the correct brand and model, then confirm the image review.",
      );
      return;
    }
    setIsSavingProduct(true);
    try {
      await checkProductImages([
        ...productForm.images,
        productForm.image,
        productForm.originalImage,
        productForm.normalizedImage,
      ]);
    } catch (error) {
      notify((error as Error).message);
      setIsSavingProduct(false);
      return;
    }
    const discount =
      productForm.originalPrice > productForm.price
        ? Math.round(
            ((productForm.originalPrice - productForm.price) /
              productForm.originalPrice) *
              100,
          )
        : 0;

    const payload = {
      ...productForm,
      discountPercent: discount,
      image: productForm.images[0] || productForm.image,
      images:
        productForm.images.length > 0
          ? productForm.images
          : [productForm.image],
      originalImage:
        productForm.originalImage || productForm.images[0] || productForm.image,
      normalizedImage: productForm.normalizedImage || "",
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
          notify("Product saved successfully.", "success");
          fetchLiveData(true);
        } else {
          notify(data.message || "Failed to update product");
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
          notify("Product saved successfully.", "success");
          fetchLiveData(true);
        } else {
          notify(data.message || "Failed to create product");
        }
      }
    } catch (err) {
      notify("An error occurred while saving the product.");
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Reviews Manager Submit
  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !reviewModalProduct ||
      !newReviewForm.userName ||
      !newReviewForm.comment
    )
      return;

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
        r.id === editingReviewId ? newRev : r,
      );
    } else {
      updatedReviews = [newRev, ...(reviewModalProduct.reviews || [])];
    }

    // Recalculate average rating
    const avgRating = Number(
      (
        updatedReviews.reduce((sum, r) => sum + r.rating, 0) /
        updatedReviews.length
      ).toFixed(1),
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
        setReviewModalProduct((prev) =>
          prev
            ? {
                ...prev,
                reviews: updatedReviews,
                rating: avgRating,
                reviewCount: updatedReviews.length,
              }
            : null,
        );
        setNewReviewForm({
          userName: "",
          rating: 5,
          comment: "",
          verifiedPurchase: true,
        });
        setEditingReviewId(null);
        fetchLiveData();
      }
    } catch (err) {
      console.error("Failed to save review:", err);
      notify(
        err instanceof Error ? err.message : "The action failed. Please retry.",
      );
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!reviewModalProduct) return;
    const updatedReviews = (reviewModalProduct.reviews || []).filter(
      (r) => r.id !== reviewId,
    );
    const avgRating =
      updatedReviews.length > 0
        ? Number(
            (
              updatedReviews.reduce((sum, r) => sum + r.rating, 0) /
              updatedReviews.length
            ).toFixed(1),
          )
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
      setReviewModalProduct((prev) =>
        prev
          ? {
              ...prev,
              reviews: updatedReviews,
              rating: avgRating,
              reviewCount: updatedReviews.length,
            }
          : null,
      );
      fetchLiveData();
    } catch (err) {
      console.error("Failed to delete review:", err);
      notify(
        err instanceof Error ? err.message : "The action failed. Please retry.",
      );
    }
  };

  // Bulk Export Orders
  const exportAllOrdersToExcel = () => {
    const exportData = orders.map((order) => ({
      "Order ID": order.id,
      "Customer Name": order.shippingAddress.fullName,
      Phone: order.shippingAddress.phone,
      Email: order.shippingAddress.email,
      "Delivery Address": `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
      "Items Count": order.items.reduce((s, i) => s + i.quantity, 0),
      "Payment Mode": order.paymentMethod,
      "Payment Status": order.paymentStatus,
      "Order Status": order.status,
      "Tracking Number": order.trackingNumber,
      Courier: order.courierName,
      "Subtotal (₹)": order.totalAmount,
      "Discount (₹)": order.discountAmount,
      "Grand Total (₹)": order.finalAmount,
      "Date Placed": order.createdAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "All Orders");
    XLSX.writeFile(
      workbook,
      `TECHAI-Orders-Ledger-${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
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
        o.status.toLowerCase().includes(query),
    );
  }, [orders, orderSearch]);

  const filteredProducts = useMemo(() => {
    const query = productSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query),
    );
  }, [products, productSearch]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query),
    );
  }, [customers, customerSearch]);

  if (authChecking) {
    return (
      <div className="min-h-screen bg-admin-surface flex items-center justify-center font-sans">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-admin-border border-t-admin-primary rounded-full"
        />
      </div>
    );
  }

  const discountPercentCalculated =
    productForm.originalPrice > productForm.price
      ? Math.round(
          ((productForm.originalPrice - productForm.price) /
            productForm.originalPrice) *
            100,
        )
      : 0;

  return (
    <AdminShell
      activeTab={activeTab}
      onNavigate={setActiveTab}
      onRefresh={() => fetchLiveData(true)}
      onLogout={handleLogout}
      refreshing={isRefreshing || isLoading}
      lastSync={lastSyncTime}
      error={syncError}
      actions={
        lastSyncTime ? (
          <>
            {" "}
            <div className="flex flex-wrap items-center gap-2">
              {activeTab === "ANALYTICS" && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      exportAnalyticsToPdf(stats, orders, products)
                    }
                    className="px-3.5 py-2 bg-admin-subtle hover:bg-admin-subtle text-admin-danger border border-admin-border rounded-xl text-xs font-medium flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Export PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      exportAnalyticsToExcel(stats, orders, products)
                    }
                    className="px-3.5 py-2 bg-admin-success-bg hover:bg-admin-success-bg text-admin-success border border-admin-border rounded-xl text-xs font-medium flex items-center space-x-1.5 transition shadow-sm cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Export Excel</span>
                  </button>
                </>
              )}

              {activeTab === "PRODUCTS" && (
                <button
                  type="button"
                  onClick={handleOpenAddProduct}
                  className="px-4 py-2.5 bg-admin-primary hover:bg-admin-primary-hover text-admin-on-primary rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-all  cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              )}

              {activeTab === "ORDERS" && (
                <button
                  type="button"
                  onClick={exportAllOrdersToExcel}
                  className="px-4 py-2 bg-admin-primary hover:bg-admin-primary text-admin-on-primary rounded-xl text-xs font-medium flex items-center space-x-1.5 transition  cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Export All Orders (Excel)</span>
                </button>
              )}
            </div>
          </>
        ) : null
      }
    >
      {syncError && (
        <AdminError
          message={syncError}
          retry={() => fetchLiveData(true)}
          busy={isRefreshing}
        />
      )}
      {activeTab === "COUPONS" ? (
        <CouponManager />
      ) : isLoading ? (
        <AdminLoading />
      ) : !lastSyncTime ? (
        <AdminEmpty
          title="Store data is unavailable"
          description="Retry the connection to load your products, orders and statistics."
        />
      ) : (
        <>
          {/* TAB 1: OVERVIEW & ANALYTICS */}
          <AnimatePresence mode="wait">
            {activeTab === "CAMPAIGNS" && (
              <motion.div
                key="campaigns"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-admin-border bg-admin-surface p-4  sm:p-6"
              >
                <HeroCampaignManager products={products} />
              </motion.div>
            )}

            {activeTab === "REFUNDS" && (
              <motion.div
                key="refunds"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-admin-border bg-admin-surface p-4  sm:p-6"
              >
                <RefundManagement />
              </motion.div>
            )}

            {activeTab === "ANALYTICS" && (
              <AdminOverview
                key="analytics"
                stats={stats}
                orders={orders}
                products={products}
              />
            )}

            {/* TAB 2: PRODUCTS & STOCK MANAGEMENT */}
            {activeTab === "PRODUCTS" && (
              <motion.div
                key="products"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-admin-surface  border border-admin-border rounded-xl overflow-hidden  space-y-4"
              >
                <div className="p-4 sm:p-5 border-b border-admin-border flex flex-wrap items-center justify-between gap-4">
                  <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-admin-muted" />
                    <input
                      type="text"
                      aria-label="Search products by title, brand, category..."
                      placeholder="Search products by title, brand, category..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-admin-surface border border-admin-border rounded-xl text-xs text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-primary"
                    />
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-admin-muted font-medium">
                      {filteredProducts.length} Product(s)
                    </span>
                    <button
                      type="button"
                      onClick={handleNormalizeAllProducts}
                      disabled={isNormalizingAll || products.length === 0}
                      className="px-3 py-1.5 bg-admin-subtle hover:bg-admin-subtle disabled:opacity-50 text-admin-info font-medium rounded-xl transition cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isNormalizingAll ? "animate-spin" : ""}`}
                      />
                      {isNormalizingAll ? "Normalizing..." : "Normalize Images"}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-admin-text">
                    <thead className="bg-admin-surface text-admin-muted  text-[10px] border-b border-admin-border">
                      <tr>
                        <th className="py-3.5 px-4">Product Info</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Price & Discount</th>
                        <th className="py-3.5 px-4">Hero Featured</th>
                        <th className="py-3.5 px-4">Stock Level</th>
                        <th className="py-3.5 px-4 text-center">
                          Refill Inventory
                        </th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-admin-border">
                      {filteredProducts.length === 0 && (
                        <tr>
                          <td colSpan={7}>
                            <AdminEmpty
                              title="No products found"
                              description="Try another search or add your first product."
                            />
                          </td>
                        </tr>
                      )}
                      {filteredProducts.map((product) => (
                        <tr
                          key={product.id}
                          className="hover:bg-admin-subtle transition-colors"
                        >
                          <td className="py-3 px-4 flex items-center space-x-3">
                            <AdminImage
                              src={product.normalizedImage || product.image}
                              alt={product.title}
                              className="w-11 h-11 object-contain bg-admin-surface rounded-xl p-1 border border-admin-border flex-shrink-0"
                            />
                            <div className="space-y-0.5 max-w-xs">
                              <p className="font-medium text-admin-text line-clamp-1">
                                {product.title}
                              </p>
                              <p className="text-[11px] text-admin-muted">
                                {product.brand} • {product.images?.length || 1}{" "}
                                image(s)
                              </p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-admin-text font-semibold">
                            {product.category}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-medium text-admin-success">
                              ₹{product.price.toLocaleString("en-IN")}
                            </p>
                            {product.originalPrice > product.price && (
                              <p className="text-[10px] text-admin-muted line-through">
                                MRP ₹
                                {product.originalPrice.toLocaleString("en-IN")}{" "}
                                ({product.discountPercent}% OFF)
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {product.isHeroFeatured ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-admin-info-bg text-admin-info border border-admin-border">
                                <Sparkles className="w-3 h-3 text-admin-info" />
                                <span>Hero Carousel</span>
                              </span>
                            ) : (
                              <span className="text-admin-muted text-[11px]">
                                Standard
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`font-medium px-2.5 py-1 rounded-full text-[11px] inline-block ${
                                product.stock <= 5
                                  ? "bg-admin-danger-bg text-admin-danger border border-admin-border"
                                  : "bg-admin-success-bg text-admin-success border border-admin-border"
                              }`}
                            >
                              {product.stock} units
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleRefillStock(product.id, 10)
                                }
                                className="px-2.5 py-1 bg-admin-subtle hover:bg-admin-subtle text-admin-info text-[11px] font-medium rounded-lg transition cursor-pointer"
                              >
                                +10
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRefillStock(product.id, 50)
                                }
                                className="px-2.5 py-1 bg-admin-subtle hover:bg-admin-subtle text-admin-success text-[11px] font-medium rounded-lg transition cursor-pointer"
                              >
                                +50
                              </button>
                              <button
                                type="button"
                                onClick={() => setRefillModalProduct(product)}
                                className="px-2.5 py-1 bg-admin-info-bg text-admin-info hover:bg-admin-info-bg text-[11px] font-medium rounded-lg border border-admin-border transition cursor-pointer"
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
                                className="p-1.5 bg-admin-subtle hover:bg-admin-subtle text-admin-warning rounded-lg transition cursor-pointer"
                                title="Manage Reviews"
                              >
                                <Star className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditProduct(product)}
                                className="p-1.5 bg-admin-subtle hover:bg-admin-subtle text-admin-info rounded-lg transition cursor-pointer"
                                title="Edit Product & Hero Offers"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleNormalizeSingleProduct(product)
                                }
                                disabled={normalizingProductId === product.id}
                                className="p-1.5 bg-admin-subtle hover:bg-admin-subtle disabled:opacity-50 text-admin-info rounded-lg transition cursor-pointer"
                                title="Normalize catalog image"
                              >
                                <RefreshCw
                                  className={`w-3.5 h-3.5 ${normalizingProductId === product.id ? "animate-spin" : ""}`}
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-1.5 bg-admin-subtle hover:bg-admin-danger-bg text-admin-muted hover:text-admin-danger rounded-lg transition cursor-pointer"
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
                className="admin-orders-section"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-admin-border pb-4">
                  <div>
                    <h3 className="text-sm font-medium text-admin-text flex items-center space-x-2">
                      <Truck className="w-4 h-4 text-admin-info" />
                      <span>Customer orders</span>
                    </h3>
                    <p className="text-[11px] text-admin-muted mt-0.5">
                      Review each order, download invoices and update delivery
                      status.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                    <div className="relative max-w-xs w-full">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-admin-muted" />
                      <input
                        type="text"
                        aria-label="Filter by Order ID, Phone, Customer..."
                        placeholder="Filter by Order ID, Phone, Customer..."
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-admin-surface border border-admin-border rounded-xl text-xs text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-primary"
                      />
                    </div>
                  </div>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="py-12 text-center text-admin-muted space-y-2">
                    <ShoppingBag className="w-10 h-10 mx-auto text-admin-muted" />
                    <p className="text-sm font-medium text-admin-muted">
                      No orders found
                    </p>
                    <p className="text-xs">
                      When customers place orders, they will appear here
                      automatically.
                    </p>
                  </div>
                ) : (
                  <div className="admin-order-list">
                    {filteredOrders.map((order) => (
                      <div key={order.id} className="admin-order-card">
                        {/* Order Header Row */}
                        <div className="admin-order-heading">
                          <div className="admin-order-identity">
                            <span className="text-admin-muted">Order ID: </span>
                            <span className="font-medium font-mono text-admin-info text-sm">
                              {order.id}
                            </span>
                            <span className="ml-3 text-[11px] text-admin-muted">
                              {new Date(order.createdAt).toLocaleString(
                                "en-IN",
                              )}
                            </span>
                          </div>

                          {/* Status Dropdown & Download Buttons */}
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => generateOrderInvoice(order)}
                              className="px-3 py-1.5 bg-admin-surface hover:bg-admin-subtle text-admin-danger border border-admin-border rounded-xl text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
                              title="Download official Tax Invoice PDF"
                            >
                              <FileText className="w-3.5 h-3.5 text-admin-danger" />
                              <span>Download PDF Invoice</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => exportSingleOrderToExcel(order)}
                              className="px-3 py-1.5 bg-admin-surface hover:bg-admin-subtle text-admin-success border border-admin-border rounded-xl text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer shadow-sm"
                              title="Download order details in Excel format"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5 text-admin-success" />
                              <span>Download Order Excel</span>
                            </button>

                            <div className="flex items-center space-x-1.5 pl-2 border-l border-admin-border">
                              <span className="text-admin-muted font-medium text-xs">
                                Status:
                              </span>
                              <select
                                aria-label={`Fulfilment status for ${order.id}`}
                                value={order.status}
                                onChange={(e) =>
                                  handleUpdateOrderStatus(
                                    order.id,
                                    e.target.value as OrderStatus,
                                  )
                                }
                                className="bg-admin-surface border border-admin-border text-admin-info font-medium px-3 py-1 rounded-xl text-xs focus:ring-2 focus:ring-admin-primary focus:outline-none cursor-pointer"
                              >
                                <option value="Placed">Placed</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Out for Delivery">
                                  Out for Delivery
                                </option>
                                <option value="Delivered">Delivered</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Customer Info & Order Breakdown Grid */}
                        <div className="admin-order-body grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                          {/* Customer & Address Details */}
                          <div className="space-y-2 min-w-0">
                            <p className="font-medium text-admin-text text-sm flex flex-wrap gap-2 items-center justify-between">
                              <span>{order.shippingAddress.fullName}</span>
                              <span className="text-[11px] font-normal text-admin-muted">
                                Payment:{" "}
                                <strong
                                  className={`admin-badge ${order.paymentStatus === "Paid" ? "success" : order.paymentStatus === "Failed" ? "danger" : "warning"}`}
                                >
                                  {order.paymentStatus} ({order.paymentMethod})
                                </strong>
                              </span>
                            </p>
                            <p className="text-admin-text flex items-center space-x-2">
                              <Phone className="w-3.5 h-3.5 text-admin-info" />
                              <span>{order.shippingAddress.phone}</span>
                            </p>
                            {order.shippingAddress.email && (
                              <p className="text-admin-text flex items-center space-x-2">
                                <Mail className="w-3.5 h-3.5 text-admin-info" />
                                <span>{order.shippingAddress.email}</span>
                              </p>
                            )}
                            <p className="text-admin-text text-[11px] pt-1">
                              <MapPin className="w-3.5 h-3.5 text-admin-muted inline mr-1" />
                              {order.shippingAddress.street},{" "}
                              {order.shippingAddress.city},{" "}
                              {order.shippingAddress.state} -{" "}
                              {order.shippingAddress.pincode}
                            </p>
                            {order.paymentDetails?.transactionId && (
                              <p className="text-[11px] text-admin-muted pt-1 font-mono">
                                Txn/UPI Ref:{" "}
                                <strong className="text-admin-info">
                                  {order.paymentDetails.transactionId}
                                </strong>
                              </p>
                            )}
                          </div>

                          {/* Ordered Items Breakdown */}
                          <div className="space-y-2 min-w-0">
                            <p className="font-medium text-admin-text text-xs  border-b border-admin-border pb-1">
                              Ordered Items ({order.items.length})
                            </p>
                            <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                              {order.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between items-center text-xs text-admin-text"
                                >
                                  <span className="min-w-0 pr-3">
                                    {item.product.title} (x{item.quantity})
                                  </span>
                                  <span className="font-medium text-admin-success">
                                    ₹
                                    {(
                                      item.product.price * item.quantity
                                    ).toLocaleString("en-IN")}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="pt-2 border-t border-admin-border flex justify-between font-medium text-admin-text text-xs">
                              <span>Grand Total Amount:</span>
                              <span className="text-admin-info text-sm font-medium">
                                ₹{order.finalAmount.toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Status Action Buttons */}
                        <div className="admin-order-footer">
                          <div className="text-[11px] text-admin-muted space-x-2">
                            <span>
                              Tracking Number:{" "}
                              <strong className="font-mono text-admin-text">
                                {order.trackingNumber}
                              </strong>
                            </span>
                            <span>
                              • Courier:{" "}
                              <strong className="text-admin-text">
                                {order.courierName}
                              </strong>
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1 sm:pt-0">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateOrderStatus(
                                  order.id,
                                  "Shipped",
                                  "Dispatched with delivery partner",
                                )
                              }
                              className="px-3 py-1 bg-admin-subtle hover:bg-admin-subtle text-admin-info font-medium rounded-lg transition cursor-pointer"
                            >
                              Mark Shipped
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateOrderStatus(
                                  order.id,
                                  "Out for Delivery",
                                  "Out for local delivery",
                                )
                              }
                              className="px-3 py-1 bg-admin-subtle hover:bg-admin-subtle text-admin-info font-medium rounded-lg transition cursor-pointer"
                            >
                              Out for Delivery
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateOrderStatus(
                                  order.id,
                                  "Delivered",
                                  "Delivered to customer successfully",
                                )
                              }
                              className="px-3 py-1 bg-admin-success-bg hover:bg-admin-success-bg text-admin-success border border-admin-border font-medium rounded-lg transition cursor-pointer"
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
                className="bg-admin-surface  border border-admin-border rounded-xl overflow-hidden  space-y-4"
              >
                <div className="p-4 sm:p-5 border-b border-admin-border flex items-center justify-between gap-4">
                  <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-admin-muted" />
                    <input
                      type="text"
                      aria-label="Search customers by name, email, phone..."
                      placeholder="Search customers by name, email, phone..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-admin-surface border border-admin-border rounded-xl text-xs text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-primary"
                    />
                  </div>
                  <span className="text-xs text-admin-muted font-medium">
                    {filteredCustomers.length} Customer(s)
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-admin-text">
                    <thead className="bg-admin-surface text-admin-muted  text-[10px] border-b border-admin-border">
                      <tr>
                        <th className="py-3.5 px-4">Customer Name</th>
                        <th className="py-3.5 px-4">Contact Phone</th>
                        <th className="py-3.5 px-4">Email Address</th>
                        <th className="py-3.5 px-4">Role</th>
                        <th className="py-3.5 px-4">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-admin-border">
                      {filteredCustomers.length === 0 && (
                        <tr>
                          <td colSpan={5}>
                            <AdminEmpty
                              title="No customers found"
                              description="Try a different name, email or phone number."
                            />
                          </td>
                        </tr>
                      )}
                      {filteredCustomers.map((user) => (
                        <tr
                          key={user.id}
                          className="hover:bg-admin-subtle transition-colors"
                        >
                          <td className="py-3 px-4 font-medium text-admin-text flex items-center space-x-2.5">
                            {user.avatar && (
                              <AdminImage
                                src={user.avatar}
                                alt={user.name}
                                className="w-7 h-7 rounded-full bg-admin-subtle border border-admin-border"
                              />
                            )}
                            <span>{user.name}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-admin-info">
                            {user.phone || "N/A"}
                          </td>
                          <td className="py-3 px-4 text-admin-text">
                            {user.email || "N/A"}
                          </td>
                          <td className="py-3 px-4 font-medium">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-admin-info-bg text-admin-info border border-admin-border">
                              {user.role || "customer"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              className="admin-button whitespace-nowrap"
                              aria-label={`View details for ${user.name}`}
                              onClick={() => setSelectedCustomerId(user.id)}
                            >
                              View details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {selectedCustomerId && (
        <CustomerDetails
          key={selectedCustomerId}
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}

      {/* FULL PRODUCT ADD / EDIT MODAL WITH 7-IMAGE UPLOAD, SPECS, & HERO BANNER SETTINGS */}
      {isProductModalOpen && (
        <AdminModal
          label="Product editor"
          onClose={() => setIsProductModalOpen(false)}
        >
          <div className="bg-admin-surface border border-admin-border w-full max-w-3xl rounded-xl p-6  space-y-5 my-auto max-h-[92vh] flex flex-col text-admin-text">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-admin-border pb-3">
              <h3 className="text-base font-medium text-admin-text flex items-center space-x-2">
                {isEditing ? (
                  <Edit className="w-5 h-5 text-admin-info" />
                ) : (
                  <Plus className="w-5 h-5 text-admin-success" />
                )}
                <span>
                  {isEditing
                    ? "Edit Product & Hero Promotions"
                    : "Add New Product to Store"}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                aria-label="Close product editor"
                className="w-8 h-8 rounded-full bg-admin-subtle hover:bg-admin-subtle flex items-center justify-center text-admin-muted hover:text-admin-text transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form
              id="admin-product-form"
              onSubmit={handleProductFormSubmit}
              className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs"
            >
              <FormSection title="Basic information">
                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-field-1"
                    className="text-admin-text font-medium"
                  >
                    Product Title
                  </label>
                  <input
                    id="admin-field-1"
                    type="text"
                    required
                    value={productForm.title}
                    onChange={(e) =>
                      setProductForm({ ...productForm, title: e.target.value })
                    }
                    placeholder="e.g. NoiseFit Pulse 3 Bluetooth Calling Smartwatch"
                    className="w-full px-3 py-2 bg-admin-surface border border-admin-border rounded-xl text-admin-text focus:ring-2 focus:ring-admin-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="admin-field-2"
                      className="text-admin-text font-medium"
                    >
                      Category
                    </label>
                    <select
                      id="admin-field-2"
                      value={productForm.category}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          category: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-admin-surface border border-admin-border rounded-xl text-admin-text font-medium cursor-pointer"
                    >
                      {CATEGORIES.filter((c) => c !== "All Categories").map(
                        (c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="admin-field-3"
                      className="text-admin-text font-medium"
                    >
                      Brand Name
                    </label>
                    <input
                      id="admin-field-3"
                      type="text"
                      required
                      value={productForm.brand}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          brand: e.target.value,
                        })
                      }
                      placeholder="e.g. Noise, Apple, Samsung, TECH AI"
                      className="w-full px-3 py-2 bg-admin-surface border border-admin-border rounded-xl text-admin-text"
                    />
                  </div>
                </div>
              </FormSection>
              <FormSection title="Pricing and inventory">
                <div className="grid grid-cols-3 gap-3 bg-admin-surface p-3.5 rounded-xl border border-admin-border">
                  <div className="space-y-1">
                    <label
                      htmlFor="admin-field-4"
                      className="text-admin-text font-medium"
                    >
                      Selling Price (₹)
                    </label>
                    <input
                      id="admin-field-4"
                      type="number"
                      required
                      min={1}
                      value={productForm.price}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          price: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-1.5 bg-admin-surface border border-admin-border rounded-xl text-admin-success font-medium text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="admin-field-5"
                      className="text-admin-text font-medium"
                    >
                      MRP Price (₹)
                    </label>
                    <input
                      id="admin-field-5"
                      type="number"
                      required
                      min={1}
                      value={productForm.originalPrice}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          originalPrice: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-1.5 bg-admin-surface border border-admin-border rounded-xl text-admin-text font-medium text-sm"
                    />
                    <span className="text-[10px] text-admin-success font-medium block">
                      Calculated: {discountPercentCalculated}% OFF
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="admin-field-6"
                      className="text-admin-text font-medium"
                    >
                      Inventory Stock
                    </label>
                    <input
                      id="admin-field-6"
                      type="number"
                      required
                      min={0}
                      value={productForm.stock}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          stock: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-1.5 bg-admin-surface border border-admin-border rounded-xl text-admin-info font-medium text-sm"
                    />
                  </div>
                </div>
              </FormSection>
              <FormSection title="Product images">
                <div className="bg-admin-surface p-4 rounded-xl border border-admin-border space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-admin-text font-medium flex items-center space-x-1.5">
                      <ImageIcon className="w-4 h-4 text-admin-info" />
                      <span>
                        Product Images (Max 7 Images from Computer or URL)
                      </span>
                    </label>
                    <span className="text-[11px] font-medium text-admin-info">
                      {productForm.images.length} / 7 Images
                    </span>
                  </div>

                  {/* Upload Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="px-3.5 py-2 bg-admin-primary hover:bg-admin-primary-hover text-admin-on-primary rounded-xl font-medium text-xs flex items-center space-x-2 cursor-pointer transition shadow-sm">
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
                            const val = (
                              e.target as HTMLInputElement
                            ).value.trim();
                            if (val && productForm.images.length < 7) {
                              setProductForm((prev) => ({
                                ...prev,
                                images: [...prev.images, val],
                                image:
                                  prev.images.length === 0 ? val : prev.image,
                                originalImage:
                                  prev.images.length === 0
                                    ? val
                                    : prev.originalImage,
                                normalizedImage:
                                  prev.images.length === 0
                                    ? ""
                                    : prev.normalizedImage,
                              }));
                              (e.target as HTMLInputElement).value = "";
                            }
                          }
                        }}
                        className="flex-1 px-3 py-1.5 bg-admin-surface border border-admin-border rounded-xl text-xs text-admin-text"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-admin-text">
                    <input
                      type="checkbox"
                      checked={imagesReviewed}
                      onChange={(e) => setImagesReviewed(e.target.checked)}
                      required
                    />
                    I checked that every image shows this product’s brand and
                    model.
                  </label>

                  {/* Thumbnail Strip Preview of up to 7 images */}
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5 pt-1">
                    {productForm.images.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="relative group aspect-square rounded-xl bg-admin-surface border border-admin-border p-1 overflow-hidden flex items-center justify-center shadow-sm"
                      >
                        <AdminImage
                          src={imgUrl}
                          alt=""
                          className="max-h-full max-w-full object-contain"
                        />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-admin-primary text-admin-on-primary text-[9px] font-medium px-1.5 py-0.2 rounded shadow">
                            PRIMARY
                          </span>
                        )}
                        <div className="absolute inset-0 bg-admin-surface opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(idx)}
                              className="text-[9px] px-1 py-0.5 bg-admin-primary hover:bg-admin-primary text-admin-on-primary rounded font-medium"
                            >
                              Set Main
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="p-1 text-admin-danger hover:text-admin-danger bg-admin-surface rounded-full"
                            title="Remove Image"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Normalized catalog image preview and optional controls */}
                  <div className="border-t border-admin-border pt-3 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-admin-text font-medium">
                          Catalog Image Preview
                        </p>
                        <p className="text-[10px] text-admin-muted">
                          Originals stay untouched; cards use the normalized
                          square asset when available.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleNormalizeFormImage}
                          disabled={isNormalizingImage}
                          className="px-3 py-1.5 bg-admin-primary hover:bg-admin-primary disabled:opacity-50 text-admin-on-primary rounded-lg text-[11px] font-medium inline-flex items-center gap-1.5"
                        >
                          <RefreshCw
                            className={`w-3.5 h-3.5 ${isNormalizingImage ? "animate-spin" : ""}`}
                          />
                          {isNormalizingImage
                            ? "Normalizing..."
                            : "Normalize Image"}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setProductForm((prev) => ({
                              ...prev,
                              normalizedImage: "",
                            }))
                          }
                          disabled={!productForm.normalizedImage}
                          className="px-3 py-1.5 bg-admin-subtle hover:bg-admin-subtle disabled:opacity-50 text-admin-text rounded-lg text-[11px] font-medium"
                        >
                          Use Original
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 max-w-md">
                      <div className="space-y-1">
                        <span className="text-[10px]  text-admin-muted font-medium">
                          Original Preview
                        </span>
                        <div className="aspect-square rounded-xl bg-admin-surface border border-admin-border p-2 flex items-center justify-center overflow-hidden">
                          <AdminImage
                            src={productForm.originalImage || productForm.image}
                            alt="Original product preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px]  text-admin-info font-medium">
                          Normalized Preview
                        </span>
                        <div className="aspect-square rounded-xl bg-admin-surface border border-admin-border p-2 flex items-center justify-center overflow-hidden">
                          {productForm.normalizedImage ? (
                            <AdminImage
                              src={productForm.normalizedImage}
                              alt="Normalized product preview"
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span className="text-[10px] text-admin-muted text-center">
                              Click Normalize Image to generate the catalog
                              asset
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-w-2xl">
                      <label className="space-y-1 text-[10px] text-admin-muted font-medium">
                        Image Fit
                        <select
                          value={productForm.imageFit}
                          onChange={(e) =>
                            setProductForm((prev) => ({
                              ...prev,
                              imageFit: e.target.value as typeof prev.imageFit,
                              normalizedImage: "",
                            }))
                          }
                          className="w-full px-2.5 py-1.5 bg-admin-surface border border-admin-border rounded-lg text-xs text-admin-text"
                        >
                          <option value="auto">Auto</option>
                          <option value="standard">Standard</option>
                          <option value="full-product">Full Product</option>
                        </select>
                      </label>
                      <label className="space-y-1 text-[10px] text-admin-muted font-medium">
                        Image Scale
                        <select
                          value={productForm.imageScale}
                          onChange={(e) =>
                            setProductForm((prev) => ({
                              ...prev,
                              imageScale: e.target
                                .value as typeof prev.imageScale,
                              normalizedImage: "",
                            }))
                          }
                          className="w-full px-2.5 py-1.5 bg-admin-surface border border-admin-border rounded-lg text-xs text-admin-text"
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </label>
                      <label className="space-y-1 text-[10px] text-admin-muted font-medium">
                        Image Position
                        <select
                          value={productForm.imagePosition}
                          onChange={(e) =>
                            setProductForm((prev) => ({
                              ...prev,
                              imagePosition: e.target
                                .value as typeof prev.imagePosition,
                              normalizedImage: "",
                            }))
                          }
                          className="w-full px-2.5 py-1.5 bg-admin-surface border border-admin-border rounded-lg text-xs text-admin-text"
                        >
                          <option value="center">Center</option>
                          <option value="top">Top</option>
                          <option value="bottom">Bottom</option>
                        </select>
                      </label>
                    </div>
                    {normalizationMessage && (
                      <p className="text-[11px] text-admin-info">
                        {normalizationMessage}
                      </p>
                    )}
                  </div>
                </div>
              </FormSection>
              <FormSection title="Promotions and other settings">
                <div className="bg-admin-subtle p-4 rounded-xl border border-admin-border space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-admin-info font-medium flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-admin-info" />
                      <span>Hero Banner & Companion Tile Content</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForm.isHeroFeatured}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            isHeroFeatured: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded text-admin-info bg-admin-surface border-admin-border cursor-pointer"
                      />
                      <span className="text-xs font-medium text-admin-text">
                        Use in hero banner or companion tile
                      </span>
                    </label>
                  </div>

                  {productForm.isHeroFeatured && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <label
                          htmlFor="admin-field-7"
                          className="text-admin-text font-medium"
                        >
                          Hero Headline Title
                        </label>
                        <input
                          id="admin-field-7"
                          type="text"
                          value={productForm.heroBannerHeadline}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              heroBannerHeadline: e.target.value,
                            })
                          }
                          placeholder="e.g. Price Dropped 20% - Limited Drop"
                          className="w-full px-3 py-1.5 bg-admin-surface border border-admin-border rounded-xl text-admin-text"
                        />
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor="admin-field-8"
                          className="text-admin-text font-medium"
                        >
                          Hero Badge Tag
                        </label>
                        <input
                          id="admin-field-8"
                          type="text"
                          value={productForm.heroBadge}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              heroBadge: e.target.value,
                            })
                          }
                          placeholder="e.g. FESTIVE SALE • 20% OFF"
                          className="w-full px-3 py-1.5 bg-admin-surface border border-admin-border rounded-xl text-admin-text"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label
                          htmlFor="admin-field-9"
                          className="text-admin-text font-medium"
                        >
                          Hero Offer Promo Text
                        </label>
                        <input
                          id="admin-field-9"
                          type="text"
                          value={productForm.heroOfferText}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              heroOfferText: e.target.value,
                            })
                          }
                          placeholder="e.g. Buy 3 Get Small Gift Free / Purchase above ₹20,000 get Free Gift"
                          className="w-full px-3 py-1.5 bg-admin-surface border border-admin-border rounded-xl text-admin-info font-medium"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </FormSection>
              <FormSection title="Descriptions and specifications">
                <div className="bg-admin-surface p-4 rounded-xl border border-admin-border space-y-3">
                  <label className="text-admin-text font-medium flex items-center space-x-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-admin-info" />
                    <span>Technical Specifications (Key-Value)</span>
                  </label>

                  {/* Existing Specs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(productForm.specs || {}).map(
                      ([key, val]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between bg-admin-surface px-3 py-1.5 rounded-xl border border-admin-border"
                        >
                          <span className="font-medium text-admin-muted truncate max-w-[120px]">
                            {key}:
                          </span>
                          <span className="text-admin-text font-semibold truncate max-w-[140px] ml-1">
                            {val}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSpec(key)}
                            className="text-admin-muted hover:text-admin-danger ml-2"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ),
                    )}
                  </div>

                  {/* Add new spec input row */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      aria-label="Spec Name (e.g. Battery, RAM, Warranty)"
                      placeholder="Spec Name (e.g. Battery, RAM, Warranty)"
                      value={newSpecKey}
                      onChange={(e) => setNewSpecKey(e.target.value)}
                      className="w-1/2 px-3 py-1.5 bg-admin-surface border border-admin-border rounded-xl text-admin-text"
                    />
                    <input
                      type="text"
                      aria-label="Value (e.g. 5000 mAh, 8GB, 1 Year)"
                      placeholder="Value (e.g. 5000 mAh, 8GB, 1 Year)"
                      value={newSpecValue}
                      onChange={(e) => setNewSpecValue(e.target.value)}
                      className="w-1/2 px-3 py-1.5 bg-admin-surface border border-admin-border rounded-xl text-admin-text"
                    />
                    <button
                      type="button"
                      onClick={handleAddSpec}
                      className="px-3 py-1.5 bg-admin-info-bg hover:bg-admin-info-bg text-admin-text font-medium rounded-xl flex-shrink-0 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="admin-field-10"
                    className="text-admin-text font-medium"
                  >
                    Product Description
                  </label>
                  <textarea
                    id="admin-field-10"
                    rows={3}
                    required
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-admin-surface border border-admin-border rounded-xl text-admin-text focus:ring-2 focus:ring-admin-primary focus:outline-none"
                  />
                </div>
              </FormSection>
            </form>
            {/* Action Buttons */}
            <div className="admin-form-footer">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2 text-admin-muted hover:text-admin-text font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="admin-product-form"
                disabled={isSavingProduct}
                className="px-6 py-2.5 bg-admin-primary hover:bg-admin-primary-hover text-admin-on-primary font-medium rounded-xl   cursor-pointer"
              >
                {isSavingProduct
                  ? "Saving product?"
                  : isEditing
                    ? "Save Product Changes"
                    : "Create Product"}
              </button>
            </div>
          </div>
        </AdminModal>
      )}

      {/* REVIEWS MANAGER MODAL */}
      {reviewModalProduct && (
        <AdminModal
          label="Customer reviews"
          onClose={() => setReviewModalProduct(null)}
        >
          <div className="bg-admin-surface border border-admin-border w-full max-w-xl rounded-xl p-6  space-y-4 my-auto max-h-[90vh] flex flex-col text-xs">
            <div className="flex items-center justify-between border-b border-admin-border pb-3">
              <h3 className="text-sm font-medium text-admin-text flex items-center space-x-2">
                <Star className="w-4 h-4 text-admin-warning" />
                <span>Manage Customer Reviews: {reviewModalProduct.title}</span>
              </h3>
              <button
                type="button"
                onClick={() => setReviewModalProduct(null)}
                aria-label="Close reviews"
                className="w-7 h-7 rounded-full bg-admin-subtle hover:bg-admin-subtle flex items-center justify-center text-admin-muted hover:text-admin-text transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of current reviews */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-60">
              {(reviewModalProduct.reviews || []).length === 0 ? (
                <p className="text-admin-muted py-4 text-center">
                  No reviews submitted yet.
                </p>
              ) : (
                (reviewModalProduct.reviews || []).map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-admin-surface p-3 rounded-xl border border-admin-border space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-admin-text">
                          {rev.userName}
                        </span>
                        <div className="flex items-center text-admin-warning">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star
                              key={i}
                              className="w-3 h-3 fill-admin-warning text-admin-warning"
                            />
                          ))}
                        </div>
                        {rev.verifiedPurchase && (
                          <span className="text-[10px] text-admin-success font-medium bg-admin-success-bg px-1.5 py-0.2 rounded border border-admin-border">
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
                          className="text-admin-info hover:underline text-[11px]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(rev.id)}
                          className="text-admin-danger hover:underline text-[11px]"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-admin-text">{rev.comment}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add / Edit Review Form */}
            <form
              onSubmit={handleSaveReview}
              className="bg-admin-surface p-3.5 rounded-xl border border-admin-border space-y-2.5"
            >
              <h4 className="font-medium text-admin-text text-xs">
                {editingReviewId ? "Edit Review" : "Add Verified Review"}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  aria-label="Customer Name"
                  placeholder="Customer Name"
                  value={newReviewForm.userName}
                  onChange={(e) =>
                    setNewReviewForm({
                      ...newReviewForm,
                      userName: e.target.value,
                    })
                  }
                  className="px-3 py-1.5 bg-admin-surface border border-admin-border rounded-xl text-admin-text"
                />
                <select
                  aria-label="Review rating"
                  value={newReviewForm.rating}
                  onChange={(e) =>
                    setNewReviewForm({
                      ...newReviewForm,
                      rating: Number(e.target.value),
                    })
                  }
                  className="px-3 py-1.5 bg-admin-surface border border-admin-border rounded-xl text-admin-warning font-medium"
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
                aria-label="Review comment content..."
                placeholder="Review comment content..."
                value={newReviewForm.comment}
                onChange={(e) =>
                  setNewReviewForm({
                    ...newReviewForm,
                    comment: e.target.value,
                  })
                }
                className="w-full px-3 py-1.5 bg-admin-surface border border-admin-border rounded-xl text-admin-text"
              />
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-1.5 text-admin-text">
                  <input
                    type="checkbox"
                    checked={newReviewForm.verifiedPurchase}
                    onChange={(e) =>
                      setNewReviewForm({
                        ...newReviewForm,
                        verifiedPurchase: e.target.checked,
                      })
                    }
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
                        setNewReviewForm({
                          userName: "",
                          rating: 5,
                          comment: "",
                          verifiedPurchase: true,
                        });
                      }}
                      className="text-admin-muted px-2"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-admin-primary hover:bg-admin-primary text-admin-on-primary font-medium rounded-xl"
                  >
                    {editingReviewId ? "Save Review" : "Add Review"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </AdminModal>
      )}

      {/* REFILL STOCK MODAL */}
      {refillModalProduct && (
        <AdminModal
          label="Refill inventory"
          onClose={() => setRefillModalProduct(null)}
        >
          <div className="bg-admin-surface border border-admin-border w-full max-w-sm rounded-xl p-6  space-y-4 text-xs">
            <h3 className="text-sm font-medium text-admin-text flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-admin-info" />
              <span>Refill Inventory Stock</span>
            </h3>

            <p className="text-admin-text">
              Refilling stock for:{" "}
              <strong className="text-admin-text">
                {refillModalProduct.title}
              </strong>
            </p>

            <div className="space-y-1">
              <label
                htmlFor="admin-field-11"
                className="text-admin-text font-medium"
              >
                Add Quantity Units
              </label>
              <input
                id="admin-field-11"
                type="number"
                min={1}
                value={refillAmount}
                onChange={(e) => setRefillAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-admin-surface border border-admin-border rounded-xl text-admin-info font-medium text-base"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRefillModalProduct(null)}
                className="px-4 py-2 text-admin-muted hover:text-admin-text"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleRefillStock(refillModalProduct.id, refillAmount)
                }
                className="px-6 py-2 bg-admin-primary hover:bg-admin-primary text-admin-on-primary font-medium rounded-xl"
              >
                Confirm Refill
              </button>
            </div>
          </div>
        </AdminModal>
      )}
    </AdminShell>
  );
}
