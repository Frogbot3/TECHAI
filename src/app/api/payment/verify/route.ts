import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionFromCookie } from "@/lib/auth";
import { getRazorpayConfig, getRazorpayPayment, RazorpayApiError } from "@/lib/razorpay-server";
import { toClientOrder } from "@/lib/serializers";
import { applyPayment } from "@/lib/payment-state";
import Order from "@/models/Order";

export const runtime = "nodejs";

function ownsOrder(order: { customerId?: string; userEmail?: string; userPhone?: string }, session: Awaited<ReturnType<typeof getSessionFromCookie>>) {
  return Boolean(session && order.customerId && order.customerId === session.id);
}

function signaturesMatch(expected: string, received: string) {
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(received, "utf8");
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ success: false, message: "Please sign in before verifying payment." }, { status: 401 });
    }

    const body = await req.json();
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
    const razorpayPaymentId = typeof body.razorpayPaymentId === "string" ? body.razorpayPaymentId.trim() : "";
    const razorpayOrderId = typeof body.razorpayOrderId === "string" ? body.razorpayOrderId.trim() : "";
    const razorpaySignature = typeof body.razorpaySignature === "string" ? body.razorpaySignature.trim() : "";

    if (!orderId || !razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
      return NextResponse.json({ success: false, message: "Incomplete Razorpay payment response." }, { status: 400 });
    }
    const { keySecret } = getRazorpayConfig();

    await connectToDatabase();
    const order = await Order.findOne({ orderId });
    if (!order || !ownsOrder(order, session)) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }

    if (!order.razorpayOrderId || order.razorpayOrderId !== razorpayOrderId) {
      return NextResponse.json({ success: false, message: "Razorpay order does not match this order." }, { status: 400 });
    }

    const expectedSignature = createHmac("sha256", keySecret)
      .update(`${order.razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (!signaturesMatch(expectedSignature, razorpaySignature)) {
      console.warn("Razorpay payment signature rejected", { reason: "invalid_signature" });
      return NextResponse.json({ success: false, message: "Invalid Razorpay payment signature." }, { status: 400 });
    }

    // Signature verification proves the response was created with the
    // configured secret. Fetch the payment as well so an authorized, wrong-
    // order, wrong-amount, or uncaptured payment can never mark this order paid.
    let gatewayPayment;
    try {
      gatewayPayment = await getRazorpayPayment(razorpayPaymentId);
    } catch (error) {
      console.error("Razorpay payment lookup failed", {
        status: error instanceof RazorpayApiError ? error.status : undefined,
        code: error instanceof RazorpayApiError ? error.code : undefined,
      });
      return NextResponse.json({ success: false, message: "Razorpay payment could not be confirmed yet. Please retry." }, { status: 502 });
    }

    const expectedAmountPaise = Math.round(Number(order.finalAmount) * 100);
    const paymentMatchesOrder =
      gatewayPayment.order_id === razorpayOrderId &&
      gatewayPayment.amount === expectedAmountPaise &&
      gatewayPayment.currency === "INR" &&
      (gatewayPayment.status === "captured" || gatewayPayment.captured === true);

    if (!paymentMatchesOrder) {
      console.warn("Razorpay payment rejected after gateway lookup", {
        reason: "payment_mismatch_or_not_captured",
        captured: gatewayPayment.captured === true,
        status: gatewayPayment.status,
      });
      return NextResponse.json({ success: false, message: "Razorpay payment does not match this order or is not captured." }, { status: 409 });
    }

    const result = await applyPayment(gatewayPayment);
    if (result.kind !== "processed" || !result.order) {
      return NextResponse.json({ success: false, message: "Payment could not be finalized." }, { status: 409 });
    }
    return NextResponse.json({ success: true, message: "Payment verified successfully.", order: toClientOrder(result.order) });
  } catch (error) {
    console.error("Razorpay verification error", {
      status: error instanceof RazorpayApiError ? error.status : undefined,
      code: error instanceof RazorpayApiError ? error.code : undefined,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json({ success: false, message: "Payment verification failed. Please retry." }, { status: 500 });
  }
}
