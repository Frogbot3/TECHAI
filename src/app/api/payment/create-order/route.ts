import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionFromCookie } from "@/lib/auth";
import { createRazorpayOrder, getRazorpayConfig } from "@/lib/razorpay-server";
import Order from "@/models/Order";

function ownsOrder(order: { customerId?: string; userEmail?: string; userPhone?: string }, session: NonNullable<Awaited<ReturnType<typeof getSessionFromCookie>>>) {
  return Boolean(
    session &&
      ((order.customerId && order.customerId === session.id) ||
        (order.userEmail && session.email && order.userEmail.toLowerCase() === session.email.toLowerCase()) ||
        (order.userPhone && session.phone && order.userPhone === session.phone))
  );
}

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ success: false, message: "Please sign in before paying." }, { status: 401 });
    }

    const { orderId } = await req.json();
    if (typeof orderId !== "string" || !orderId.trim()) {
      return NextResponse.json({ success: false, message: "A valid order ID is required." }, { status: 400 });
    }

    await connectToDatabase();
    const order = await Order.findOne({ orderId: orderId.trim() });
    if (!order || !ownsOrder(order, session)) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }

    if (order.paymentMethod === "COD") {
      return NextResponse.json({ success: false, message: "Cash-on-delivery orders do not need online payment." }, { status: 400 });
    }
    if (order.paymentStatus === "Paid") {
      return NextResponse.json({ success: false, message: "This order has already been paid." }, { status: 409 });
    }
    if (order.status === "Delivered" || order.status === "Out for Delivery") {
      return NextResponse.json({ success: false, message: "This order can no longer accept payment." }, { status: 409 });
    }

    const { keyId } = getRazorpayConfig();
    let razorpayOrderId = order.razorpayOrderId;

    if (!razorpayOrderId) {
      const razorpayOrder = await createRazorpayOrder({
        amount: Math.round(Number(order.finalAmount) * 100),
        currency: "INR",
        receipt: order.orderId,
      });
      razorpayOrderId = razorpayOrder.id;
      order.razorpayOrderId = razorpayOrder.id;
      order.paymentDetails = {
        ...(order.paymentDetails || {}),
        provider: "Razorpay",
        gatewayStatus: "Razorpay order created",
      };
      await order.save();
    }

    return NextResponse.json({
      success: true,
      keyId,
      razorpayOrderId,
      amount: Math.round(Number(order.finalAmount) * 100),
      currency: "INR",
      orderId: order.orderId,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    return NextResponse.json(
      { success: false, message: (error as Error).message || "Unable to start Razorpay checkout." },
      { status: 502 }
    );
  }
}
