import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { toClientUser } from "@/lib/serializers";
import Order from "@/models/Order";
import User from "@/models/User";

export async function GET() {
  try {
    await connectToDatabase();
    const [users, orders] = await Promise.all([
      User.find({ role: "customer" }).sort({ updatedAt: -1 }).limit(1000),
      Order.find({}).sort({ createdAt: -1 }).limit(2000),
    ]);

    const stats = new Map<string, { orderCount: number; totalSpent: number; lastOrderAt: string }>();
    orders.forEach((order: any) => {
      const keys = [order.customerId, order.userPhone, order.userEmail].filter(Boolean);
      keys.forEach((key) => {
        const current = stats.get(String(key)) || { orderCount: 0, totalSpent: 0, lastOrderAt: "" };
        current.orderCount += 1;
        current.totalSpent += Number(order.finalAmount || 0);
        const createdAt = order.createdAt instanceof Date ? order.createdAt.toISOString() : String(order.createdAt || "");
        if (!current.lastOrderAt || createdAt > current.lastOrderAt) current.lastOrderAt = createdAt;
        stats.set(String(key), current);
      });
    });

    const customers = users.map((user: any) => {
      const client = toClientUser(user);
      const byId = stats.get(client.id);
      const byPhone = client.phone ? stats.get(client.phone) : undefined;
      const byEmail = client.email ? stats.get(client.email) : undefined;
      const merged = [byId, byPhone, byEmail].filter(Boolean) as { orderCount: number; totalSpent: number; lastOrderAt: string }[];
      const orderCount = Math.max(0, ...merged.map((item) => item.orderCount));
      const totalSpent = Math.max(0, ...merged.map((item) => item.totalSpent));
      const lastOrderAt = merged.map((item) => item.lastOrderAt).sort().reverse()[0] || "";
      return { ...client, orderCount, totalSpent, lastOrderAt };
    });

    return NextResponse.json({ success: true, count: customers.length, customers });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
