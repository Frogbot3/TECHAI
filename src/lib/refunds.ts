import { createHash, randomUUID } from "crypto";
import { IOrder } from "@/models/Order";
import Order from "@/models/Order";
import Refund, { ACTIVE_REFUND_STATUSES, IRefund } from "@/models/Refund";

export const REFUND_WINDOW_DAYS = 7;
export const REFUND_WINDOW_MS = REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export function createRefundId() {
  return `REF-${randomUUID().replace(/-/g, "").slice(0, 14).toUpperCase()}`;
}

export function toPaise(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : 0;
}

export function formatRefundKey(orderId: string, productId: string) {
  return `${orderId}:${productId}`;
}

export function getDeliveredAt(order: Pick<IOrder, "status" | "statusHistory">) {
  const deliveredEntry = Array.isArray(order.statusHistory)
    ? [...order.statusHistory].reverse().find((entry) => entry.status === "Delivered")
    : undefined;
  if (!deliveredEntry?.timestamp) return null;
  const date = new Date(deliveredEntry.timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getRefundDeadline(order: Pick<IOrder, "status" | "statusHistory">) {
  const deliveredAt = getDeliveredAt(order);
  return deliveredAt ? new Date(deliveredAt.getTime() + REFUND_WINDOW_MS) : null;
}

export function isRefundWindowOpen(order: Pick<IOrder, "status" | "statusHistory">, now = new Date()) {
  const deliveredAt = getDeliveredAt(order);
  const deadline = getRefundDeadline(order);
  return Boolean(deliveredAt && deadline && now.getTime() >= deliveredAt.getTime() && now.getTime() <= deadline.getTime());
}

type OrderLine = {
  productId: string;
  title: string;
  quantity: number;
  price: number;
};

function getOrderLines(order: Pick<IOrder, "items">): OrderLine[] {
  return (order.items || []).map((item) => ({
    productId: String(item.productId),
    title: item.title || "Product",
    quantity: Number(item.quantity || 0),
    price: Number(item.price || 0),
  }));
}

export function getRefundableLineAmountPaise(
  order: Pick<IOrder, "items" | "discountAmount">,
  productId: string,
  quantity: number
) {
  const orderLines = getOrderLines(order);
  const lines = orderLines.filter((line) => line.productId === productId);
  const totalBasePaise = orderLines.reduce((sum, line) => sum + toPaise(line.price) * line.quantity, 0);
  if (!lines.length || !totalBasePaise || quantity < 1) return 0;

  const discountPaise = Math.min(toPaise(order.discountAmount), totalBasePaise);
  const lineBasePaise = lines.reduce((sum, line) => sum + toPaise(line.price) * line.quantity, 0);
  const lineNetPaise = Math.max(0, lineBasePaise - Math.floor((lineBasePaise * discountPaise) / totalBasePaise));
  const availableQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  return Math.floor((lineNetPaise / Math.max(1, availableQuantity)) * Math.min(quantity, availableQuantity));
}

export function getRefundableOrderAmountPaise(order: Pick<IOrder, "finalAmount" | "shippingFee" | "razorpayPaymentId">) {
  const capturedPaise = toPaise(order.finalAmount);
  const shippingPaise = Math.min(capturedPaise, toPaise(order.shippingFee));
  return Math.max(0, capturedPaise - shippingPaise);
}

export function getReservedRefundAmountPaise(refunds: Pick<IRefund, "status" | "approvedAmountPaise" | "refundedAmountPaise" | "requestedAmountPaise">[]) {
  return refunds.reduce((sum, refund) => {
    if (refund.status === "REFUNDED") return sum + Number(refund.refundedAmountPaise || 0);
    if (ACTIVE_REFUND_STATUSES.includes(refund.status)) return sum + Number(refund.approvedAmountPaise || refund.requestedAmountPaise || 0);
    return sum;
  }, 0);
}

export function buildRefundRequestKey(input: { orderId: string; customerId: string; items: { productId: string; quantity: number }[] }) {
  return createHash("sha256")
    .update(JSON.stringify({ ...input, items: [...input.items].sort((a, b) => a.productId.localeCompare(b.productId)) }))
    .digest("hex");
}

export async function syncOrderRefundTotals(orderId: string) {
  const order = await Order.findOne({ orderId });
  if (!order) return;
  const completedRefunds = await Refund.find({ orderId, status: "REFUNDED" }, { refundedAmountPaise: 1 });
  const refundedAmountPaise = completedRefunds.reduce((sum, refund) => sum + Number(refund.refundedAmountPaise || 0), 0);
  const refundableAmountPaise = getRefundableOrderAmountPaise(order);
  await Order.updateOne(
    { orderId },
    {
      $set: {
        refundedAmountPaise,
        refundStatus: refundedAmountPaise <= 0 ? "NONE" : refundedAmountPaise >= refundableAmountPaise ? "REFUNDED" : "PARTIALLY_REFUNDED",
      },
    }
  );
}
