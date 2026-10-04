import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Refund from "@/models/Refund";
import Order from "@/models/Order";
import { createRazorpayRefund, getRazorpayPayment, listRazorpayRefunds, RazorpayApiError } from "@/lib/razorpay-server";
import { getRefundableOrderAmountPaise, getReservedRefundAmountPaise } from "@/lib/refunds";
import { toClientRefund } from "@/lib/serializers";
import { sendRefundNotification } from "@/lib/refund-notifications";

const addHistory = (status: string, note: string, actorId: string) => ({ status, note, actorType: "ADMIN", actorId, timestamp: new Date() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
    if (session?.role !== "admin") return NextResponse.json({ success: false, message: "Administrator access required." }, { status: 403 });
    const { id } = await params;
    const body = await req.json();
    const approvedAmountPaise = Number(body.approvedAmountPaise);
    if (!Number.isInteger(approvedAmountPaise) || approvedAmountPaise <= 0) {
      return NextResponse.json({ success: false, message: "Enter a valid approved amount in paise." }, { status: 400 });
    }

    await connectToDatabase();
    const current = await Refund.findOne({ refundId: id, status: { $in: ["REQUESTED", "UNDER_REVIEW"] } });
    if (!current) return NextResponse.json({ success: false, message: "This refund is already being processed or completed." }, { status: 409 });
    if (approvedAmountPaise > current.requestedAmountPaise) return NextResponse.json({ success: false, message: "Approved amount cannot exceed the requested amount." }, { status: 400 });

    const order = await Order.findOne({ orderId: current.orderId });
    if (!order || order.paymentStatus !== "Paid" || order.razorpayPaymentId !== current.paymentId) {
      return NextResponse.json({ success: false, message: "The original paid order or payment could not be verified." }, { status: 409 });
    }

    const payment = await getRazorpayPayment(current.paymentId);
    if (payment.status !== "captured" && payment.captured !== true) {
      return NextResponse.json({ success: false, message: "Razorpay has not captured this payment." }, { status: 409 });
    }
    // Razorpay's amount_refunded already includes completed refunds. Only
    // reserve locally pending/in-flight requests here to avoid double counting.
    const otherRefunds = await Refund.find({ paymentId: current.paymentId, refundId: { $ne: current.refundId }, status: { $in: ["REQUESTED", "UNDER_REVIEW", "APPROVED", "REFUND_PROCESSING"] } });
    const gatewayRefundedPaise = Number(payment.amount_refunded || 0);
    const orderRefundablePaise = getRefundableOrderAmountPaise(order);
    const reservedPaise = getReservedRefundAmountPaise(otherRefunds);
    const availablePaise = Math.max(0, Math.min(Number(payment.amount || 0), orderRefundablePaise) - gatewayRefundedPaise - reservedPaise);
    if (approvedAmountPaise > availablePaise) {
      return NextResponse.json({ success: false, message: "Approved amount exceeds the remaining refundable balance." }, { status: 409 });
    }

    // This conditional update is the concurrency lock: only one admin can move
    // the request out of REQUESTED/UNDER_REVIEW and call Razorpay.
    const locked = await Refund.findOneAndUpdate(
      { refundId: current.refundId, status: { $in: ["REQUESTED", "UNDER_REVIEW"] } },
      {
        $set: { status: "REFUND_PROCESSING", approvedAmountPaise, reviewedBy: session.id, reviewedAt: new Date() },
        $push: { history: { $each: [addHistory("APPROVED", `Refund approved for ${approvedAmountPaise} paise.`, session.id), addHistory("REFUND_PROCESSING", "Razorpay refund initiation started.", session.id)] } },
      },
      { new: true }
    );
    if (!locked) return NextResponse.json({ success: false, message: "Another admin already started this refund." }, { status: 409 });

    try {
      const gatewayRefund = await createRazorpayRefund({
        paymentId: locked.paymentId,
        amountPaise: approvedAmountPaise,
        receipt: locked.refundId,
        notes: { techai_refund_id: locked.refundId, techai_order_id: locked.orderId },
      });
      const saved = await Refund.findOneAndUpdate(
        { refundId: locked.refundId, status: "REFUND_PROCESSING" },
        { $set: { razorpayRefundId: gatewayRefund.id, gatewayResponse: gatewayRefund } },
        { new: true }
      );
      void sendRefundNotification(saved || locked, "REFUND_PROCESSING").catch((error) => console.error("Refund notification error:", error));
      return NextResponse.json({ success: true, refund: toClientRefund(saved || locked), message: "Refund submitted to Razorpay and awaiting confirmation." });
    } catch (gatewayError) {
      // A timeout can happen after Razorpay accepted the refund. Reconcile once
      // before marking it failed, using the unique receipt/notes we sent.
      const gatewayRefunds = await listRazorpayRefunds(locked.paymentId).catch(() => ({ items: [] }));
      const accepted = gatewayRefunds.items?.find((item) => item.receipt === locked.refundId || item.notes?.techai_refund_id === locked.refundId);
      if (accepted) {
        const saved = await Refund.findOneAndUpdate({ refundId: locked.refundId }, { $set: { razorpayRefundId: accepted.id, gatewayResponse: accepted } }, { new: true });
        void sendRefundNotification(saved || locked, "REFUND_PROCESSING").catch((error) => console.error("Refund notification error:", error));
        return NextResponse.json({ success: true, refund: toClientRefund(saved || locked), message: "Refund accepted by Razorpay and awaiting confirmation." });
      }
      // An uncertain transport failure may have reached Razorpay. Keep the
      // refund reserved until reconciliation establishes its outcome.
      const definitiveRejection = gatewayError instanceof RazorpayApiError && gatewayError.status >= 400 && gatewayError.status < 500 && gatewayError.status !== 429;
      if (!definitiveRejection) return NextResponse.json({ success: false, message: "Razorpay confirmation is delayed. Reconcile this refund before retrying.", refund: toClientRefund(locked) }, { status: 502 });
      const failed = await Refund.findOneAndUpdate(
        { refundId: locked.refundId, status: "REFUND_PROCESSING" },
        { $set: { status: "FAILED", failureReason: gatewayError instanceof Error ? gatewayError.message.slice(0, 500) : "Razorpay refund failed." }, $push: { history: addHistory("FAILED", "Razorpay refund initiation failed.", session.id) } },
        { new: true }
      );
      void sendRefundNotification(failed || locked, "FAILED").catch((error) => console.error("Refund notification error:", error));
      return NextResponse.json({ success: false, message: "Razorpay could not start the refund. The request was marked failed.", refund: toClientRefund(failed || locked) }, { status: 502 });
    }
  } catch (error) {
    console.error("Admin refund approval error:", error);
    return NextResponse.json({ success: false, message: "Could not process the refund approval." }, { status: 500 });
  }
}
