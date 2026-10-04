"use client";

import { useEffect, useState } from "react";
import { CartItem, HeroCampaign, Order, OrderStatus, PaymentDetails, PaymentMethod, Product, ShippingAddress, User } from "./types";
import { INITIAL_PRODUCTS } from "./data";
import { normalizeCartItem, toClientOrder, toClientProduct } from "./serializers";

const PRODUCTS_KEY = "techai_products_v4";
const CART_KEY = "techai_cart_v2";
const LEGACY_ORDERS_KEY = "techai_orders_v2";
const USER_KEY = "techai_user_v2";
const WISHLIST_KEY = "techai_wishlist_v2";

// Orders are private account data. A separate cache per authenticated user
// prevents a previous browser user from briefly seeing another user's history.
const ordersKeyFor = (customerId?: string) => customerId ? `techai_orders_v3:${customerId}` : null;

const getStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setStorage = <T,>(key: string, value: T) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local cache is optional.
  }
};

const normalizeWishlist = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string"))];
};

export function useTechAiStore() {
  const [products, setProducts] = useState<Product[]>([]);
  const [heroCampaigns, setHeroCampaigns] = useState<HeroCampaign[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ordersPage, setOrdersPage] = useState(1);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const updateProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    setStorage(PRODUCTS_KEY, newProducts);
  };

  const updateOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
    const orderKey = ordersKeyFor(user?.id);
    if (orderKey) setStorage(orderKey, newOrders);
  };

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    setStorage(CART_KEY, newCart);
  };

  const refreshProducts = async () => {
    const response = await fetch("/api/products");
    const data = await response.json();
    if (data.success && data.products) {
      const normalized = data.products.map(toClientProduct);
      updateProducts(normalized);
      return normalized;
    }
    throw new Error(data.message || "Unable to load products");
  };

  const refreshHeroCampaigns = async () => {
    try {
      const response = await fetch("/api/hero-campaigns", { cache: "no-store" });
      const data = await response.json();
      if (data.success && Array.isArray(data.campaigns)) {
        setHeroCampaigns(data.campaigns);
        return data.campaigns as HeroCampaign[];
      }
    } catch {
      // The hero falls back to legacy product promotions when campaigns are unavailable.
    }
    return heroCampaigns;
  };

  const refreshOrders = async (customerId?: string, page = 1) => {
    const activeCustomerId = customerId || user?.id;
    if (!activeCustomerId) {
      setOrders([]);
      return [];
    }
    try {
      setOrdersLoading(true);
      setOrdersError("");
      const response = await fetch(`/api/orders?page=${page}&limit=50`, { cache: "no-store" });
      const data = await response.json();
      if (data.success && Array.isArray(data.orders)) {
        const incoming = data.orders.map(toClientOrder) as Order[];
        const normalized = page === 1 ? incoming : [...orders, ...incoming.filter(item => !orders.some(existing => existing.id === item.id))];
        setOrdersPage(page);
        setHasMoreOrders(Boolean(data.hasMore));
        setOrders(normalized);
        setStorage(ordersKeyFor(activeCustomerId)!, normalized);
        return normalized;
      }
      setOrdersError(data.message || "Unable to load orders.");
    } catch (err) {
      console.error("Refresh orders error:", err);
      setOrdersError("Unable to load orders. Please retry.");
    } finally {
      setOrdersLoading(false);
    }
    return orders;
  };

  const refreshSession = async () => {
    try {
      const response = await fetch("/api/auth/session");
      const data = await response.json();
      if (data.success && data.user) {
        const loggedUser = setAuthenticatedUser(data.user);
        refreshOrders(loggedUser.id);
        refreshWishlist().catch(() => {});
        return loggedUser;
      }
    } catch {
      // Session offline
    }
    return null;
  };

  useEffect(() => {
    const storedProducts = getStorage<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS).map(toClientProduct);
    const storedIds = new Set(storedProducts.map((p) => p.id));
    const missingInitial = INITIAL_PRODUCTS.filter((p) => !storedIds.has(p.id)).map(toClientProduct);
    const loadedProducts = [...storedProducts, ...missingInitial];
    if (missingInitial.length > 0) {
      setStorage(PRODUCTS_KEY, loadedProducts);
    }

    const loadedCart = getStorage<CartItem[]>(CART_KEY, []).map(normalizeCartItem);
    const loadedWishlist = normalizeWishlist(getStorage<unknown>(WISHLIST_KEY, []));
    const loadedUser = getStorage<User | null>(USER_KEY, null);
    const rawOrders = loadedUser ? getStorage<Order[]>(ordersKeyFor(loadedUser.id)!, []).map(toClientOrder) : [];

    // Do not migrate the old shared browser cache: it may include a different account.
    if (typeof window !== "undefined") localStorage.removeItem(LEGACY_ORDERS_KEY);
    const loadedOrders = loadedUser ? rawOrders.filter((order) => order.customerId === loadedUser.id) : [];

    setProducts(loadedProducts);
    setCart(loadedCart);
    setOrders(loadedOrders);
    setWishlist(loadedWishlist);
    setUser(loadedUser);
    setIsLoaded(true);

    refreshProducts().catch(() => {});
    refreshHeroCampaigns().catch(() => {});
    if (loadedUser) {
      refreshOrders(loadedUser.id);
      refreshWishlist().catch(() => {});
    }
    refreshSession().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshWishlist = async () => {
    try {
      const response = await fetch("/api/wishlist");
      const data = await response.json();
      if (data.success && Array.isArray(data.wishlist)) {
        setWishlist((current) => {
          const merged = [...new Set([...current, ...data.wishlist])];
          setStorage(WISHLIST_KEY, merged);
          return merged;
        });
        return data.wishlist;
      }
    } catch {
      // Local fallback
    }
    return wishlist;
  };

  const addProduct = async (productData: Omit<Product, "id">) => {
    const optimisticProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    updateProducts([optimisticProduct, ...products]);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(optimisticProduct),
      });
      const data = await response.json();
      if (data.success && data.product) {
        const saved = toClientProduct(data.product);
        updateProducts([saved, ...products]);
        return saved;
      }
    } catch {
      // Keep optimistic local product if Mongo is unavailable.
    }

    return optimisticProduct;
  };

  const editProduct = async (id: string, updatedFields: Partial<Product>) => {
    const updated = products.map((p) => (p.id === id ? { ...p, ...updatedFields } : p));
    updateProducts(updated);

    try {
      await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
    } catch {
      // Local cache already reflects the change.
    }
  };

  const refillStock = async (id: string, addQuantity: number) => {
    const updated = products.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + addQuantity) } : p));
    updateProducts(updated);

    try {
      const response = await fetch(`/api/products/${id}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: addQuantity }),
      });
      const data = await response.json();
      if (data.success && data.product) {
        updateProducts(products.map((p) => (p.id === id ? toClientProduct(data.product) : p)));
      }
    } catch {
      // Local cache already reflects the change.
    }
  };

  const deleteProduct = async (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    updateProducts(updated);

    try {
      await fetch(`/api/products/${id}`, { method: "DELETE" });
    } catch {
      // Local cache already reflects the change.
    }
  };

  const addToCart = (product: Product, quantity = 1) => {
    if (product.stock <= 0) return;
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    let updatedCart: CartItem[];
    if (existingIndex > -1) {
      updatedCart = cart.map((item, idx) =>
        idx === existingIndex
          ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
          : item
      );
    } else {
      updatedCart = [...cart, { product, quantity: Math.min(quantity, product.stock) }];
    }
    updateCart(updatedCart);
  };

  const removeFromCart = (productId: string) => {
    updateCart(cart.filter((item) => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const updated = cart.map((item) =>
      item.product.id === productId ? { ...item, quantity: Math.min(quantity, item.product.stock) } : item
    );
    updateCart(updated);
  };

  const clearCart = () => updateCart([]);

  const setAuthenticatedUser = (authenticatedUser: User) => {
    const cleanUser = { ...authenticatedUser, isLoggedIn: true };
    setUser(cleanUser);
    setStorage(USER_KEY, cleanUser);
    refreshOrders(cleanUser.id);
    return cleanUser;
  };

  const loginUser = (name: string, phone: string, email: string) => {
    return setAuthenticatedUser({
      id: `usr-${Date.now()}`,
      name,
      phone,
      email,
      isLoggedIn: true,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || phone || email)}`,
    });
  };

  const logoutUser = () => {
    setUser(null);
    setStorage(USER_KEY, null);
    setOrders([]);
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  };

  const createOrder = async (
    shippingAddress: ShippingAddress,
    paymentMethod: PaymentMethod,
    discountCode?: string,
    paymentDetails?: PaymentDetails,
    checkoutId?: string,
    deliveryType: "standard" | "express" = "standard"
  ): Promise<Order> => {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart,
        shippingAddress,
        paymentMethod,
        discountCode,
        deliveryType,
        checkoutId,
        paymentDetails,
      }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success || !data.order) {
      throw new Error(data?.message || "Order creation failed. Please try again.");
    }

    const savedOrder = toClientOrder(data.order);
    // Reflect the just-saved delivery address without waiting for a new login.
    if (user) setAuthenticatedUser({ ...user, addresses: [...(user.addresses || []), savedOrder.shippingAddress] });
    const updatedOrders = [savedOrder, ...orders.filter((order) => order.id !== savedOrder.id)];
    updateOrders(updatedOrders);

    // Online orders keep the cart until the server verifies Razorpay success.
    if (paymentMethod === "COD") clearCart();
    return savedOrder;
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    note?: string,
    courierName?: string,
    trackingNumber?: string,
    paymentStatus?: Order["paymentStatus"]
  ) => {
    const updated = orders.map((ord) => {
      if (ord.id === orderId) {
        return {
          ...ord,
          status: newStatus,
          paymentStatus: paymentStatus || ord.paymentStatus,
          courierName: courierName || ord.courierName,
          trackingNumber: trackingNumber || ord.trackingNumber,
          updatedAt: new Date().toISOString(),
          statusHistory: [
            ...ord.statusHistory,
            {
              status: newStatus,
              timestamp: new Date().toISOString(),
              note: note || `Order status updated to ${newStatus}.`,
            },
          ],
        };
      }
      return ord;
    });
    updateOrders(updated);

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note, courierName, trackingNumber, paymentStatus }),
      });
      const data = await response.json();
      if (data.success && data.order) {
        updateOrders(orders.map((ord) => (ord.id === orderId ? toClientOrder(data.order) : ord)));
      }
    } catch {
      // Local cache already reflects the change.
    }
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((currentWishlist) => {
      const updated = currentWishlist.includes(productId)
        ? currentWishlist.filter((id) => id !== productId)
        : [...new Set([...currentWishlist, productId])];

      setStorage(WISHLIST_KEY, updated);
      return updated;
    });

    if (user?.isLoggedIn) {
      fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, action: "toggle" }),
      }).catch(() => {});
    }
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist((currentWishlist) => {
      const updated = currentWishlist.filter((id) => id !== productId);
      setStorage(WISHLIST_KEY, updated);
      return updated;
    });

    if (user?.isLoggedIn) {
      fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, action: "remove" }),
      }).catch(() => {});
    }
  };

  const clearWishlist = () => {
    setWishlist([]);
    setStorage(WISHLIST_KEY, []);

    if (user?.isLoggedIn) {
      fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).catch(() => {});
    }
  };

  const addReviewToProduct = (productId: string, reviewData: { userName: string; rating: number; comment: string }) => {
    const updatedProducts = products.map((prod) => {
      if (prod.id === productId) {
        const existingReviews = prod.reviews || [];
        const newReview = {
          id: `rev-${Date.now()}`,
          productId,
          userName: reviewData.userName || "Verified Buyer",
          rating: Number(reviewData.rating),
          comment: reviewData.comment,
          date: new Date().toISOString().split("T")[0],
          verifiedPurchase: true,
        };
        const newReviews = [newReview, ...existingReviews];
        const newReviewCount = prod.reviewCount + 1;
        const totalStars = existingReviews.reduce((sum, r) => sum + r.rating, prod.rating * prod.reviewCount) + reviewData.rating;
        const newRating = Number((totalStars / newReviewCount).toFixed(1));

        return {
          ...prod,
          reviews: newReviews,
          reviewCount: newReviewCount,
          rating: Math.min(5, Math.max(1, newRating)),
        };
      }
      return prod;
    });
    updateProducts(updatedProducts);
  };

  return {
    isLoaded,
    products,
    heroCampaigns,
    cart,
    orders,
    wishlist,
    user,
    refreshProducts,
    refreshHeroCampaigns,
    refreshOrders,
    hasMoreOrders,
    ordersLoading,
    ordersError,
    loadMoreOrders: () => refreshOrders(undefined, ordersPage + 1),
    refreshSession,
    refreshWishlist,
    addProduct,
    editProduct,
    refillStock,
    deleteProduct,
    updateOrderStatus,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    loginUser,
    setAuthenticatedUser,
    logoutUser,
    createOrder,
    toggleWishlist,
    removeFromWishlist,
    clearWishlist,
    addReviewToProduct,
  };
}
