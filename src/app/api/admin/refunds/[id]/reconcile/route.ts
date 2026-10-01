import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Refund from "@/models/Refund";
import { getRazorpayRefund } from "@/lib/razorpay-server";
import { toClientRefund } from "@/lib/serializers";
import { syncOrderRefundTotals } from "@/lib/refunds";
import { sendRefundNotification } from "@/lib/refund-notifications";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
    if (session?.role !== "admin") return NextResponse.json({ success: false, message: "Administrator access required." }, { status: 403 });
    const { id } = await params;
    await connectToDatabase();
    const refund = await Refund.findOne({ refundId: id });
    if (!refund || !refund.razorpayRefundId) return NextResponse.json({ success: false, message: "No Razorpay refund is available to reconcile." }, { status: 404 });
    const gatewayRefund = await getRazorpayRefund(refund.razorpayRefundId);
    const isProcessed = gatewayRefund.status === "processed";
    const isFailed = gatewayRefund.status === "failed";
    const updated = await Refund.findOneAndUpdate(
      { refundId: id, status: { $in: ["REFUND_PROCESSING", "FAILED"] } },
      {
        $set: {
          gatewayResponse: gatewayRefund,
          ...(isProcessed ? { status: "REFUNDED", refundedAmountPaise: gatewayRefund.amount, processedAt: new Date(), failureReason: "" } : {}),
          ...(isFailed ? { status: "FAILED", failureReason: "Razorpay reported the refund as failed." } : {}),
        },
        ...(isProcessed || isFailed ? { $push: { history: { status: isProcessed ? "REFUNDED" : "FAILED", note: `Razorpay reconciliation reported ${gatewayRefund.status}.`, actorType: "SYSTEM", actorId: session.id, timestamp: new Date() } } } : {}),
      },
      { new: true }
    );
    if (isProcessed) await syncOrderRefundTotals(refund.orderId);
    if (isProcessed || isFailed) void sendRefundNotification(updated || refund, isProcessed ? "REFUNDED" : "FAILED").catch((error) => console.error("Refund notification error:", error));
    return NextResponse.json({ success: true, refund: toClientRefund(updated || refund), message: `Razorpay status: ${gatewayRefund.status}.` });
  } catch (error) {
    console.error("Refund reconciliation error:", error);
    return NextResponse.json({ success: false, message: "Could not reconcile the Razorpay refund." }, { status: 502 });
  }
}
