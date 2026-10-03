import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import Refund from "@/models/Refund";
import { toClientRefund } from "@/lib/serializers";

export async function GET(req: Request) {
  try {
    const session = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
    if (session?.role !== "admin") return NextResponse.json({ success: false, message: "Administrator access required." }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status")?.trim();
    const search = searchParams.get("search")?.trim();
    const from = searchParams.get("from")?.trim();
    const to = searchParams.get("to")?.trim();
    const sort = searchParams.get("sort") === "oldest" ? 1 : -1;
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") || 100)));
    const filter: Record<string, unknown> = {};
    if (status && status !== "ALL") filter.status = status;
    if (search) {
      filter.$or = [
        { refundId: { $regex: search, $options: "i" } },
        { orderId: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerEmail: { $regex: search, $options: "i" } },
      ];
    }
    if (from || to) {
      filter.createdAt = {
        ...(from ? { $gte: new Date(`${from}T00:00:00.000Z`) } : {}),
        ...(to ? { $lte: new Date(`${to}T23:59:59.999Z`) } : {}),
      };
    }

    await connectToDatabase();
    const [total, refunds, counts] = await Promise.all([
      Refund.countDocuments(filter),
      Refund.find(filter).sort({ createdAt: sort }).skip((page - 1) * limit).limit(limit).read("secondaryPreferred").lean(),
      Refund.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]).read("secondaryPreferred"),
    ]);
    return NextResponse.json({
      success: true,
      refunds: refunds.map(toClientRefund),
      counts: counts.reduce<Record<string, number>>((result, item) => { result[item._id] = item.count; return result; }, {}),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin refund list error:", error);
    return NextResponse.json({ success: false, message: "Could not load refund requests." }, { status: 500 });
  }
}
