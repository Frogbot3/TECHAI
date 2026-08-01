"use client";

import { useState, useEffect } from "react";
import { Product, CartItem, Order, User, OrderStatus } from "./types";
import { INITIAL_PRODUCTS } from "./data";

const PRODUCTS_KEY = "techai_products_v1";
const CART_KEY = "techai_cart_v1";
const ORDERS_KEY = "techai_orders_v1";
const USER_KEY = "techai_user_v1";
const WISHLIST_KEY = "techai_wishlist_v1";

const getStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error("Error reading localStorage:", e);
    return defaultValue;
  }
};

const setStorage = <T>(key: string, value: T) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Error writing to localStorage:", e);
  }
};

export function useTechAiStore() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadedProducts = getStorage<Product[]>(PRODUCTS_KEY, INITIAL_PRODUCTS);
    const loadedCart = getStorage<CartItem[]>(CART_KEY, []);
    const loadedOrders = getStorage<Order[]>(ORDERS_KEY, [
      {
        id: "TECHAI-ORD-98412",
        items: [
          { product: loadedProducts[0] || INITIAL_PRODUCTS[0], quantity: 1 },
          { product: loadedProducts[4] || INITIAL_PRODUCTS[4], quantity: 1 },
        ],
        shippingAddress: {
          fullName: "Alex Rivera",
          phone: "+91 9876543210",
          email: "alex@techai.com",
          street: "Tech Park Avenue, House #402",
          city: "Bengaluru",
          state: "Karnataka",
          pincode: "560100",
          landmark: "Near Silicon Gate",
        },
        totalAmount: 35398,
        discountAmount: 1000,
        shippingFee: 0,
        finalAmount: 34398,
        paymentMethod: "UPI",
        paymentStatus: "Paid",
        status: "Out for Delivery",
        trackingNumber: "TEX-882194",
        courierName: "TechAI Express",
        estimatedDelivery: "Today by 6:00 PM",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        statusHistory: [
          { status: "Placed", timestamp: "Yesterday, 10:15 AM", note: "Order placed successfully" },
          { status: "Processing", timestamp: "Yesterday, 02:30 PM", note: "Packed at TechAI Hub" },
          { status: "Shipped", timestamp: "Today, 07:00 AM", note: "Handed to courier partner" },
          { status: "Out for Delivery", timestamp: "Today, 11:30 AM", note: "Delivery Executive assigned: Rahul S." },
        ],
      },
    ]);
    const loadedWishlist = getStorage<string[]>(WISHLIST_KEY, []);
    const loadedUser = getStorage<User | null>(USER_KEY, null);

    setProducts(loadedProducts);
    setCart(loadedCart);
    setOrders(loadedOrders);
    setWishlist(loadedWishlist);
    setUser(loadedUser);
    setIsLoaded(true);

    // Sync products & orders with database backend asynchronously
    fetch("/api/products")
      ? fetch("/api/products")
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.products) {
              setProducts(data.products);
              setStorage(PRODUCTS_KEY, data.products);
            }
          })
          .catch(() => {})
      : null;
  }, []);

  const updateProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    setStorage(PRODUCTS_KEY, newProducts);
  };

  const addProduct = async (productData: Omit<Product, "id">) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newProduct, ...products];
    updateProducts(updated);

    // Async DB update
    try {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });
    } catch (e) {
      console.warn("DB Post Fallback");
    }

    return newProduct;
  };

  const editProduct = (id: string, updatedFields: Partial<Product>) => {
    const updated = products.map((p) => (p.id === id ? { ...p, ...updatedFields } : p));
    updateProducts(updated);
  };

  const refillStock = async (id: string, addQuantity: number) => {
    const updated = products.map((p) => {
      if (p.id === id) {
        return { ...p, stock: Math.max(0, p.stock + addQuantity) };
      }
      return p;
    });
    updateProducts(updated);

    // Async DB Stock Refill
    try {
      await fetch(`/api/products/${id}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: addQuantity }),
      });
    } catch (e) {
      console.warn("DB Stock Refill Fallback");
    }
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    updateProducts(updated);
  };

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    setStorage(CART_KEY, newCart);
  };

  const addToCart = (product: Product, quantity = 1) => {
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    let updatedCart: CartItem[];
    if (existingIndex > -1) {
      updatedCart = cart.map((item, idx) =>
        idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
      );
    } else {
      updatedCart = [...cart, { product, quantity }];
    }
    updateCart(updatedCart);
  };

  const removeFromCart = (productId: string) => {
    const updated = cart.filter((item) => item.product.id !== productId);
    updateCart(updated);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const updated = cart.map((item) =>
      item.product.id === productId ? { ...item, quantity } : item
    );
    updateCart(updated);
  };

  const clearCart = () => {
    updateCart([]);
  };

  const loginUser = (name: string, phone: string, email?: string) => {
    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      phone,
      email: email || `${phone}@customer.techai.com`,
      isLoggedIn: true,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${phone}`,
    };
    setUser(newUser);
    setStorage(USER_KEY, newUser);
    return newUser;
  };

  const logoutUser = () => {
    setUser(null);
    setStorage(USER_KEY, null);
  };

  const createOrder = async (
    shippingAddress: User["addresses"] extends (infer U)[] | undefined ? U : any,
    paymentMethod: Order["paymentMethod"],
    discountCode?: string
  ): Promise<Order> => {
    const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const discountAmount = discountCode === "TECHAI10" ? Math.round(totalAmount * 0.1) : 0;
    const shippingFee = totalAmount > 499 ? 0 : 49;
    const finalAmount = totalAmount - discountAmount + shippingFee;

    const orderId = `TECHAI-ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    const newOrder: Order = {
      id: orderId,
      items: [...cart],
      shippingAddress,
      totalAmount,
      discountAmount,
      shippingFee,
      finalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Paid",
      status: "Placed",
      trackingNumber: `TEX-${Math.floor(100000 + Math.random() * 900000)}`,
      courierName: "TechAI Express",
      estimatedDelivery: "3-5 Business Days",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          status: "Placed",
          timestamp: new Date().toLocaleString(),
          note: "Order confirmed and being verified by TechAI hub",
        },
      ],
    };

    const updatedProducts = products.map((p) => {
      const orderedItem = cart.find((ci) => ci.product.id === p.id);
      if (orderedItem) {
        return { ...p, stock: Math.max(0, p.stock - orderedItem.quantity) };
      }
      return p;
    });
    updateProducts(updatedProducts);

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    setStorage(ORDERS_KEY, updatedOrders);
    clearCart();

    // Async Post to Database API
    try {
      await fetch("/api/orders", {
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
        }),
      });
    } catch (e) {
      console.warn("DB Create Order Fallback");
    }

    return newOrder;
  };

  const updateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    note?: string,
    courierName?: string,
    trackingNumber?: string
  ) => {
    const updated = orders.map((ord) => {
      if (ord.id === orderId) {
        const history = [
          ...ord.statusHistory,
          {
            status: newStatus,
            timestamp: new Date().toLocaleString(),
            note: note || `Order status updated to ${newStatus}`,
          },
        ];
        return {
          ...ord,
          status: newStatus,
          courierName: courierName || ord.courierName,
          trackingNumber: trackingNumber || ord.trackingNumber,
          updatedAt: new Date().toISOString(),
          statusHistory: history,
        };
      }
      return ord;
    });
    setOrders(updated);
    setStorage(ORDERS_KEY, updated);

    // Async Update Order in Database API
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          note,
          courierName,
          trackingNumber,
        }),
      });
    } catch (e) {
      console.warn("DB Order Status Update Fallback");
    }
  };

  const toggleWishlist = (productId: string) => {
    let updated: string[];
    if (wishlist.includes(productId)) {
      updated = wishlist.filter((id) => id !== productId);
    } else {
      updated = [...wishlist, productId];
    }
    setWishlist(updated);
    setStorage(WISHLIST_KEY, updated);
  };

  return {
    isLoaded,
    products,
    cart,
    orders,
    wishlist,
    user,
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
    logoutUser,
    createOrder,
    toggleWishlist,
  };
}
