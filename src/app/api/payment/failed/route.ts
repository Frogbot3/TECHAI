import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionFromCookie } from "@/lib/auth";
import Order from "@/models/Order";

export async function POST(req: Request) {
  try {
    const session = await getSessionFromCookie();
    if (!session) return NextResponse.json({ success: false, message: "Authentication required." }, { status: 401 });

    const { orderId, reason } = await req.json();
    await connectToDatabase();
    const order = await Order.findOne({
      orderId,
      $or: [{ customerId: session.id }, { userEmail: session.email }, { userPhone: session.phone }],
    });

    if (!order) return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    if (order.paymentStatus === "Paid") {
      return NextResponse.json({ success: false, message: "A paid order cannot be marked as failed." }, { status: 409 });
    }

    order.paymentStatus = "Failed";
    order.paymentDetails = {
      ...(order.paymentDetails || {}),
      provider: "Razorpay",
      gatewayStatus: "Payment failed",
      paymentNote: typeof reason === "string" ? reason.slice(0, 160) : "Payment was declined or failed",
    };
    await order.save();

    return NextResponse.json({ success: true, message: "Payment failure recorded." });
  } catch (error) {
    console.error("Razorpay payment failure update error:", error);
    return NextResponse.json({ success: false, message: "Could not record payment failure." }, { status: 500 });
  }
}
