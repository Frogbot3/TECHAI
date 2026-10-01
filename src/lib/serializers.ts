import { CartItem, HeroCampaign, Order, OrderStatus, Product, Refund, User } from "./types";

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
    image: product.image || (Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&auto=format&fit=crop&q=80"),
    images: Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&auto=format&fit=crop&q=80"],
    originalImage: product.originalImage || product.image || "",
    normalizedImage: product.normalizedImage || "",
    imageFit: product.imageFit || "auto",
    imageScale: product.imageScale || "medium",
    imagePosition: product.imagePosition || "center",
    stock: Number(product.stock || 0),
    isAiProduct: Boolean(product.isAiProduct),
    isTrending: Boolean(product.isTrending),
    isBestSeller: Boolean(product.isBestSeller),
    isHeroFeatured: Boolean(product.isHeroFeatured),
    heroBannerHeadline: product.heroBannerHeadline || "",
    heroBannerSubtitle: product.heroBannerSubtitle || "",
    heroBadge: product.heroBadge || "",
    heroOfferText: product.heroOfferText || "",
    description: product.description || "Reliable everyday product with fast delivery and easy support.",
    features: Array.isArray(product.features) ? product.features : [],
    specs: specsToObject(product.specs),
    createdAt: product.createdAt ? dateToString(product.createdAt) : undefined,
    reviews: Array.isArray(product.reviews)
      ? product.reviews.map((r: any) => ({
          id: r.reviewId || r.id || `rev-${Date.now()}`,
          productId: product.productId || product.id || "",
          userName: r.userName || "Customer",
          rating: Number(r.rating || 5),
          comment: r.comment || "",
          date: r.date || "",
          verifiedPurchase: Boolean(r.verifiedPurchase),
        }))
      : [],
  };
}

export function toClientHeroCampaign(value: any, product?: Product): HeroCampaign {
  const campaign = toPlain(value);
  return {
    id: campaign.campaignId || campaign.id || campaign._id?.toString() || `campaign-${Date.now()}`,
    name: campaign.name || "Untitled campaign",
    badge: campaign.badge || "SPECIAL DROP",
    productId: campaign.productId || product?.id || "",
    product,
    titleOverride: campaign.titleOverride || "",
    subtitle: campaign.subtitle || product?.description || "",
    price: Number(campaign.price ?? product?.price ?? 0),
    originalPrice: Number(campaign.originalPrice ?? product?.originalPrice ?? campaign.price ?? 0),
    discountPercent: Number(campaign.discountPercent ?? 0),
    offerText: campaign.offerText || "",
    ctaText: campaign.ctaText || "Shop Now",
    imageOverride: campaign.imageOverride || "",
    backgroundStyle: campaign.backgroundStyle === "gradient" ? "gradient" : "solid",
    backgroundValue: campaign.backgroundValue || "#5b2f87",
    verified: Boolean(campaign.verified),
    priority: Number(campaign.priority || 0),
    displayOrder: Number(campaign.displayOrder || 0),
    startAt: dateToString(campaign.startAt),
    endAt: dateToString(campaign.endAt),
    isActive: Boolean(campaign.isActive),
    impressions: Number(campaign.impressions || 0),
    clicks: Number(campaign.clicks || 0),
    productClicks: Number(campaign.productClicks || 0),
    createdAt: campaign.createdAt ? dateToString(campaign.createdAt) : undefined,
    updatedAt: campaign.updatedAt ? dateToString(campaign.updatedAt) : undefined,
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
      originalImage: value.originalImage || value.image || "",
      normalizedImage: value.normalizedImage || "",
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
    checkoutId: order.checkoutId || undefined,
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
    razorpayOrderId: order.razorpayOrderId || undefined,
    razorpayPaymentId: order.razorpayPaymentId || undefined,
    razorpaySignature: order.razorpaySignature || undefined,
    refundStatus: order.refundStatus || "NONE",
    refundedAmountPaise: Number(order.refundedAmountPaise || 0),
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

export function toClientRefund(value: any): Refund {
  const refund = toPlain(value);
  return {
    id: refund.refundId || refund.id || refund._id?.toString() || `refund-${Date.now()}`,
    orderId: refund.orderId || "",
    customerId: refund.customerId || "",
    customerName: refund.customerName || "Customer",
    customerEmail: refund.customerEmail || "",
    customerPhone: refund.customerPhone || "",
    paymentId: refund.paymentId || "",
    razorpayRefundId: refund.razorpayRefundId || undefined,
    items: Array.isArray(refund.items) ? refund.items.map((item: any) => ({
      itemKey: item.itemKey || `${refund.orderId}:${item.productId}`,
      productId: item.productId || "",
      title: item.title || "Product",
      quantity: Number(item.quantity || 0),
      unitAmountPaise: Number(item.unitAmountPaise || 0),
      amountPaise: Number(item.amountPaise || 0),
    })) : [],
    requestedAmountPaise: Number(refund.requestedAmountPaise || 0),
    approvedAmountPaise: Number(refund.approvedAmountPaise || 0),
    refundedAmountPaise: Number(refund.refundedAmountPaise || 0),
    refundableAmountPaise: Number(refund.refundableAmountPaise || 0),
    currency: refund.currency || "INR",
    reason: refund.reason || "Other",
    description: refund.description || "",
    evidenceUrls: Array.isArray(refund.evidenceUrls) ? refund.evidenceUrls : [],
    status: refund.status || "REQUESTED",
    adminRemarks: refund.adminRemarks || "",
    internalNotes: refund.internalNotes || "",
    failureReason: refund.failureReason || "",
    reviewedBy: refund.reviewedBy || undefined,
    reviewedAt: refund.reviewedAt ? dateToString(refund.reviewedAt) : undefined,
    processedAt: refund.processedAt ? dateToString(refund.processedAt) : undefined,
    createdAt: dateToString(refund.createdAt),
    updatedAt: dateToString(refund.updatedAt),
    deliveryDate: refund.deliveryDate ? dateToString(refund.deliveryDate) : undefined,
    history: Array.isArray(refund.history) ? refund.history.map((entry: any) => ({
      status: entry.status || refund.status || "REQUESTED",
      note: entry.note || "Refund event recorded",
      actorType: entry.actorType || "SYSTEM",
      actorId: entry.actorId || undefined,
      timestamp: dateToString(entry.timestamp),
    })) : [],
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
    wishlist: Array.isArray(user.wishlist) ? user.wishlist : [],
    role: user.role || "customer",
    isLoggedIn: true,
  };
}
