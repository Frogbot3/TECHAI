"use client";
import { useEffect, useState } from "react";
import { X, Download, MapPin, Mail, Phone, UserRound } from "lucide-react";
import { AdminModal, AdminError, AdminLoading, AdminEmpty } from "./AdminUI";
import type { User, Order } from "@/lib/types";
import { generateOrderInvoice } from "@/lib/generateInvoice";
import { useAdminFeedback } from "./AdminFeedback";

type Detail = {
  customer: User & { createdAt?: string; lastLoginAt?: string };
  orders: Order[];
  totals: {
    totalOrders: number;
    paidAmount: number;
    refundedAmount: number;
    deliveredOrders: number;
  };
  pages: number;
};
const money = (n: number) =>
  `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const date = (s?: string) =>
  s
    ? new Date(s).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not recorded";

export default function CustomerDetails({
  customerId,
  onClose,
}: {
  customerId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<Detail | null>(null);
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const { notify } = useAdminFeedback();
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError("");
    fetch(
      `/api/admin/customers/${encodeURIComponent(customerId)}?page=${page}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (res) => {
        const result = await res.json();
        if (!res.ok || !result.success)
          throw new Error(result.message || "Unable to load customer.");
        return result;
      })
      .then(setData)
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [customerId, page, attempt]);
  return (
    <AdminModal label="Customer details" onClose={onClose}>
      <div className="admin-detail-dialog">
        <header className="admin-detail-heading">
          <div>
            <p className="admin-eyebrow">Customer profile</p>
            <h2>{data?.customer.name || "Customer details"}</h2>
          </div>
          <button
            className="admin-icon-button"
            aria-label="Close customer details"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div className="admin-detail-scroll">
          {error && (
            <AdminError
              message={error}
              retry={() => setAttempt((a) => a + 1)}
              busy={busy}
            />
          )}
          {busy ? (
            <AdminLoading />
          ) : (
            data &&
            !error && (
              <>
                <div className="admin-customer-profile">
                  <span className="admin-customer-avatar">
                    <UserRound size={28} />
                  </span>
                  <div>
                    <h3>{data.customer.name}</h3>
                    <p>
                      <Mail size={14} />{" "}
                      {data.customer.email || "No email saved"}
                    </p>
                    <p>
                      <Phone size={14} />{" "}
                      {data.customer.phone || "No phone saved"}
                    </p>
                  </div>
                  <div className="admin-customer-dates">
                    <p>
                      Joined <strong>{date(data.customer.createdAt)}</strong>
                    </p>
                    <p>
                      Last sign-in{" "}
                      <strong>{date(data.customer.lastLoginAt)}</strong>
                    </p>
                  </div>
                </div>
                <div className="admin-customer-metrics">
                  {[
                    ["Orders", data.totals.totalOrders],
                    ["Paid amount", money(data.totals.paidAmount)],
                    ["Refunded", money(data.totals.refundedAmount / 100)],
                    ["Delivered", data.totals.deliveredOrders],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
                <section>
                  <h3 className="admin-detail-section-title">
                    Saved addresses
                  </h3>
                  <div className="admin-addresses">
                    {data.customer.addresses?.length ? (
                      data.customer.addresses.map((address, i) => (
                        <address key={i}>
                          <MapPin size={16} />
                          <div>
                            <strong>{address.fullName}</strong>
                            <p>{address.street}</p>
                            <p>
                              {address.city}, {address.state} –{" "}
                              {address.pincode}
                            </p>
                            {address.landmark && <p>{address.landmark}</p>}
                            <p>{address.phone}</p>
                          </div>
                        </address>
                      ))
                    ) : (
                      <p className="text-sm text-admin-muted">
                        No saved addresses. Delivery addresses appear in each
                        order below.
                      </p>
                    )}
                  </div>
                </section>
                <section>
                  <h3 className="admin-detail-section-title">
                    Order history{" "}
                    <span className="text-admin-muted">
                      ({data.totals.totalOrders})
                    </span>
                  </h3>
                  <p className="text-xs text-admin-muted mb-4">
                    Orders linked to this customer account. Paid amount is
                    before refunds.
                  </p>
                  {data.orders.length ? (
                    <div className="admin-customer-orders">
                      {data.orders.map((order) => (
                        <article key={order.id}>
                          <header>
                            <div>
                              <strong>{order.id}</strong>
                              <p>
                                {date(order.createdAt)} · {order.paymentMethod}
                              </p>
                            </div>
                            <span
                              className={`admin-badge ${order.status === "Delivered" ? "success" : "info"}`}
                            >
                              {order.status}
                            </span>
                          </header>
                          <ul>
                            {order.items.map((item, i) => (
                              <li key={i}>
                                <span>
                                  {item.product.title}{" "}
                                  <small>× {item.quantity}</small>
                                </span>
                                <strong>
                                  {money(item.product.price * item.quantity)}
                                </strong>
                              </li>
                            ))}
                          </ul>
                          <p className="text-xs text-admin-muted">
                            Deliver to:{" "}
                            {[
                              order.shippingAddress.fullName,
                              order.shippingAddress.street,
                              order.shippingAddress.city,
                              order.shippingAddress.state,
                              order.shippingAddress.pincode,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                          <footer>
                            <span>
                              {order.paymentStatus} ·{" "}
                              <strong>{money(order.finalAmount)}</strong>
                            </span>
                            <button
                              className="admin-button"
                              onClick={async () => {
                                try {
                                  await generateOrderInvoice(order);
                                } catch {
                                  notify(
                                    "Unable to download invoice. Please retry.",
                                  );
                                }
                              }}
                            >
                              <Download size={14} /> Invoice
                            </button>
                          </footer>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <AdminEmpty
                      title="No orders yet"
                      description="Orders placed with this account will appear here."
                    />
                  )}
                  <div className="admin-list-pagination">
                    <span>
                      Page {page} of {data.pages}
                    </span>
                    <div>
                      <button
                        className="admin-button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Previous
                      </button>
                      <button
                        className="admin-button"
                        disabled={page >= data.pages}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </section>
              </>
            )
          )}
        </div>
      </div>
    </AdminModal>
  );
}
