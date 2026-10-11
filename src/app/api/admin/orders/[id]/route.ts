import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { toClientOrder, toClientRefund } from "@/lib/serializers";
import Order from "@/models/Order";
import Refund from "@/models/Refund";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if ((await getSessionFromCookie(ADMIN_SESSION_COOKIE))?.role !== "admin")
    return NextResponse.json(
      { success: false, message: "Administrator access required." },
      { status: 403 },
    );
  const { id } = await params;
  try {
    await connectToDatabase();
    // Exact order identity; historical items and prices come only from the saved order.
    const order = await Order.findOne({ orderId: id })
      .select({ "items.image": 0, "items.normalizedImage": 0 })
      .read("primary")
      .maxTimeMS(3000)
      .lean();
    if (!order)
      return NextResponse.json(
        { success: false, message: "Order not found." },
        { status: 404 },
      );
    const refunds = await Refund.find({ orderId: id })
      .sort({ createdAt: -1 })
      .limit(51)
      .read("primary")
      .maxTimeMS(3000)
      .lean();
    return NextResponse.json(
      {
        success: true,
        order: toClientOrder(order),
        refunds: refunds.slice(0, 50).map(toClientRefund),
        moreRefunds: refunds.length > 50,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Order details could not be loaded. Please retry.",
      },
      { status: 503 },
    );
  }
}
