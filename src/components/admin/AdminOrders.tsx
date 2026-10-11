"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  FileSpreadsheet,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import type { Order } from "@/lib/types";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
} from "@/lib/admin-orders";
import { dashboardHref } from "@/lib/admin-navigation";
import { AdminEmpty, AdminError, AdminImage } from "./AdminUI";
import { useAdminFeedback } from "./AdminFeedback";
import OrderDetails from "./OrderDetails";

import {
  orderMoney,
  orderDate,
  itemVariants,
  paymentTone,
  fulfilmentTone,
} from "@/lib/order-presentation";
type Snapshot = {
  orders: Order[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  summary: Record<string, number>;
  fetchedAt: string;
  key: string;
};
type Sync = { busy: boolean; error: string; lastSync: string };

export default function AdminOrders({
  refreshKey,
  onSync,
}: {
  refreshKey: number;
  onSync: (state: Sync) => void;
}) {
  const params = useSearchParams();
  const { notify } = useAdminFeedback();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [exporting, setExporting] = useState(false);
  const exportAbort = useRef<AbortController | null>(null);
  useEffect(() => () => exportAbort.current?.abort(), []);
  const [search, setSearch] = useState(params.get("q") || "");
  const orderId = params.get("order") || params.get("orderId");
  const query = new URLSearchParams();
  for (const key of [
    "q",
    "status",
    "paymentStatus",
    "paymentMethod",
    "from",
    "to",
    "page",
    "limit",
  ])
    if (params.get(key)) query.set(key, params.get(key)!);
  const queryString = query.toString();
  const requestKey = `${queryString}:${refreshKey}:${attempt}`;
  const busy = loading || (snapshot?.key !== requestKey && !error);
  const current =
    snapshot?.key === requestKey && !error && !loading ? snapshot : null;
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(window.location.search);
    next.set("tab", "orders");
    next.delete("orderId");
    for (const [key, value] of Object.entries(changes))
      if (value) next.set(key, value);
      else next.delete(key);
    // Next's native history integration updates search params without refetching
    // the server shell. Read the current URL so rapid filter changes compose.
    window.history.pushState(null, "", dashboardHref(next));
  };
  const urlSearch = params.get("q") || "";
  useEffect(() => setSearch(urlSearch), [urlSearch]);
  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    const timer = setTimeout(() => controller.abort(), 18000);
    setLoading(true);
    setError("");
    fetch(`/api/admin/orders?${queryString}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success)
          throw new Error(data.message || "Unable to load orders.");
        return data;
      })
      .then((data) => {
        if (!disposed) setSnapshot({ ...data, key: requestKey });
      })
      .catch((e) => {
        if (!disposed)
          setError(
            controller.signal.aborted
              ? "Orders request timed out. Please retry."
              : e.message,
          );
      })
      .finally(() => {
        clearTimeout(timer);
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [queryString, requestKey]);
  useEffect(() => {
    onSync({ busy: !!busy, error, lastSync: snapshot?.fetchedAt || "" });
  }, [busy, error, snapshot?.fetchedAt, onSync]);
  const setFilter = (key: string, value: string) =>
    update({ [key]: value, page: null });
  const selectedStatus = params.get("status") || "";
  const exportPage = async () => {
    if (!current || exporting) return;
    setExporting(true);
    try {
      const { exportAllOrdersToExcel } = await import("@/lib/exportOrderExcel");
      exportAllOrdersToExcel(
        current.orders,
        `Orders page ${current.page}`,
        `TECHAI-Orders-Page-${current.page}.xlsx`,
      );
    } catch {
      notify("Unable to export this page. Please retry.");
    } finally {
      setExporting(false);
    }
  };
  const exportMatching = async () => {
    if (!current || exporting || exportAbort.current) return;
    const controller = new AbortController();
    exportAbort.current = controller;
    setExporting(true);
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const filters = new URLSearchParams(queryString);
      filters.set("limit", "100");
      filters.set("asOf", new Date().toISOString());
      const all: Order[] = [];
      let expected = -1,
        pages = 1;
      for (let page = 1; page <= pages; page++) {
        filters.set("page", String(page));
        const response = await fetch(`/api/admin/orders?${filters}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        const result = await response.json();
        if (!response.ok || !result.success)
          throw new Error(result.message || "Export failed.");
        if (expected < 0) {
          expected = result.total;
          pages = result.pages;
        }
        if (result.total !== expected)
          throw new Error(
            "Orders changed during export. Please retry for a complete file.",
          );
        all.push(...result.orders);
      }
      if (
        all.length !== expected ||
        new Set(all.map((order) => order.id)).size !== expected
      )
        throw new Error(
          "Orders changed during export. Please retry for a complete file.",
        );
      const { exportAllOrdersToExcel } = await import("@/lib/exportOrderExcel");
      if (!controller.signal.aborted)
        exportAllOrdersToExcel(
          all,
          "Matching orders",
          "TECHAI-Matching-Orders.xlsx",
        );
    } catch (e) {
      if (!controller.signal.aborted)
        notify(e instanceof Error ? e.message : "Export failed.");
      else
        notify(
          "Export cancelled or timed out. Please retry with a narrower date range.",
        );
    } finally {
      clearTimeout(timeout);
      exportAbort.current = null;
      setExporting(false);
    }
  };
  return (
    <section className="admin-orders-workspace" aria-label="Order management">
      <div
        className="admin-order-summary"
        aria-label="Filter orders by fulfilment status"
      >
        {["", ...ORDER_STATUSES].map((status) => (
          <button
            key={status}
            type="button"
            aria-pressed={selectedStatus === status}
            onClick={() => setFilter("status", status)}
          >
            <span>
              {status === "Placed" ? "New / Placed" : status || "All orders"}
            </span>
            <strong>
              {current
                ? (status
                    ? current.summary[status] || 0
                    : Object.values(current.summary).reduce((a, b) => a + b, 0)
                  ).toLocaleString("en-IN")
                : error
                  ? "—"
                  : "…"}
            </strong>
          </button>
        ))}
      </div>
      <p className="admin-order-scope">
        Counts cover every order matching search, payment and date filters,
        across all pages. Select a status to narrow the list.
      </p>
      <div className="admin-order-filters">
        <form
          className="admin-order-search"
          onSubmit={(e) => {
            e.preventDefault();
            setFilter("q", search.trim());
          }}
        >
          <label className="admin-search-field">
            <Search size={16} />
            <input
              aria-label="Search orders"
              placeholder="Order number, customer or phone"
              value={search}
              maxLength={100}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button className="admin-button" type="submit">
            Search
          </button>
        </form>
        <div className="admin-order-filter-grid">
          <label>
            Fulfilment
            <select
              aria-label="Fulfilment"
              value={selectedStatus}
              onChange={(e) => setFilter("status", e.target.value)}
            >
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Payment status
            <select
              aria-label="Payment status"
              value={params.get("paymentStatus") || ""}
              onChange={(e) => setFilter("paymentStatus", e.target.value)}
            >
              <option value="">All payments</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Payment method
            <select
              aria-label="Payment method"
              value={params.get("paymentMethod") || ""}
              onChange={(e) => setFilter("paymentMethod", e.target.value)}
            >
              <option value="">All methods</option>
              {PAYMENT_METHODS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            From date (IST)
            <input
              type="date"
              value={params.get("from") || ""}
              onChange={(e) => setFilter("from", e.target.value)}
            />
          </label>
          <label>
            To date (IST)
            <input
              type="date"
              value={params.get("to") || ""}
              onChange={(e) => setFilter("to", e.target.value)}
            />
          </label>
          <button
            className="admin-button"
            onClick={() => {
              setSearch("");
              update({
                q: null,
                status: null,
                paymentStatus: null,
                paymentMethod: null,
                from: null,
                to: null,
                page: null,
              });
            }}
          >
            Clear filters
          </button>
        </div>
      </div>
      <div className="admin-order-list-toolbar">
        <p>
          {current
            ? `${current.orders.length ? (current.page - 1) * current.limit + 1 : 0}–${current.orders.length ? Math.min(current.page * current.limit, current.total) : 0} of ${current.total.toLocaleString("en-IN")} matching orders`
            : error
              ? "Results unavailable"
              : "Loading orders…"}
          <span>Newest first · Dates in IST</span>
        </p>
        <div className="admin-order-export-actions">
          <button
            className="admin-button"
            disabled={!current?.orders.length || exporting}
            onClick={exportPage}
          >
            <FileSpreadsheet size={16} />
            {exporting
              ? "Exporting…"
              : `Export this page${current ? ` (${current.orders.length})` : ""} · Excel`}
          </button>
          <button
            className="admin-button"
            disabled={!current?.total || exporting}
            onClick={exportMatching}
          >
            Export all matches · Excel
          </button>
        </div>
      </div>
      {error ? (
        <AdminError message={error} retry={() => setAttempt((n) => n + 1)} />
      ) : !current ? (
        <div
          className="admin-orders-loading"
          role="status"
          aria-label="Loading orders"
        >
          {[1, 2, 3].map((i) => (
            <div key={i} className="admin-skeleton" />
          ))}
        </div>
      ) : current.orders.length === 0 ? (
        <AdminEmpty
          title={queryString ? "No matching orders" : "No orders yet"}
          description={
            current.total > 0
              ? "This page is empty. Choose Previous or clear filters."
              : "Try a different search or clear filters. New purchases will appear here."
          }
        />
      ) : (
        <div className="admin-orders-table-wrap">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Order / placed</th>
                <th>Customer / delivery</th>
                <th>Purchased items</th>
                <th>Total / payment</th>
                <th>Fulfilment</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {current.orders.map((order) => {
                const first = order.items[0];
                const awaiting =
                  order.status === "Placed" ||
                  order.status === "Processing" ||
                  order.paymentStatus === "Failed" ||
                  (order.paymentStatus === "Pending" &&
                    order.paymentMethod !== "COD");
                return (
                  <tr
                    key={order.id}
                    className={awaiting ? "awaiting-action" : ""}
                  >
                    <td data-label="Order">
                      <button
                        className="admin-order-number"
                        onClick={() => update({ order: order.id })}
                      >
                        {order.id}
                      </button>
                      <small>{orderDate(order.createdAt)}</small>
                      {awaiting && (
                        <span className="admin-order-attention">
                          <AlertCircle size={12} />
                          Awaiting action
                        </span>
                      )}
                    </td>
                    <td data-label="Customer">
                      <strong>{order.shippingAddress.fullName}</strong>
                      <small>
                        {order.shippingAddress.phone || "No phone recorded"}
                      </small>
                      <small>
                        {[
                          order.shippingAddress.city,
                          order.shippingAddress.state,
                          order.shippingAddress.pincode,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </small>
                    </td>
                    <td data-label="Items">
                      {first ? (
                        <div className="admin-order-product">
                          <AdminImage
                            src={first.product.image}
                            alt={first.product.title}
                          />
                          <div>
                            <span>{first.product.title}</span>
                            <small>
                              Qty {first.quantity}
                              {itemVariants(first) &&
                                ` · ${itemVariants(first)}`}
                            </small>
                            {order.items.length > 1 && (
                              <button
                                onClick={() => update({ order: order.id })}
                              >
                                +{order.items.length - 1} more · View all items
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span>No item snapshot recorded</span>
                      )}
                    </td>
                    <td data-label="Payment">
                      <strong className="admin-order-amount">
                        {orderMoney(order.finalAmount)}
                      </strong>
                      <small>{order.paymentMethod}</small>
                      <span
                        className={`admin-badge ${paymentTone(order.paymentStatus)}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td data-label="Fulfilment">
                      <span
                        className={`admin-badge ${fulfilmentTone(order.status)}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin-button"
                        aria-label={`View details for ${order.id}`}
                        onClick={() => update({ order: order.id })}
                      >
                        View details <ArrowUpRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="admin-list-pagination">
        <label className="admin-order-page-size">
          Orders per page
          <select
            value={params.get("limit") || "20"}
            onChange={(e) => update({ limit: e.target.value, page: null })}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <div>
          <button
            className="admin-button"
            disabled={!current || current.page <= 1}
            onClick={() => update({ page: String(current!.page - 1) })}
          >
            Previous
          </button>
          <span>
            {current
              ? `Page ${current.page} of ${current.pages}`
              : "Page unavailable"}
          </span>
          <button
            className="admin-button"
            disabled={!current || current.page >= current.pages}
            onClick={() => update({ page: String(current!.page + 1) })}
          >
            Next
          </button>
        </div>
      </div>
      <p className="admin-order-scope">
        Choose the visible page or all orders matching the current filters. Open
        an order for its PDF invoice or individual Excel download.
      </p>
      {orderId && (
        <OrderDetails
          key={orderId}
          orderId={orderId}
          onClose={() => update({ order: null })}
          onUpdated={() => setAttempt((n) => n + 1)}
        />
      )}
    </section>
  );
}
