import Order from "@/models/Order";
import { RazorpayPaymentResponse } from "./razorpay-server";

// Both signed callbacks and signed webhooks use one atomic transition. A late
// failure cannot overwrite a capture; a capture can recover a failed attempt.
export async function applyPayment(payment: RazorpayPaymentResponse) {
  const order = await Order.findOne({ razorpayOrderId: payment.order_id });
  if (!order) return { kind: "missing" as const };
  if (!payment.id || payment.currency !== "INR" || payment.amount !== Math.round(Number(order.finalAmount) * 100) || order.paymentMethod === "COD") {
    return { kind: "mismatch" as const };
  }
  if (!["captured", "failed"].includes(payment.status)) return { kind: "pending" as const, order };
  const captured = payment.status === "captured";
  const method = ({ card: "Card", upi: "UPI", netbanking: "NetBanking" } as Record<string, string>)[payment.method || ""];
  const updated = await Order.findOneAndUpdate(
    { _id: order._id, razorpayOrderId: payment.order_id, paymentStatus: { $ne: "Paid" } },
    { $set: {
      paymentStatus: captured ? "Paid" : "Failed",
      ...(captured ? { razorpayPaymentId: payment.id, ...(method ? { paymentMethod: method } : {}) } : {}),
      "paymentDetails.provider": "Razorpay",
      "paymentDetails.gatewayStatus": captured ? "Payment captured" : "Payment failed",
      "paymentDetails.transactionId": payment.id,
    } }, { new: true }
  );
  const current = updated || await Order.findById(order._id);
  if (captured && current?.razorpayPaymentId !== payment.id) return { kind: "mismatch" as const };
  return { kind: "processed" as const, order: current };
}
