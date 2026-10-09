import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { toClientOrder, toClientUser } from "@/lib/serializers";
import { pagination } from "@/lib/query";
import User, { type IUser } from "@/models/User";
import Order from "@/models/Order";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if ((await getSessionFromCookie(ADMIN_SESSION_COOKIE))?.role !== "admin")
    return NextResponse.json(
      { success: false, message: "Admin access required." },
      { status: 403 },
    );
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return NextResponse.json(
      { success: false, message: "Customer not found." },
      { status: 404 },
    );
  const { page, limit } = pagination(new URL(req.url).searchParams, 10, 50);
  try {
    await connectToDatabase();
    const customer = await User.findOne({ _id: id, role: "customer" })
      .select(
        "name email phone verifiedPhone avatar addresses role createdAt lastLoginAt",
      )
      .maxTimeMS(3000)
      .lean<IUser>();
    if (!customer)
      return NextResponse.json(
        { success: false, message: "Customer not found." },
        { status: 404 },
      );
    // Stable account identity only: shared shipping phones must never merge accounts.
    const filter = { customerId: id };
    const [orders, summary] = await Promise.all([
      Order.find(filter)
        .select({ "items.image": 0, "items.normalizedImage": 0 })
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .maxTimeMS(3000)
        .lean(),
      Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            paidAmount: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "Paid"] }, "$finalAmount", 0],
              },
            },
            refundedAmount: { $sum: { $ifNull: ["$refundedAmountPaise", 0] } },
            deliveredOrders: {
              $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] },
            },
          },
        },
      ]).option({ maxTimeMS: 3000 }),
    ]);
    const totals = summary[0] || {
      totalOrders: 0,
      paidAmount: 0,
      refundedAmount: 0,
      deliveredOrders: 0,
    };
    return NextResponse.json(
      {
        success: true,
        customer: {
          ...toClientUser(customer),
          createdAt: customer.createdAt,
          lastLoginAt: customer.lastLoginAt,
        },
        orders: orders.map(toClientOrder),
        totals,
        page,
        pages: Math.max(1, Math.ceil(totals.totalOrders / limit)),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to load this customer. Please retry.",
      },
      { status: 503 },
    );
  }
}
