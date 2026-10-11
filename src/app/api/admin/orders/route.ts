import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { adminOrdersPipeline, ORDER_STATUSES } from "@/lib/admin-orders";
import { toClientOrder } from "@/lib/serializers";
import Order from "@/models/Order";

export async function GET(req: Request) {
  if ((await getSessionFromCookie(ADMIN_SESSION_COOKIE))?.role !== "admin")
    return NextResponse.json(
      { success: false, message: "Administrator access required." },
      { status: 403 },
    );
  let query;
  try {
    query = adminOrdersPipeline(new URL(req.url).searchParams);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Invalid filters.",
      },
      { status: 400 },
    );
  }
  try {
    await connectToDatabase();
    const [result] = await Order.aggregate(query.pipeline)
      .read("primary")
      .option({ maxTimeMS: 5000 });
    const total = result.total[0]?.count || 0;
    const summary = Object.fromEntries(
      ORDER_STATUSES.map((status) => [status, 0]),
    );
    for (const row of result.summary) summary[row._id] = row.count;
    return NextResponse.json(
      {
        success: true,
        orders: result.orders.map(toClientOrder),
        summary,
        total,
        page: query.page,
        limit: query.limit,
        pages: Math.max(1, Math.ceil(total / query.limit)),
        fetchedAt: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Orders could not be loaded. Please retry." },
      { status: 503 },
    );
  }
}
