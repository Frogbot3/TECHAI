import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { getSessionFromCookie } from "@/lib/auth";
import { createRazorpayOrder, getRazorpayConfig, getRazorpayOrder, RazorpayApiError } from "@/lib/razorpay-server";
import Order from "@/models/Order";

export const runtime = "nodejs";

function ownsOrder(order: { customerId?: string; userEmail?: string; userPhone?: string }, session: NonNullable<Awaited<ReturnType<typeof getSessionFromCookie>>>) {
  return Boolean(session && order.customerId && order.customerId === session.id);
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
    const amountPaise = Math.round(Number(order.finalAmount) * 100);
    let razorpayOrderId = order.razorpayOrderId;
    let reusedRazorpayOrder = false;

    // Razorpay order IDs are account/environment-specific. Reuse a pending
    // order when it belongs to the configured account and has the same amount;
    // replace only an unknown or incompatible gateway order, never the app order.
    if (razorpayOrderId) {
      try {
        const existingRazorpayOrder = await getRazorpayOrder(razorpayOrderId);
        if (existingRazorpayOrder.amount === amountPaise && existingRazorpayOrder.currency === "INR") {
          reusedRazorpayOrder = true;
        } else {
          razorpayOrderId = "";
        }
      } catch (error) {
        const missingGatewayOrder =
          error instanceof RazorpayApiError &&
          (error.status === 404 || (error.status === 400 && /does not exist|not found|invalid.*order/i.test(error.message)));
        if (missingGatewayOrder) {
          razorpayOrderId = "";
        } else {
          throw error;
        }
      }
    }

    if (!razorpayOrderId) {
      const razorpayOrder = await createRazorpayOrder({
        amount: amountPaise,
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

    console.info("Razorpay checkout order prepared", {
      reusedRazorpayOrder,
      amountPaise,
      currency: "INR",
    });

    return NextResponse.json({
      success: true,
      keyId,
      razorpayOrderId,
      amount: amountPaise,
      currency: "INR",
      orderId: order.orderId,
    });
  } catch (error) {
    console.error("Razorpay order creation error", {
      status: error instanceof RazorpayApiError ? error.status : undefined,
      code: error instanceof RazorpayApiError ? error.code : undefined,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    const message = error instanceof RazorpayApiError && error.status === 401
      ? "Razorpay rejected the configured credentials. Check that the key ID and secret belong to the same account and mode."
      : error instanceof Error
      ? error.message
      : "Unable to start Razorpay checkout.";
    return NextResponse.json(
      { success: false, message },
      { status: 502 }
    );
  }
}
