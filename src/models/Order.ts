import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  orderId: string;
  checkoutId?: string;
  customerId?: string;
  userPhone: string;
  userEmail?: string;
  userName?: string;
  items: {
    productId: string;
    title: string;
    brand?: string;
    category?: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    image: string;
    normalizedImage?: string;
    selectedColor?: string;
    selectedSize?: string;
  }[];
  shippingAddress: {
    fullName: string;
    phone: string;
    email: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  totalAmount: number;
  discountAmount: number;
  shippingFee: number;
  finalAmount: number;
  paymentMethod: "UPI" | "Card" | "NetBanking" | "COD";
  paymentStatus: "Paid" | "Pending" | "Failed";
  paymentDetails?: {
    provider?: string;
    gatewayStatus?: string;
    transactionId?: string;
    upiId?: string;
    cardLast4?: string;
    cardHolder?: string;
    bankName?: string;
    paymentNote?: string;
  };
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  refundStatus?: "NONE" | "PARTIALLY_REFUNDED" | "REFUNDED";
  refundedAmountPaise?: number;
  status: "Placed" | "Processing" | "Shipped" | "Out for Delivery" | "Delivered";
  trackingNumber: string;
  courierName: string;
  estimatedDelivery: string;
  statusHistory: {
    status: string;
    timestamp: Date;
    note: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    checkoutId: { type: String, default: "", index: true },
    customerId: { type: String, default: "", index: true },
    userPhone: { type: String, default: "", index: true },
    userEmail: { type: String, default: "", index: true },
    userName: { type: String, default: "" },
    items: [
      {
        productId: String,
        title: String,
        brand: String,
        category: String,
        price: Number,
        originalPrice: Number,
        quantity: Number,
        image: String,
        normalizedImage: String,
        selectedColor: String,
        selectedSize: String,
      },
    ],
    shippingAddress: {
      fullName: { type: String, default: "Customer" },
      phone: { type: String, default: "" },
      email: { type: String, default: "" },
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      pincode: { type: String, default: "" },
      landmark: { type: String, default: "" },
    },
    totalAmount: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["UPI", "Card", "NetBanking", "COD"],
      default: "UPI",
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Failed"],
      default: "Pending",
    },
    paymentDetails: {
      provider: { type: String, default: "Manual" },
      gatewayStatus: { type: String, default: "Gateway pending" },
      transactionId: { type: String, default: "" },
      upiId: { type: String, default: "" },
      cardLast4: { type: String, default: "" },
      cardHolder: { type: String, default: "" },
      bankName: { type: String, default: "" },
      paymentNote: { type: String, default: "" },
    },
    razorpayOrderId: { type: String, default: "", index: true },
    razorpayPaymentId: { type: String, default: "" },
    razorpaySignature: { type: String, default: "" },
    refundStatus: { type: String, enum: ["NONE", "PARTIALLY_REFUNDED", "REFUNDED"], default: "NONE" },
    refundedAmountPaise: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["Placed", "Processing", "Shipped", "Out for Delivery", "Delivered"],
      default: "Placed",
    },
    trackingNumber: { type: String, default: "" },
    courierName: { type: String, default: "Tech AI Logistics" },
    estimatedDelivery: { type: String, default: "3-5 business days" },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
  },
  { timestamps: true }
);

OrderSchema.index({ trackingNumber: 1 }, { sparse: true });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ razorpayPaymentId: 1 }, { sparse: true });

export default mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
