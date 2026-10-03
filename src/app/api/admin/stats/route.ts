import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { toClientOrder, toClientProduct, toClientUser } from "@/lib/serializers";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";

const DASHBOARD_RECORD_LIMIT = 250;
const DASHBOARD_CACHE_MS = 15_000;
const DASHBOARD_DATABASE_DEADLINE_MS = 5_000;

type DashboardPayload = {
  success: true;
  stats: {
    totalRevenue: number;
    totalOrdersCount: number;
    totalProductsCount: number;
    lowStockCount: number;
    totalCustomersCount: number;
  };
  orders: ReturnType<typeof toClientOrder>[];
  products: ReturnType<typeof toClientProduct>[];
  customers: ReturnType<typeof toClientUser>[];
  lastUpdated: string;
};

declare global {
  // eslint-disable-next-line no-var
  var techAiAdminDashboardCache: { payload: DashboardPayload; expiresAt: number } | undefined;
}

const getCachedDashboard = () => global.techAiAdminDashboardCache;

class DashboardDatabaseTimeoutError extends Error {
  constructor() {
    super("Dashboard database request timed out.");
    this.name = "DashboardDatabaseTimeoutError";
  }
}

function withDatabaseDeadline<T>(work: Promise<T>) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new DashboardDatabaseTimeoutError()), DASHBOARD_DATABASE_DEADLINE_MS);
    work.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
}

export async function GET() {
  try {
    const session = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
    if (session?.role !== "admin") {
      return NextResponse.json({ success: false, message: "Administrator access required." }, { status: 403 });
    }

    const cached = getCachedDashboard();
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.payload, { headers: { "Cache-Control": "private, max-age=0, must-revalidate", "X-Data-Source": "memory-cache" } });
    }

    await connectToDatabase();

    // Keep the initial dashboard response bounded. The operational tabs can
    // later move to pagination without turning a routine refresh into a full
    // database export.
    const [orderResult, productResult, userResult] = await withDatabaseDeadline(Promise.all([
      Order.aggregate([
        { $facet: {
          records: [{ $sort: { createdAt: -1 } }, { $limit: DASHBOARD_RECORD_LIMIT }],
          totals: [{ $group: { _id: null, totalRevenue: { $sum: "$finalAmount" }, count: { $sum: 1 } } }],
        } },
      ]).read("secondaryPreferred").option({ maxTimeMS: 3_000 }),
      Product.aggregate([
        { $facet: {
          records: [{ $sort: { createdAt: -1 } }, { $limit: DASHBOARD_RECORD_LIMIT }],
          totals: [{ $group: { _id: null, count: { $sum: 1 }, lowStockCount: { $sum: { $cond: [{ $lte: ["$stock", 5] }, 1, 0] } } } }],
        } },
      ]).read("secondaryPreferred").option({ maxTimeMS: 3_000 }),
      User.aggregate([
        { $facet: {
          records: [{ $sort: { createdAt: -1 } }, { $limit: DASHBOARD_RECORD_LIMIT }],
          totals: [{ $count: "count" }],
        } },
      ]).read("secondaryPreferred").option({ maxTimeMS: 3_000 }),
    ]));

    const orders = orderResult[0]?.records || [];
    const products = productResult[0]?.records || [];
    const users = userResult[0]?.records || [];
    const orderTotals = orderResult[0]?.totals || [];
    const productTotals = productResult[0]?.totals || [];
    const totalCustomersCount = Number(userResult[0]?.totals?.[0]?.count || 0);

    const clientOrders = orders.map(toClientOrder);
    const clientProducts = products.map(toClientProduct);
    const clientUsers = users.map(toClientUser);

    const payload: DashboardPayload = {
      success: true,
      stats: {
        totalRevenue: Number(orderTotals[0]?.totalRevenue || 0),
        totalOrdersCount: Number(orderTotals[0]?.count || 0),
        totalProductsCount: Number(productTotals[0]?.count || 0),
        lowStockCount: Number(productTotals[0]?.lowStockCount || 0),
        totalCustomersCount,
      },
      orders: clientOrders,
      products: clientProducts,
      customers: clientUsers,
      lastUpdated: new Date().toISOString(),
    };

    global.techAiAdminDashboardCache = { payload, expiresAt: Date.now() + DASHBOARD_CACHE_MS };
    return NextResponse.json(payload, { headers: { "Cache-Control": "private, max-age=0, must-revalidate", "X-Data-Source": "database" } });
  } catch (error) {
    console.warn("Admin dashboard snapshot unavailable:", error instanceof Error ? error.name : "unknown error");
    const cached = getCachedDashboard();
    if (cached) {
      return NextResponse.json({ ...cached.payload, isStale: true }, { headers: { "Cache-Control": "private, max-age=0, must-revalidate", "X-Data-Source": "stale-memory-cache" } });
    }
    const message = error instanceof DashboardDatabaseTimeoutError
      ? "Dashboard data timed out while connecting to the database. Please retry in a moment."
      : "The database is temporarily unavailable. Please retry in a moment.";
    return NextResponse.json({ success: false, message }, { status: 503 });
  }
}
