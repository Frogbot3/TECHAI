import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { toClientOrder, toClientUser } from "@/lib/serializers";
import {
  adminProductImageProjection,
  toAdminProduct,
} from "@/lib/admin-product-images";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";

const DASHBOARD_RECORD_LIMIT = 250;
const DASHBOARD_CACHE_MS = 15_000;
const DASHBOARD_DATABASE_DEADLINE_MS = 8_000;

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
  products: ReturnType<typeof toAdminProduct>[];
  customers: ReturnType<typeof toClientUser>[];
  lastUpdated: string;
};

declare global {
  // eslint-disable-next-line no-var
  var techAiAdminDashboardInFlight: Promise<DashboardPayload> | undefined;
  var techAiAdminDashboardCache:
    { payload: DashboardPayload; expiresAt: number } | undefined;
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
    const timeout = setTimeout(
      () => reject(new DashboardDatabaseTimeoutError()),
      DASHBOARD_DATABASE_DEADLINE_MS,
    );
    work.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

export async function GET() {
  const session = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
  if (session?.role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Administrator access required." },
      { status: 403 },
    );
  }

  try {
    const cached = getCachedDashboard();
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json(cached.payload, {
        headers: {
          "Cache-Control": "private, max-age=0, must-revalidate",
          "X-Data-Source": "memory-cache",
        },
      });
    }

    if (!global.techAiAdminDashboardInFlight) {
      global.techAiAdminDashboardInFlight = (async () => {
        await connectToDatabase();
        const [
          orders,
          products,
          users,
          orderTotals,
          productTotals,
          totalCustomersCount,
        ] = await Promise.all([
          Order.find({})
            .select({ "items.image": 0, "items.normalizedImage": 0 })
            .sort({ createdAt: -1 })
            .limit(DASHBOARD_RECORD_LIMIT)
            .read("primary")
            .maxTimeMS(3000)
            .lean(),
          Product.aggregate([
            { $sort: { createdAt: -1 } },
            { $limit: DASHBOARD_RECORD_LIMIT },
            { $set: adminProductImageProjection },
          ])
            .read("primary")
            .option({ maxTimeMS: 3000 }),
          User.find({})
            .sort({ createdAt: -1 })
            .limit(DASHBOARD_RECORD_LIMIT)
            .read("primary")
            .maxTimeMS(3000)
            .lean(),
          Order.aggregate([
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: "$finalAmount" },
                count: { $sum: 1 },
              },
            },
          ])
            .read("primary")
            .option({ maxTimeMS: 3000 }),
          Product.aggregate([
            {
              $group: {
                _id: null,
                count: { $sum: 1 },
                lowStockCount: {
                  $sum: { $cond: [{ $lte: ["$stock", 5] }, 1, 0] },
                },
              },
            },
          ])
            .read("primary")
            .option({ maxTimeMS: 3000 }),
          User.countDocuments({}).read("primary").maxTimeMS(3000),
        ]);
        const clientOrders = orders.map(toClientOrder);
        const clientProducts = products.map(toAdminProduct);
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

        global.techAiAdminDashboardCache = {
          payload,
          expiresAt: Date.now() + DASHBOARD_CACHE_MS,
        };
        return payload;
      })().finally(() => {
        global.techAiAdminDashboardInFlight = undefined;
      });
    }
    const payload = await withDatabaseDeadline(
      global.techAiAdminDashboardInFlight,
    );
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "private, max-age=0, must-revalidate",
        "X-Data-Source": "database",
      },
    });
  } catch (error) {
    console.warn(
      "Admin dashboard snapshot unavailable:",
      error instanceof Error ? error.name : "unknown error",
    );
    const cached = getCachedDashboard();
    if (cached) {
      return NextResponse.json(
        { ...cached.payload, isStale: true },
        {
          headers: {
            "Cache-Control": "private, max-age=0, must-revalidate",
            "X-Data-Source": "stale-memory-cache",
          },
        },
      );
    }
    const message =
      error instanceof DashboardDatabaseTimeoutError
        ? "Dashboard data timed out while connecting to the database. Please retry in a moment."
        : "The database is temporarily unavailable. Please retry in a moment.";
    return NextResponse.json({ success: false, message }, { status: 503 });
  }
}
