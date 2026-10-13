"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, Copy, FileText, FileSpreadsheet } from "lucide-react";
import type { Order, Refund, OrderStatus } from "@/lib/types";
import { ORDER_STATUSES } from "@/lib/admin-orders";
import {
  orderMoney,
  orderDate,
  itemVariants,
  paymentTone,
  fulfilmentTone,
} from "@/lib/order-presentation";
import { AdminModal, AdminError, AdminImage } from "./AdminUI";
import { useAdminFeedback } from "./AdminFeedback";

export default function OrderDetails({
  orderId,
  onClose,
  onUpdated,
}: {
  orderId: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [data, setData] = useState<{
    order: Order;
    refunds: Refund[];
    moreRefunds: boolean;
  } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState("");
  const pending = useRef(false);
  const [form, setForm] = useState({
    status: "Placed" as OrderStatus,
    courierName: "",
    trackingNumber: "",
    note: "",
  });
  const { notify, confirm } = useAdminFeedback();
  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    const timeout = setTimeout(() => controller.abort(), 18000);
    setLoading(true);
    setError("");
    fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (res) => {
        const result = await res.json();
        if (!res.ok || !result.success)
          throw new Error(result.message || "Unable to load order.");
        return result;
      })
      .then((result) => {
        if (!disposed) {
          setData(result);
          setForm({
            status: result.order.status,
            courierName: result.order.courierName,
            trackingNumber: result.order.trackingNumber,
            note: "",
          });
        }
      })
      .catch((e) => {
        if (!disposed)
          setError(
            controller.signal.aborted
              ? "Order details timed out. Please retry."
              : e.message,
          );
      })
      .finally(() => {
        clearTimeout(timeout);
        if (!disposed) setLoading(false);
      });
    return () => {
      disposed = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [orderId, attempt]);
  const order = data?.order;
  const address = order?.shippingAddress;
  const addressText = address
    ? [
        address.fullName,
        address.houseNumber,
        address.street,
        address.landmark,
        [address.city, address.state, address.pincode]
          .filter(Boolean)
          .join(", "),
        address.phone,
        address.deliveryInstructions,
      ]
        .filter(Boolean)
        .join("\n")
    : "";
  const changed =
    !!order &&
    (form.status !== order.status ||
      form.courierName !== order.courierName ||
      form.trackingNumber !== order.trackingNumber ||
      !!form.note.trim());
  const save = async () => {
    if (!order || !changed || pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      if (
        !(await confirm(
          `Update ${order.id}${form.status !== order.status ? ` to ${form.status}` : " delivery details"}? This will be recorded in its status history.`,
        ))
      )
        return;
      const response = await fetch(
        `/api/orders/${encodeURIComponent(order.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: form.status,
            courierName: form.courierName,
            trackingNumber: form.trackingNumber,
            note: form.note.trim() || undefined,
          }),
        },
      );
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.message || "Order update failed.");
      notify("Order status updated.", "success");
      onUpdated();
      setAttempt((n) => n + 1);
    } catch (e) {
      notify(
        e instanceof Error ? e.message : "The action failed. Please retry.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const download = async (type: "pdf" | "excel") => {
    if (!order || downloading) return;
    setDownloading(type);
    try {
      if (type === "pdf")
        await (
          await import("@/lib/generateInvoice")
        ).generateOrderInvoice(order);
      else
        (await import("@/lib/exportOrderExcel")).exportSingleOrderToExcel(
          order,
        );
    } catch {
      notify("Download failed. Please retry.");
    } finally {
      setDownloading("");
    }
  };
  return (
    <AdminModal
      label="Order details"
      onClose={() => {
        if (!pending.current) onClose();
      }}
    >
      <div className="admin-detail-dialog admin-order-detail">
        <header className="admin-detail-heading">
          <div>
            <p className="admin-eyebrow">Order details</p>
            <h2>{orderId}</h2>
            {order && (
              <p className="text-xs text-admin-muted mt-1">
                Placed {orderDate(order.createdAt)} IST
              </p>
            )}
          </div>
          <button
            className="admin-icon-button"
            aria-label="Close order details"
            disabled={busy}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div className="admin-detail-scroll">
          {error ? (
            <AdminError
              message={error}
              retry={() => setAttempt((n) => n + 1)}
              busy={loading}
            />
          ) : loading ? (
            <div className="admin-orders-loading" role="status">
              Loading order details…
              <div className="admin-skeleton" />
            </div>
          ) : (
            order && (
              <>
                <div className="admin-order-detail-status">
                  <div>
                    <span>Fulfilment</span>
                    <strong
                      className={`admin-badge ${fulfilmentTone(order.status)}`}
                    >
                      {order.status}
                    </strong>
                  </div>
                  <div>
                    <span>Payment · {order.paymentMethod}</span>
                    <strong
                      className={`admin-badge ${paymentTone(order.paymentStatus)}`}
                    >
                      {order.paymentStatus}
                    </strong>
                  </div>
                  <div>
                    <span>Order total</span>
                    <strong>{orderMoney(order.finalAmount)}</strong>
                  </div>
                </div>
                <div className="admin-order-detail-columns">
                  <section>
                    <h3>Customer & delivery</h3>
                    <p>
                      <strong>{address?.fullName}</strong>
                    </p>
                    {address?.phone && (
                      <p>
                        <a href={`tel:${address.phone}`}>{address.phone}</a>
                      </p>
                    )}
                    {address?.email && (
                      <p>
                        <a href={`mailto:${address.email}`}>{address.email}</a>
                      </p>
                    )}
                    <address>
                      {[
                        address?.houseNumber,
                        address?.street,
                        address?.landmark,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                      <br />
                      {[address?.city, address?.state, address?.pincode]
                        .filter(Boolean)
                        .join(", ")}
                    </address>
                    {address?.deliveryInstructions && (
                      <p>Delivery note: {address.deliveryInstructions}</p>
                    )}
                    <button
                      className="admin-button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(addressText);
                          notify("Shipping address copied.", "success");
                        } catch {
                          notify(
                            "Could not copy. Please select the address text instead.",
                          );
                        }
                      }}
                    >
                      <Copy size={14} /> Copy address
                    </button>
                  </section>
                  <section>
                    <h3>Payment details</h3>
                    <dl>
                      <div>
                        <dt>Method</dt>
                        <dd>{order.paymentMethod}</dd>
                      </div>
                      <div>
                        <dt>Payment state</dt>
                        <dd>{order.paymentStatus}</dd>
                      </div>
                      {order.paymentDetails?.gatewayStatus && (
                        <div>
                          <dt>Gateway state</dt>
                          <dd>{order.paymentDetails.gatewayStatus}</dd>
                        </div>
                      )}
                      <div>
                        <dt>Transaction reference</dt>
                        <dd className="font-mono">
                          {order.razorpayPaymentId ||
                            order.paymentDetails?.transactionId ||
                            "Not recorded"}
                        </dd>
                      </div>
                      {order.razorpayOrderId && (
                        <div>
                          <dt>Gateway order</dt>
                          <dd className="font-mono">{order.razorpayOrderId}</dd>
                        </div>
                      )}
                      {order.paymentDetails?.paymentNote && (
                        <div>
                          <dt>Payment note</dt>
                          <dd>{order.paymentDetails.paymentNote}</dd>
                        </div>
                      )}
                    </dl>
                    <p className="admin-order-scope">
                      {order.paymentMethod === "COD"
                        ? "Cash on delivery. Opening this order does not record collection."
                        : "Online payment status is controlled by verified payment events."}
                    </p>
                  </section>
                </div>
                <section className="admin-order-detail-items">
                  <h3>Purchased items ({order.items.length})</h3>
                  <p className="admin-order-scope">
                    Saved at purchase time. Catalog changes do not alter these
                    prices.
                  </p>
                  {order.items.map((item, index) => (
                    <article key={index}>
                      <AdminImage
                        src={item.product.image}
                        alt={item.product.title}
                      />
                      <div>
                        <strong>{item.product.title}</strong>
                        {itemVariants(item) && <p>{itemVariants(item)}</p>}
                        <p>
                          {orderMoney(item.product.price)} each ×{" "}
                          {item.quantity}
                        </p>
                      </div>
                      <strong>
                        {orderMoney(item.product.price * item.quantity)}
                      </strong>
                    </article>
                  ))}
                </section>
                <div className="admin-order-detail-columns">
                  <section>
                    <h3>Courier & tracking</h3>
                    <dl>
                      <div>
                        <dt>Courier</dt>
                        <dd>{order.courierName || "Not assigned"}</dd>
                      </div>
                      <div>
                        <dt>Tracking number</dt>
                        <dd>{order.trackingNumber || "Not assigned"}</dd>
                      </div>
                      {order.estimatedDelivery && (
                        <div>
                          <dt>Estimated delivery</dt>
                          <dd>{order.estimatedDelivery}</dd>
                        </div>
                      )}
                    </dl>
                  </section>
                  <section>
                    <h3>Order totals</h3>
                    <dl>
                      <div>
                        <dt>Subtotal</dt>
                        <dd>{orderMoney(order.totalAmount)}</dd>
                      </div>
                      <div>
                        <dt>
                          Discount
                          {order.discountCode ? ` (${order.discountCode})` : ""}
                        </dt>
                        <dd>−{orderMoney(order.discountAmount)}</dd>
                      </div>
                      <div>
                        <dt>Shipping</dt>
                        <dd>{orderMoney(order.shippingFee)}</dd>
                      </div>
                      {order.taxAmount !== undefined && (
                        <div>
                          <dt>GST included in final total</dt>
                          <dd>{orderMoney(order.taxAmount)}</dd>
                        </div>
                      )}
                      <div className="admin-order-final-total">
                        <dt>Final total</dt>
                        <dd>{orderMoney(order.finalAmount)}</dd>
                      </div>
                    </dl>
                  </section>
                </div>
                <section className="admin-order-timeline">
                  <h3>Status timeline</h3>
                  {order.statusHistory.length ? (
                    <ol>
                      {order.statusHistory.map((event, i) => (
                        <li key={i}>
                          <span className="admin-timeline-dot" />
                          <div>
                            <strong>{event.status}</strong>
                            <time>{orderDate(event.timestamp)} IST</time>
                            <p>{event.note}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-admin-muted">
                      No status history recorded.
                    </p>
                  )}
                </section>
                <section className="admin-order-refund-info">
                  {order.invoiceNumber && (order.refundedAmountPaise || 0) > 0 && <p role="status">Invoice {order.invoiceNumber} is preserved. Accountant review and a linked credit note are required; a payment refund does not amend GST documents.</p>}
                  <h3>Refunds</h3>
                  <p>
                    Refund state:{" "}
                    {(order.refundStatus || "NONE").replaceAll("_", " ")} ·
                    Refunded:{" "}
                    {orderMoney((order.refundedAmountPaise || 0) / 100)}
                  </p>
                  {data?.refunds.map((refund) => (
                    <div key={refund.id}>
                      <strong>
                        {refund.id} · {refund.status.replaceAll("_", " ")}
                      </strong>
                      <p>
                        {refund.reason} · Requested{" "}
                        {orderMoney(refund.requestedAmountPaise / 100)}
                      </p>
                      {refund.adminRemarks && <p>{refund.adminRemarks}</p>}
                      {refund.failureReason && <p>{refund.failureReason}</p>}
                    </div>
                  ))}
                  {!data?.refunds.length && <p>No refund requests recorded.</p>}
                  {data?.moreRefunds && (
                    <p>
                      Showing the latest 50 requests. View the Refunds module
                      for more.
                    </p>
                  )}
                  <Link
                    className="admin-button"
                    href={`/admin/dashboard?tab=refunds&refundOrder=${encodeURIComponent(order.id)}`}
                  >
                    Manage refunds for this order
                  </Link>
                </section>
                <form
                  className="admin-order-update"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void save();
                  }}
                >
                  <h3>Update fulfilment</h3>
                  <fieldset disabled={busy}>
                    <label>
                      Fulfilment status
                      <select
                        aria-label="Fulfilment status"
                        value={form.status}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            status: e.target.value as OrderStatus,
                          })
                        }
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Courier
                      <input
                        maxLength={150}
                        value={form.courierName}
                        onChange={(e) =>
                          setForm({ ...form, courierName: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Tracking number
                      <input
                        maxLength={150}
                        value={form.trackingNumber}
                        onChange={(e) =>
                          setForm({ ...form, trackingNumber: e.target.value })
                        }
                      />
                    </label>
                    <label className="col-span-full">
                      Status note
                      <input
                        maxLength={500}
                        value={form.note}
                        onChange={(e) =>
                          setForm({ ...form, note: e.target.value })
                        }
                        placeholder="Optional fulfilment update note"
                      />
                    </label>
                  </fieldset>
                  <button
                    className="admin-button admin-primary"
                    disabled={busy || !changed}
                  >
                    {busy ? "Update pending…" : "Save fulfilment update"}
                  </button>
                </form>
              </>
            )
          )}
        </div>
        <footer className="admin-order-detail-footer">
          <span>Downloads include this order only.</span>
          <div>
            {order && <a className="admin-button" href={`/api/orders/${encodeURIComponent(order.id)}/invoice`} target="_blank" rel="noreferrer">View / Print invoice</a>}
            <button
              className="admin-button"
              disabled={!order || loading || !!error || !!downloading}
              onClick={() => void download("pdf")}
            >
              <FileText size={15} />
              {downloading === "pdf" ? "Preparing…" : "PDF invoice"}
            </button>
            <button
              className="admin-button"
              disabled={!order || loading || !!error || !!downloading}
              onClick={() => void download("excel")}
            >
              <FileSpreadsheet size={15} />
              {downloading === "excel" ? "Preparing…" : "Order Excel"}
            </button>
          </div>
        </footer>
      </div>
    </AdminModal>
  );
}
