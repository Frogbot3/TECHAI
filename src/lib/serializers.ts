import { CartItem, Order, OrderStatus, Product, User } from "./types";

const toPlain = (value: any) => {
  if (!value) return value;
  if (typeof value.toObject === "function") return value.toObject();
  return value;
};

const dateToString = (value: any) => {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
};

const specsToObject = (specs: any): Record<string, string> => {
  if (!specs) return {};
  if (specs instanceof Map) return Object.fromEntries(specs.entries());
  if (typeof specs.toObject === "function") return specs.toObject();
  return specs;
};

export function toClientProduct(value: any): Product {
  const product = toPlain(value);
  return {
    id: product.productId || product.id || product._id?.toString() || `prod-${Date.now()}`,
    title: product.title || "Untitled product",
    brand: product.brand || "TECH AI",
    category: product.category || "Electronics",
    price: Number(product.price || 0),
    originalPrice: Number(product.originalPrice || product.price || 0),
    discountPercent: Number(product.discountPercent || 0),
    rating: Number(product.rating || 4.2),
    reviewCount: Number(product.reviewCount || 0),
    image: product.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&auto=format&fit=crop&q=80",
    stock: Number(product.stock || 0),
    isAiProduct: Boolean(product.isAiProduct),
    isTrending: Boolean(product.isTrending),
    isBestSeller: Boolean(product.isBestSeller),
    description: product.description || "Reliable everyday product with fast delivery and easy support.",
    features: Array.isArray(product.features) ? product.features : [],
    specs: specsToObject(product.specs),
    createdAt: product.createdAt ? dateToString(product.createdAt) : undefined,
    reviews: Array.isArray(product.reviews) ? product.reviews : [],
  };
}

export function normalizeCartItem(value: any): CartItem {
  if (value?.product) {
    return {
      product: toClientProduct(value.product),
      quantity: Number(value.quantity || 1),
      selectedColor: value.selectedColor || undefined,
      selectedSize: value.selectedSize || undefined,
    };
  }

  return {
    product: toClientProduct({
      productId: value.productId || value.id,
      title: value.title,
      brand: value.brand,
      category: value.category,
      price: value.price,
      originalPrice: value.originalPrice || value.price,
      image: value.image,
      stock: value.stock || 0,
    }),
    quantity: Number(value.quantity || 1),
    selectedColor: value.selectedColor || undefined,
    selectedSize: value.selectedSize || undefined,
  };
}

export function toClientOrder(value: any): Order {
  const order = toPlain(value);
  return {
    id: order.orderId || order.id || order._id?.toString() || `TECHAI-ORD-${Date.now()}`,
    customerId: order.customerId || undefined,
    items: Array.isArray(order.items) ? order.items.map(normalizeCartItem) : [],
    shippingAddress: {
      fullName: order.shippingAddress?.fullName || order.userName || "Customer",
      phone: order.shippingAddress?.phone || order.userPhone || "",
      email: order.shippingAddress?.email || order.userEmail || "",
      street: order.shippingAddress?.street || "",
      city: order.shippingAddress?.city || "",
      state: order.shippingAddress?.state || "",
      pincode: order.shippingAddress?.pincode || "",
      landmark: order.shippingAddress?.landmark || "",
    },
    totalAmount: Number(order.totalAmount || 0),
    discountAmount: Number(order.discountAmount || 0),
    shippingFee: Number(order.shippingFee || 0),
    finalAmount: Number(order.finalAmount || 0),
    paymentMethod: order.paymentMethod || "COD",
    paymentStatus: order.paymentStatus || "Pending",
    paymentDetails: order.paymentDetails || {},
    status: order.status || "Placed",
    trackingNumber: order.trackingNumber || "",
    courierName: order.courierName || "Tech AI Logistics",
    estimatedDelivery: order.estimatedDelivery || "3-5 business days",
    createdAt: dateToString(order.createdAt),
    updatedAt: dateToString(order.updatedAt),
    statusHistory: Array.isArray(order.statusHistory)
      ? order.statusHistory.map((entry: any) => ({
          status: (entry.status || "Placed") as OrderStatus,
          timestamp: dateToString(entry.timestamp),
          note: entry.note || "Order status updated",
        }))
      : [],
  };
}

export function toClientUser(value: any): User {
  const user = toPlain(value);
  const phone = user.phone?.startsWith("google:") ? "" : user.phone || "";
  return {
    id: user._id?.toString() || user.id || "",
    name: user.name || (user.email ? user.email.split("@")[0] : "Customer"),
    phone,
    email: user.email || "",
    avatar: user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name || user.email || phone || "TA")}`,
    addresses: user.addresses || [],
    role: user.role || "customer",
    isLoggedIn: true,
  };
}
