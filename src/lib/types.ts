export type OrderStatus = "Placed" | "Processing" | "Shipped" | "Out for Delivery" | "Delivered";

export type PaymentMethod = "UPI" | "Card" | "NetBanking" | "COD";

export type PaymentStatus = "Paid" | "Pending" | "Failed";

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
  stock: number;
  isAiProduct?: boolean;
  isTrending?: boolean;
  isBestSeller?: boolean;
  description: string;
  features: string[];
  specs: Record<string, string>;
  createdAt?: string;
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

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar?: string;
  addresses?: ShippingAddress[];
  role?: "customer" | "admin";
  isLoggedIn: boolean;
}
