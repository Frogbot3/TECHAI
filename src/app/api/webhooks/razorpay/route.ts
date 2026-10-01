import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
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
      payload?: { refund?: { entity?: { id?: string; payment_id?: string; amount?: number; status?: string } } };
    };
    const event = payload.event || "";
    const refundEntity = payload.payload?.refund?.entity;
    const razorpayRefundId = refundEntity?.id || "";
    if (!razorpayRefundId || !["refund.processed", "refund.failed", "refund.pending", "refund.created"].includes(event)) {
      return NextResponse.json({ success: true, ignored: true });
    }

    await connectToDatabase();
    const existing = await Refund.findOne({ razorpayRefundId });
    if (!existing) return NextResponse.json({ success: true, ignored: true });
    const safeEventId = eventId || payload.id || `${event}:${razorpayRefundId}`;
    if (existing.webhookEventIds.includes(safeEventId)) return NextResponse.json({ success: true, duplicate: true });

    const nextStatus = event === "refund.processed" ? "REFUNDED" : event === "refund.failed" ? "FAILED" : existing.status;
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
    await Refund.updateOne({ refundId: existing.refundId, webhookEventIds: { $ne: safeEventId } }, update);
    if (nextStatus === "REFUNDED") await syncOrderRefundTotals(existing.orderId);
    if (nextStatus !== existing.status) void sendRefundNotification({ ...existing.toObject(), refundId: existing.refundId, orderId: existing.orderId }, nextStatus).catch((error) => console.error("Refund notification error:", error));
    return NextResponse.json({ success: true, processed: true });
  } catch (error) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ success: false, message: "Webhook processing failed." }, { status: 500 });
  }
}
