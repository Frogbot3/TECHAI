import mongoose, { Document, Schema } from "mongoose";

export const REFUND_STATUSES = [
  "REQUESTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "REFUND_PROCESSING",
  "REFUNDED",
  "FAILED",
  "CANCELLED",
] as const;

export const REFUND_REASONS = [
  "Damaged",
  "Defective",
  "Wrong product",
  "Product not as described",
  "Missing items",
  "Other",
] as const;

export const ACTIVE_REFUND_STATUSES = ["REQUESTED", "UNDER_REVIEW", "APPROVED", "REFUND_PROCESSING"];

export interface IRefund extends Document {
  refundId: string;
  requestKey?: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentId: string;
  razorpayRefundId?: string;
  items: {
    itemKey: string;
    productId: string;
    title: string;
    quantity: number;
    unitAmountPaise: number;
    amountPaise: number;
  }[];
  requestedAmountPaise: number;
  approvedAmountPaise: number;
  refundedAmountPaise: number;
  refundableAmountPaise: number;
  currency: string;
  reason: (typeof REFUND_REASONS)[number];
  description: string;
  evidenceUrls: string[];
  status: (typeof REFUND_STATUSES)[number];
  adminRemarks: string;
  internalNotes: string;
  failureReason: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  processedAt?: Date;
  deliveryDate?: Date;
  webhookEventIds: string[];
  gatewayResponse?: Record<string, unknown>;
  history: {
    status: (typeof REFUND_STATUSES)[number];
    note: string;
    actorType: "CUSTOMER" | "ADMIN" | "SYSTEM";
    actorId?: string;
    timestamp: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const RefundSchema = new Schema<IRefund>(
  {
    refundId: { type: String, required: true, unique: true, index: true },
    requestKey: { type: String },
    orderId: { type: String, required: true, index: true },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, default: "Customer" },
    customerEmail: { type: String, default: "" },
    customerPhone: { type: String, default: "" },
    paymentId: { type: String, required: true, index: true },
    razorpayRefundId: { type: String, default: "", sparse: true, unique: true },
    items: [
      {
        itemKey: { type: String, required: true },
        productId: { type: String, required: true },
        title: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitAmountPaise: { type: Number, required: true, min: 0 },
        amountPaise: { type: Number, required: true, min: 0 },
      },
    ],
    requestedAmountPaise: { type: Number, required: true, min: 1 },
    approvedAmountPaise: { type: Number, default: 0, min: 0 },
    refundedAmountPaise: { type: Number, default: 0, min: 0 },
    refundableAmountPaise: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    reason: { type: String, enum: REFUND_REASONS, required: true },
    description: { type: String, default: "" },
    evidenceUrls: [{ type: String }],
    status: { type: String, enum: REFUND_STATUSES, default: "REQUESTED", index: true },
    adminRemarks: { type: String, default: "" },
    internalNotes: { type: String, default: "" },
    failureReason: { type: String, default: "" },
    reviewedBy: { type: String, default: "" },
    reviewedAt: { type: Date },
    processedAt: { type: Date },
    deliveryDate: { type: Date },
    webhookEventIds: [{ type: String }],
    gatewayResponse: { type: Schema.Types.Mixed },
    history: [
      {
        status: { type: String, enum: REFUND_STATUSES, required: true },
        note: { type: String, required: true },
        actorType: { type: String, enum: ["CUSTOMER", "ADMIN", "SYSTEM"], required: true },
        actorId: { type: String, default: "" },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// A product line can only have one active request at a time. Terminal requests
// remain in the audit trail but do not block a later valid request.
RefundSchema.index(
  { orderId: 1, "items.itemKey": 1 },
  { unique: true, partialFilterExpression: { status: { $in: ACTIVE_REFUND_STATUSES } } }
);
RefundSchema.index({ createdAt: -1 });
RefundSchema.index(
  { requestKey: 1 },
  { unique: true, partialFilterExpression: { requestKey: { $exists: true }, status: { $in: ACTIVE_REFUND_STATUSES } } }
);

export default mongoose.models.Refund || mongoose.model<IRefund>("Refund", RefundSchema);
