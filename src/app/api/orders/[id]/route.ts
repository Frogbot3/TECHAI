import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { ADMIN_SESSION_COOKIE, CUSTOMER_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";
import { toClientOrder } from "@/lib/serializers";
import Order from "@/models/Order";

const buildOrderQuery = (id: string) => {
  if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id) {
    return { $or: [{ orderId: id }, { trackingNumber: id }, { userPhone: id }, { userEmail: id }, { _id: id }] };
  }
  return { $or: [{ orderId: id }, { trackingNumber: id }, { userPhone: id }, { userEmail: id }] };
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const customerSession = await getSessionFromCookie(CUSTOMER_SESSION_COOKIE);
    const adminSession = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
    if (customerSession?.role !== "customer" && adminSession?.role !== "admin") {
      return NextResponse.json({ success: false, message: "Please sign in to track an order." }, { status: 401 });
    }
    await connectToDatabase();

    const ownerFilter = adminSession?.role === "admin" ? {} : { customerId: customerSession!.id };
    const order = await Order.findOne({ $and: [buildOrderQuery(id), ownerFilter] }).sort({ createdAt: -1 });

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: toClientOrder(order) });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status, courierName, trackingNumber, note, paymentStatus } = await req.json();

    const adminSession = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
    if (adminSession?.role !== "admin") {
      return NextResponse.json({ success: false, message: "Only administrators can update orders." }, { status: 403 });
    }

    await connectToDatabase();
    const order = await Order.findOne(buildOrderQuery(id));

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    if (paymentStatus === "Paid" && order.paymentStatus !== "Paid") {
      return NextResponse.json(
        { success: false, message: "Paid status can only be set after Razorpay signature verification." },
        { status: 403 }
      );
    }

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (courierName) order.courierName = courierName;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    order.statusHistory.push({
      status: status || order.status,
      timestamp: new Date(),
      note: note || `Order status updated to ${status || order.status}.`,
    });

    await order.save();

    return NextResponse.json({
      success: true,
      message: `Order ${order.orderId} updated.`,
      order: toClientOrder(order),
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
