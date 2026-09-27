import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionFromCookie } from "@/lib/auth";
import { toClientOrder } from "@/lib/serializers";
import Order from "@/models/Order";

function ownsOrder(order: { customerId?: string; userEmail?: string; userPhone?: string }, session: Awaited<ReturnType<typeof getSessionFromCookie>>) {
  return Boolean(
    session &&
      ((order.customerId && order.customerId === session.id) ||
        (order.userEmail && session.email && order.userEmail.toLowerCase() === session.email.toLowerCase()) ||
        (order.userPhone && session.phone && order.userPhone === session.phone))
  );
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
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ success: false, message: "Razorpay verification is not configured." }, { status: 500 });
    }

    await connectToDatabase();
    const order = await Order.findOne({ orderId });
    if (!order || !ownsOrder(order, session)) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }

    if (order.paymentStatus === "Paid") {
      if (order.razorpayPaymentId === razorpayPaymentId) {
        return NextResponse.json({ success: true, message: "Payment was already verified.", order: toClientOrder(order) });
      }
      return NextResponse.json({ success: false, message: "This order has already been paid." }, { status: 409 });
    }

    if (!order.razorpayOrderId || order.razorpayOrderId !== razorpayOrderId) {
      return NextResponse.json({ success: false, message: "Razorpay order does not match this order." }, { status: 400 });
    }

    const expectedSignature = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${order.razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (!signaturesMatch(expectedSignature, razorpaySignature)) {
      return NextResponse.json({ success: false, message: "Invalid Razorpay payment signature." }, { status: 400 });
    }

    const verifiedOrder = await Order.findOneAndUpdate(
      { orderId, paymentStatus: { $ne: "Paid" }, razorpayOrderId },
      {
        $set: {
          paymentStatus: "Paid",
          razorpayPaymentId,
          razorpaySignature,
          "paymentDetails.provider": "Razorpay",
          "paymentDetails.gatewayStatus": "Payment verified",
          "paymentDetails.transactionId": razorpayPaymentId,
        },
      },
      { new: true }
    );

    if (!verifiedOrder) {
      const currentOrder = await Order.findOne({ orderId });
      if (currentOrder?.paymentStatus === "Paid" && currentOrder.razorpayPaymentId === razorpayPaymentId) {
        return NextResponse.json({ success: true, message: "Payment was already verified.", order: toClientOrder(currentOrder) });
      }
      return NextResponse.json({ success: false, message: "Payment could not be finalized." }, { status: 409 });
    }

    return NextResponse.json({ success: true, message: "Payment verified successfully.", order: toClientOrder(verifiedOrder) });
  } catch (error) {
    console.error("Razorpay verification error:", error);
    return NextResponse.json({ success: false, message: "Payment verification failed. Please retry." }, { status: 500 });
  }
}
