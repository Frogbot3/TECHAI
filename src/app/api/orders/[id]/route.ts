import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { toClientOrder } from "@/lib/serializers";
import Order from "@/models/Order";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const order = await Order.findOne({
      $or: [
        { orderId: id },
        { trackingNumber: id },
        { userPhone: id },
        { userEmail: id },
      ],
    }).sort({ createdAt: -1 });

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

    await connectToDatabase();
    const order = await Order.findOne({ $or: [{ orderId: id }, { _id: id }] });

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
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
