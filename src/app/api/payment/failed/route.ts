import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionFromCookie } from "@/lib/auth";
import { getRazorpayPayment } from "@/lib/razorpay-server";
import { applyPayment } from "@/lib/payment-state";
import Order from "@/models/Order";

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });

    const { orderId, paymentId } = await req.json();
    await connectToDatabase();
    const order = await Order.findOne({
      orderId,
      customerId: session.id,
    });

    if (!order) return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    if (typeof paymentId !== "string" || !/^pay_[A-Za-z0-9]+$/.test(paymentId)) {
      return NextResponse.json({ success: true, message: "Awaiting verified gateway event." }, { status: 202 });
    }
    const payment = await getRazorpayPayment(paymentId);
    if (payment.order_id !== order.razorpayOrderId) return NextResponse.json({ success: false, message: "Payment does not belong to this order." }, { status: 400 });
    const result = await applyPayment(payment);
    if (result.kind !== "processed") return NextResponse.json({ success: false, message: "Payment status is not confirmed." }, { status: 409 });

    return NextResponse.json({ success: true, message: "Payment failure recorded." });
  } catch (error) {
    console.error("Razorpay payment failure update error:", error);
    return NextResponse.json({ success: false, message: "Could not record payment failure." }, { status: 500 });
  }
}
