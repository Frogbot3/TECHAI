import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
  orderId: string; // e.g. TECHAI-ORD-98412
  userPhone: string;
  userEmail?: string;
  userName?: string;
  items: {
    productId: string;
    title: string;
    price: number;
    quantity: number;
    image: string;
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
  paymentTransactionId?: string;
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
    userPhone: { type: String, required: true, index: true },
    userEmail: { type: String, default: "" },
    userName: { type: String, default: "" },
    items: [
      {
        productId: String,
        title: String,
        price: Number,
        quantity: Number,
        image: String,
        selectedColor: String,
        selectedSize: String,
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, default: "" },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true, index: true },
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
    paymentTransactionId: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Placed", "Processing", "Shipped", "Out for Delivery", "Delivered"],
      default: "Placed",
    },
    trackingNumber: { type: String, default: "" },
    courierName: { type: String, default: "TechAI Express Express Courier" },
    estimatedDelivery: { type: String, default: "3-5 Business Days" },
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

export default mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
