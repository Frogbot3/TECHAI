"use client";
import { useMemo, useState } from "react";
import {
  Wallet,
  ShoppingBag,
  Package,
  AlertTriangle,
  Users,
} from "lucide-react";
import { Order, Product } from "@/lib/types";
import { AdminImage, AdminEmpty } from "./AdminUI";
type Stats = {
  totalRevenue: number;
  totalOrdersCount: number;
  totalProductsCount: number;
  lowStockCount: number;
  totalCustomersCount: number;
};
const money = (value: number) =>
  `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
const series = [
  "var(--admin-primary)",
  "var(--admin-chart-2)",
  "var(--admin-chart-3)",
  "var(--admin-chart-4)",
  "var(--admin-success)",
];

export default function AdminOverview({
  stats,
  orders,
  products,
}: {
  stats: Stats;
  orders: Order[];
  products: Product[];
}) {
  const [days, setDays] = useState(30);
  const [focused, setFocused] = useState<number | null>(null);
  const trend = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(today);
      date.setDate(date.getDate() - days + index + 1);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      const matches = orders.filter(
        (order) =>
          new Date(order.createdAt) >= date && new Date(order.createdAt) < end,
      );
      return {
        label: date.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        }),
        revenue: matches.reduce((sum, order) => sum + order.finalAmount, 0),
        count: matches.length,
      };
    });
  }, [orders, days]);
  const statusCounts = [
    "Placed",
    "Processing",
    "Shipped",
    "Out for Delivery",
    "Delivered",
  ].map((status) => ({
    status,
    count: orders.filter((order) => order.status === status).length,
  }));
  const categorySales = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach((order) =>
      order.items.forEach((item) =>
        map.set(
          item.product.category,
          (map.get(item.product.category) || 0) +
            item.product.price * item.quantity,
        ),
      ),
    );
    return [...map].sort((a, b) => b[1] - a[1]);
  }, [orders]);
  const topProducts = useMemo(() => {
    const map = new Map<
      string,
      { product: Product; units: number; revenue: number }
    >();
    orders.forEach((order) =>
      order.items.forEach((item) => {
        const entry = map.get(item.product.id) || {
          product: item.product,
          units: 0,
          revenue: 0,
        };
        entry.units += item.quantity;
        entry.revenue += item.quantity * item.product.price;
        map.set(item.product.id, entry);
      }),
    );
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orders]);
  const cards = [
    {
      label: "Gross order value",
      value: money(stats.totalRevenue),
      sub: "All orders · before refunds",
      icon: Wallet,
    },
    {
      label: "Total orders",
      value: stats.totalOrdersCount.toLocaleString("en-IN"),
      sub: "All payment states",
      icon: ShoppingBag,
    },
    {
      label: "Catalog products",
      value: stats.totalProductsCount.toLocaleString("en-IN"),
      sub: "Products in your store",
      icon: Package,
    },
    {
      label: "Low stock",
      value: stats.lowStockCount.toLocaleString("en-IN"),
      sub: "5 units or fewer",
      icon: AlertTriangle,
    },
    {
      label: "Customers",
      value: stats.totalCustomersCount.toLocaleString("en-IN"),
      sub: "Registered accounts",
      icon: Users,
    },
  ];
  const total = trend.reduce((sum, item) => sum + item.revenue, 0);
  const count = trend.reduce((sum, item) => sum + item.count, 0);
  const max = Math.max(...trend.map((item) => item.revenue), 1);
  const points = trend.map(
    (item, i) =>
      `${55 + (i * 620) / (days - 1)},${205 - (item.revenue / max) * 170}`,
  );
  const categoryTotal = categorySales.reduce(
    (sum, [, value]) => sum + value,
    0,
  );
  const lowStock = products.filter((product) => product.stock <= 5);
  return (
    <div className="space-y-6">
      <div className="admin-metrics">
        {cards.map(({ label, value, sub, icon: Icon }) => (
          <section key={label} className="admin-card admin-metric">
            <div className="admin-metric-top">
              <span>{label}</span>
              <span className="admin-metric-icon">
                <Icon size={17} />
              </span>
            </div>
            <strong>{value}</strong>
            <small>{sub}</small>
          </section>
        ))}
      </div>
      <p className="text-xs text-admin-muted">
        Totals cover the store. Charts and lists use the latest {orders.length}{" "}
        loaded orders and {products.length} products (up to 250 each).
      </p>
      <div className="admin-chart-grid">
        <section className="admin-card">
          <div className="admin-card-heading">
            <div>
              <h2>Order value over time</h2>
              <p>Gross order value · all payment states</p>
            </div>
            <select
              aria-label="Trend date range"
              className="admin-theme-select"
              value={days}
              onChange={(event) => {
                setDays(Number(event.target.value));
                setFocused(null);
              }}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
          <div className="admin-chart-summary">
            <div>
              Order value<strong>{money(total)}</strong>
            </div>
            <div>
              Orders<strong>{count}</strong>
            </div>
            <div>
              Average value<strong>{money(count ? total / count : 0)}</strong>
            </div>
          </div>
          {orders.length ? (
            <>
              <svg
                className="admin-chart"
                viewBox="0 0 700 240"
                role="img"
                aria-label={`Gross order value for the last ${days} days: ${money(total)}, ${count} orders`}
              >
                <defs>
                  <linearGradient
                    id="admin-revenue-fill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--admin-primary)"
                      stopOpacity=".22"
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--admin-primary)"
                      stopOpacity=".02"
                    />
                  </linearGradient>
                </defs>
                {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
                  <g key={fraction}>
                    <line
                      x1="55"
                      x2="675"
                      y1={205 - fraction * 170}
                      y2={205 - fraction * 170}
                      stroke="var(--admin-border)"
                      strokeDasharray="3 5"
                    />
                    <text x="45" y={209 - fraction * 170} textAnchor="end">
                      {max === 1
                        ? "0"
                        : new Intl.NumberFormat("en-IN", {
                            notation: "compact",
                            maximumFractionDigits: 1,
                          }).format(max * fraction)}
                    </text>
                  </g>
                ))}
                <path
                  d={`M55,205 L${points.join(" L")} L675,205 Z`}
                  fill="url(#admin-revenue-fill)"
                />
                <polyline
                  points={points.join(" ")}
                  fill="none"
                  stroke="var(--admin-primary)"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                {trend.map((item, index) => (
                  <circle
                    key={index}
                    cx={55 + (index * 620) / (days - 1)}
                    cy={205 - (item.revenue / max) * 170}
                    r={focused === index ? 5 : 3}
                    fill="var(--admin-surface)"
                    stroke="var(--admin-primary)"
                    strokeWidth="2"
                    tabIndex={0}
                    aria-label={`${item.label}: ${money(item.revenue)}, ${item.count} orders`}
                    onFocus={() => setFocused(index)}
                    onMouseEnter={() => setFocused(index)}
                    onBlur={() => setFocused(null)}
                    onMouseLeave={() => setFocused(null)}
                  >
                    <title>
                      {item.label}: {money(item.revenue)} · {item.count} orders
                    </title>
                  </circle>
                ))}
                {[0, Math.floor(days / 2), days - 1].map((index) => (
                  <text
                    key={index}
                    x={55 + (index * 620) / (days - 1)}
                    y="230"
                    textAnchor={
                      index === 0
                        ? "start"
                        : index === days - 1
                          ? "end"
                          : "middle"
                    }
                  >
                    {trend[index].label}
                  </text>
                ))}
              </svg>
              <p
                className="text-xs text-admin-muted min-h-5"
                aria-live="polite"
              >
                {focused !== null
                  ? `${trend[focused].label} · ${money(trend[focused].revenue)} · ${trend[focused].count} orders`
                  : "Hover or focus a point for daily details. Dates use your local time."}
              </p>
            </>
          ) : (
            <AdminEmpty
              title="Your sales story starts here"
              description="Order activity will appear once orders are received."
            />
          )}
        </section>
        <section className="admin-card">
          <div className="admin-card-heading">
            <div>
              <h2>Fulfilment overview</h2>
              <p>Status of loaded orders</p>
            </div>
            <ShoppingBag size={19} className="text-admin-muted" />
          </div>
          {statusCounts.map(({ status, count }, index) => (
            <div key={status}>
              <div className="admin-status-row">
                <span>{status}</span>
                <strong className="font-medium tabular-nums">{count}</strong>
              </div>
              <div className="admin-bar">
                <span
                  style={{
                    width: `${orders.length ? (count / orders.length) * 100 : 0}%`,
                    background: series[index],
                  }}
                />
              </div>
            </div>
          ))}
          <div className="mt-7 pt-4 border-t border-admin-border text-xs text-admin-muted">
            Payment collected{" "}
            <strong className="block mt-2 text-xl font-medium text-admin-text">
              {money(
                orders
                  .filter((order) => order.paymentStatus === "Paid")
                  .reduce((sum, order) => sum + order.finalAmount, 0),
              )}
            </strong>
            <small>Paid orders in this snapshot · before refunds</small>
          </div>
        </section>
      </div>
      <div className="admin-chart-grid">
        <section className="admin-card">
          <div className="admin-card-heading">
            <div>
              <h2>Recent orders</h2>
              <p>Latest activity in your store</p>
            </div>
          </div>
          {orders.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-admin-subtle text-admin-muted">
                  <tr>
                    <th>Order / customer</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Fulfilment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong className="font-medium">{order.id}</strong>
                        <span className="block mt-1 text-admin-muted">
                          {order.shippingAddress.fullName}
                        </span>
                      </td>
                      <td>
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </td>
                      <td className="whitespace-nowrap">
                        {money(order.finalAmount)}
                      </td>
                      <td>
                        <span
                          className={`admin-badge ${order.paymentStatus === "Paid" ? "success" : order.paymentStatus === "Failed" ? "danger" : "warning"}`}
                        >
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <span className="admin-badge">{order.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <AdminEmpty title="No orders yet" />
          )}
        </section>
        <section className="admin-card">
          <div className="admin-card-heading">
            <div>
              <h2>Sales by category</h2>
              <p>Item value before discounts and shipping</p>
            </div>
          </div>
          {categorySales.length ? (
            categorySales.map(([name, value], index) => (
              <div key={name}>
                <div className="admin-status-row">
                  <span>{name}</span>
                  <strong className="font-medium">{money(value)}</strong>
                </div>
                <div className="admin-bar">
                  <span
                    style={{
                      width: `${categoryTotal ? (value / categoryTotal) * 100 : 0}%`,
                      background: series[index % series.length],
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <AdminEmpty title="No category sales yet" />
          )}
        </section>
      </div>
      <div className="admin-chart-grid">
        <section className="admin-card">
          <div className="admin-card-heading">
            <div>
              <h2>Top products</h2>
              <p>Ranked by item value in loaded orders</p>
            </div>
          </div>
          {topProducts.length ? (
            <div className="space-y-4">
              {topProducts.map(({ product, units, revenue }, index) => (
                <div key={product.id} className="flex items-center gap-3">
                  <span className="text-xs text-admin-muted w-4">
                    {index + 1}
                  </span>
                  <AdminImage
                    src={product.image}
                    alt={product.title}
                    className="w-12 h-12 rounded-lg object-contain bg-white border border-admin-border p-1"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{product.title}</p>
                    <small>
                      {product.brand} · {units} units
                    </small>
                  </div>
                  <strong className="text-sm font-medium tabular-nums">
                    {money(revenue)}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmpty title="No product sales yet" />
          )}
        </section>
        <section className="admin-card">
          <div className="admin-card-heading">
            <div>
              <h2>Inventory watch</h2>
              <p>Loaded products with 5 units or fewer</p>
            </div>
            <AlertTriangle size={19} className="text-admin-warning" />
          </div>
          {lowStock.length ? (
            <div className="space-y-4">
              {lowStock.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-4 text-xs"
                >
                  <span>{product.title}</span>
                  <span
                    className={`admin-badge ${product.stock === 0 ? "danger" : "warning"}`}
                  >
                    {product.stock} left
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <AdminEmpty
              title="Stock levels look healthy"
              description="No low-stock products in the current snapshot."
            />
          )}
          <div className="mt-6 border-t border-admin-border pt-4">
            <h3 className="text-sm font-medium mb-3">Payment methods</h3>
            <div className="grid grid-cols-2 gap-3">
              {["UPI", "Card", "NetBanking", "COD"].map((method) => (
                <div key={method}>
                  <small>{method}</small>
                  <p className="text-sm tabular-nums mt-1">
                    {money(
                      orders
                        .filter((order) => order.paymentMethod === method)
                        .reduce((sum, order) => sum + order.finalAmount, 0),
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
