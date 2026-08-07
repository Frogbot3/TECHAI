import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { toClientOrder, toClientProduct, toClientUser } from "@/lib/serializers";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";

export async function GET() {
  try {
    await connectToDatabase();

    const [orders, products, users] = await Promise.all([
      Order.find({}).sort({ createdAt: -1 }),
      Product.find({}).sort({ createdAt: -1 }),
      User.find({}).sort({ createdAt: -1 }),
    ]);

    const clientOrders = orders.map(toClientOrder);
    const clientProducts = products.map(toClientProduct);
    const clientUsers = users.map(toClientUser);

    const totalRevenue = clientOrders.reduce((sum, o) => sum + (Number(o.finalAmount) || 0), 0);
    const totalOrdersCount = clientOrders.length;
    const totalProductsCount = clientProducts.length;
    const lowStockCount = clientProducts.filter((p) => p.stock <= 5).length;
    const totalCustomersCount = clientUsers.length;

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrdersCount,
        totalProductsCount,
        lowStockCount,
        totalCustomersCount,
      },
      orders: clientOrders,
      products: clientProducts,
      customers: clientUsers,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Admin stats API error:", error);
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
