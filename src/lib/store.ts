"use client";

import { useEffect, useState } from "react";
import { CartItem, Order, OrderStatus, PaymentDetails, PaymentMethod, Product, ShippingAddress, User } from "./types";
import { INITIAL_PRODUCTS } from "./data";
import { normalizeCartItem, toClientOrder, toClientProduct } from "./serializers";

const PRODUCTS_KEY = "techai_products_v2";
const CART_KEY = "techai_cart_v2";
const ORDERS_KEY = "techai_orders_v2";
const USER_KEY = "techai_user_v2";
const WISHLIST_KEY = "techai_wishlist_v2";

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

export function useTechAiStore() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
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
    setStorage(ORDERS_KEY, newOrders);
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

  const refreshOrders = async (query?: string, userCreds?: { id?: string; email?: string; phone?: string }) => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);

    const currentUser = userCreds || user;
    if (currentUser?.id) params.set("customerId", currentUser.id);
    if (currentUser?.email) params.set("email", currentUser.email);
    if (currentUser?.phone) params.set("phone", currentUser.phone);

    const url = params.toString() ? `/api/orders?${params.toString()}` : "/api/orders";
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.success && data.orders) {
        const normalized = data.orders.map(toClientOrder);
        updateOrders(normalized);
        return normalized;
      }
    } catch (err) {
      console.error("Refresh orders error:", err);
    }
    return orders;
  };

  const refreshSession = async () => {
    try {
      const response = await fetch("/api/auth/session");
      const data = await response.json();
      if (data.success && data.user) {
        const loggedUser = setAuthenticatedUser(data.user);
        refreshOrders("", { id: loggedUser.id, email: loggedUser.email, phone: loggedUser.phone });
        return loggedUser;
      }
    } catch {
      // Session offline
    }
    return null;
  };

  useEffect(() => {
    const loadedProducts = getStorage<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS).map(toClientProduct);
    const loadedCart = getStorage<CartItem[]>(CART_KEY, []).map(normalizeCartItem);
    const loadedOrders = getStorage<Order[]>(ORDERS_KEY, []).map(toClientOrder);
    const loadedWishlist = getStorage<string[]>(WISHLIST_KEY, []);
    const loadedUser = getStorage<User | null>(USER_KEY, null);

    setProducts(loadedProducts);
    setCart(loadedCart);
    setOrders(loadedOrders);
    setWishlist(loadedWishlist);
    setUser(loadedUser);
    setIsLoaded(true);

    refreshProducts().catch(() => {});
    if (loadedUser) {
      refreshOrders("", { id: loadedUser.id, email: loadedUser.email, phone: loadedUser.phone });
    } else {
      refreshOrders().catch(() => {});
    }
    refreshSession().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    refreshOrders("", { id: cleanUser.id, email: cleanUser.email, phone: cleanUser.phone });
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
    setStorage(ORDERS_KEY, []);
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  };

  const createOrder = async (
    shippingAddress: ShippingAddress,
    paymentMethod: PaymentMethod,
    discountCode?: string,
    paymentDetails?: PaymentDetails
  ): Promise<Order> => {
    const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const discountAmount = discountCode === "TECHAI10" ? Math.round(totalAmount * 0.1) : 0;
    const shippingFee = totalAmount > 499 ? 0 : 49;
    const finalAmount = totalAmount - discountAmount + shippingFee;

    const fallbackOrder: Order = {
      id: `TECHAI-ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      customerId: user?.id,
      items: [...cart],
      shippingAddress,
      totalAmount,
      discountAmount,
      shippingFee,
      finalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid",
      paymentDetails,
      status: "Placed",
      trackingNumber: `TA-${Math.floor(10000000 + Math.random() * 90000000)}`,
      courierName: "Tech AI Logistics",
      estimatedDelivery: "3-5 business days",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          status: "Placed",
          timestamp: new Date().toISOString(),
          note: "Order was placed and is awaiting confirmation.",
        },
      ],
    };

    const updatedProducts = products.map((p) => {
      const orderedItem = cart.find((ci) => ci.product.id === p.id);
      return orderedItem ? { ...p, stock: Math.max(0, p.stock - orderedItem.quantity) } : p;
    });
    updateProducts(updatedProducts);

    let savedOrder = fallbackOrder;
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          shippingAddress,
          totalAmount,
          discountAmount,
          shippingFee,
          finalAmount,
          paymentMethod,
          paymentDetails,
        }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Order creation failed");
      if (data.order) savedOrder = toClientOrder(data.order);
    } catch (err) {
      console.error("Order creation error:", err);
    }

    const updatedOrders = [savedOrder, ...orders];
    updateOrders(updatedOrders);
    clearCart();
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
    const updated = wishlist.includes(productId)
      ? wishlist.filter((id) => id !== productId)
      : [...wishlist, productId];
    setWishlist(updated);
    setStorage(WISHLIST_KEY, updated);
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
    cart,
    orders,
    wishlist,
    user,
    refreshProducts,
    refreshOrders,
    refreshSession,
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
    addReviewToProduct,
  };
}
