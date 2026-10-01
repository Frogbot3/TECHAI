export type OrderStatus = "Placed" | "Processing" | "Shipped" | "Out for Delivery" | "Delivered";

export type PaymentMethod = "UPI" | "Card" | "NetBanking" | "COD";

export type PaymentStatus = "Paid" | "Pending" | "Failed";

export type RefundStatus =
  | "REQUESTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "REFUND_PROCESSING"
  | "REFUNDED"
  | "FAILED"
  | "CANCELLED";

export type RefundReason =
  | "Damaged"
  | "Defective"
  | "Wrong product"
  | "Product not as described"
  | "Missing items"
  | "Other";

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verifiedPurchase?: boolean;
}

export interface Product {
  id: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  image: string;
  images?: string[];
  originalImage?: string;
  normalizedImage?: string;
  imageFit?: "auto" | "standard" | "full-product";
  imageScale?: "small" | "medium" | "large";
  imagePosition?: "center" | "top" | "bottom";
  stock: number;
  isAiProduct?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  isHeroFeatured?: boolean;
  heroBannerHeadline?: string;
  heroBannerSubtitle?: string;
  heroBadge?: string;
  heroOfferText?: string;
  description: string;
  features: string[];
  specs: Record<string, string>;
  createdAt?: string;
  reviews?: Review[];
}

export type HeroCampaignBackgroundStyle = "solid" | "gradient";

export interface HeroCampaign {
  id: string;
  name: string;
  badge: string;
  productId: string;
  product?: Product;
  titleOverride?: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  offerText: string;
  ctaText: string;
  imageOverride?: string;
  backgroundStyle: HeroCampaignBackgroundStyle;
  backgroundValue: string;
  verified: boolean;
  priority: number;
  displayOrder: number;
  startAt: string;
  endAt: string;
  isActive: boolean;
  impressions: number;
  clicks: number;
  productClicks: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  houseNumber?: string;
  deliveryInstructions?: string;
  coordinates?: { lat: number; lng: number };
}

export interface PaymentDetails {
  provider?: "Manual" | "Razorpay" | "Stripe" | "UPI" | "COD";
  gatewayStatus?: string;
  transactionId?: string;
  upiId?: string;
  cardLast4?: string;
  cardHolder?: string;
  bankName?: string;
  paymentNote?: string;
}

export interface Order {
  id: string;
  checkoutId?: string;
  customerId?: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentDetails?: PaymentDetails;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  refundStatus?: "NONE" | "PARTIALLY_REFUNDED" | "REFUNDED";
  refundedAmountPaise?: number;
  status: OrderStatus;
  trackingNumber: string;
  courierName: string;
  estimatedDelivery: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    note: string;
  }[];
}

export interface RefundItem {
  itemKey: string;
  productId: string;
  title: string;
  quantity: number;
  unitAmountPaise: number;
  amountPaise: number;
}

export interface RefundHistoryEntry {
  status: RefundStatus;
  note: string;
  actorType: "CUSTOMER" | "ADMIN" | "SYSTEM";
  actorId?: string;
  timestamp: string;
}

export interface Refund {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentId: string;
  razorpayRefundId?: string;
  items: RefundItem[];
  requestedAmountPaise: number;
  approvedAmountPaise: number;
  refundedAmountPaise: number;
  refundableAmountPaise: number;
  currency: string;
  reason: RefundReason;
  description: string;
  evidenceUrls: string[];
  status: RefundStatus;
  adminRemarks: string;
  internalNotes: string;
  failureReason: string;
  reviewedBy?: string;
  reviewedAt?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
  deliveryDate?: string;
  history: RefundHistoryEntry[];
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  addresses?: ShippingAddress[];
  wishlist?: string[];
  role?: "customer" | "admin";
  isLoggedIn: boolean;
}
