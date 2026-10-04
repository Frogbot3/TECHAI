import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { applyPayment } from "@/lib/payment-state";
import { RazorpayPaymentResponse } from "@/lib/razorpay-server";
import Refund from "@/models/Refund";
import { syncOrderRefundTotals } from "@/lib/refunds";
import { sendRefundNotification } from "@/lib/refund-notifications";

function signaturesMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function POST(req: Request) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers.get("x-razorpay-signature") || "";
    const eventId = req.headers.get("x-razorpay-event-id") || "";
    const rawBody = await req.text();
    if (!secret || !signature || !signaturesMatch(createHmac("sha256", secret).update(rawBody).digest("hex"), signature)) {
      return NextResponse.json({ success: false, message: "Invalid webhook signature." }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as {
      event?: string;
      id?: string;
      payload?: { payment?: { entity?: RazorpayPaymentResponse }; refund?: { entity?: { id?: string; payment_id?: string; amount?: number; status?: string } } };
    };
    const event = payload.event || "";
    if (["payment.captured", "payment.failed"].includes(event)) {
      const payment = payload.payload?.payment?.entity;
      if (!payment?.order_id || payment.status !== event.split(".")[1]) return NextResponse.json({ success: false, message: "Invalid payment event." }, { status: 400 });
      await connectToDatabase();
      const result = await applyPayment(payment);
      // Retry unknown orders: delivery can race saving the gateway order ID.
      if (result.kind === "missing") return NextResponse.json({ success: false, message: "Order not available yet." }, { status: 503 });
      if (result.kind === "mismatch") return NextResponse.json({ success: false, message: "Payment amount or identity mismatch." }, { status: 400 });
      return NextResponse.json({ success: true, processed: true });
    }
    const refundEntity = payload.payload?.refund?.entity;
    const razorpayRefundId = refundEntity?.id || "";
    if (!razorpayRefundId || !["refund.processed", "refund.failed", "refund.pending", "refund.created"].includes(event)) {
      return NextResponse.json({ success: true, ignored: true });
    }

    await connectToDatabase();
    const existing = await Refund.findOne({ razorpayRefundId });
    if (!existing) return NextResponse.json({ success: true, ignored: true });
    if (refundEntity?.payment_id !== existing.paymentId || refundEntity?.amount !== existing.approvedAmountPaise) {
      return NextResponse.json({ success: false, message: "Refund does not match the approved payment and amount." }, { status: 400 });
    }
    const safeEventId = eventId || payload.id || `${event}:${razorpayRefundId}`;
    if (existing.webhookEventIds.includes(safeEventId)) {
      if (existing.status === "REFUNDED") await syncOrderRefundTotals(existing.orderId);
      return NextResponse.json({ success: true, duplicate: true });
    }

    const nextStatus = existing.status === "REFUNDED" ? "REFUNDED" : event === "refund.processed" ? "REFUNDED" : event === "refund.failed" ? "FAILED" : existing.status;
    const update: Record<string, unknown> = {
      $addToSet: { webhookEventIds: safeEventId },
      $set: { gatewayResponse: refundEntity },
    };
    if (nextStatus !== existing.status) {
      update.$set = {
        ...(update.$set as Record<string, unknown>),
        status: nextStatus,
        ...(nextStatus === "REFUNDED" ? { refundedAmountPaise: Number(refundEntity?.amount || existing.approvedAmountPaise), processedAt: new Date(), failureReason: "" } : { failureReason: "Razorpay reported the refund as failed." }),
      };
      update.$push = {
        history: {
          status: nextStatus,
          note: `Verified Razorpay webhook: ${event}.`,
          actorType: "SYSTEM",
          actorId: safeEventId,
          timestamp: new Date(),
        },
      };
    }
    const changed = await Refund.updateOne({ refundId: existing.refundId, webhookEventIds: { $ne: safeEventId }, ...(nextStatus !== "REFUNDED" ? { status: { $ne: "REFUNDED" } } : {}) }, update);
    if (nextStatus === "REFUNDED") await syncOrderRefundTotals(existing.orderId);
    if (changed.modifiedCount && nextStatus !== existing.status) void sendRefundNotification({ ...existing.toObject(), refundId: existing.refundId, orderId: existing.orderId }, nextStatus).catch((error) => console.error("Refund notification error:", error));
    return NextResponse.json({ success: true, processed: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ success: false, message: "Webhook processing failed." }, { status: 500 });
  }
}
