"use client";

import React, { useMemo, useState } from "react";
import { AlertCircle, Check, Clock3, ExternalLink, Loader2, RotateCcw, X } from "lucide-react";
import { Order, Product, Refund, RefundReason, RefundStatus } from "@/lib/types";

const REASONS: RefundReason[] = ["Damaged", "Defective", "Wrong product", "Product not as described", "Missing items", "Other"];
const ACTIVE_STATUSES: RefundStatus[] = ["REQUESTED", "UNDER_REVIEW", "APPROVED", "REFUND_PROCESSING"];
const STATUS_LABELS: Record<RefundStatus, string> = {
  REQUESTED: "Requested",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  REFUND_PROCESSING: "Refund processing",
  REFUNDED: "Refunded",
  FAILED: "Refund failed",
  CANCELLED: "Cancelled",
};

const money = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;

function getDeliveryDate(order: Order) {
  const entry = [...(order.statusHistory || [])].reverse().find((item) => item.status === "Delivered");
  if (!entry) return null;
  const date = new Date(entry.timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function RefundStatusCard({ refund, onCancel }: { refund: Refund; onCancel: (refund: Refund) => void }) {
  const isActive = ACTIVE_STATUSES.includes(refund.status);
  return (
    <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-3.5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-cyan-700">Refund request · {refund.id}</p>
          <p className="mt-1 text-xs font-extrabold text-slate-900">{STATUS_LABELS[refund.status]} · {money(refund.approvedAmountPaise || refund.requestedAmountPaise)}</p>
        </div>
        {refund.status === "REQUESTED" && (
          <button type="button" onClick={() => onCancel(refund)} className="rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[10px] font-extrabold text-rose-700 hover:bg-rose-50">
            Cancel request
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-600">
        <span>Reason: <b>{refund.reason}</b></span>
        <span>Requested: <b>{new Date(refund.createdAt).toLocaleDateString("en-IN")}</b></span>
        {refund.razorpayRefundId && <span>Gateway ID: <b>{refund.razorpayRefundId}</b></span>}
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        {refund.history.map((event, index) => (
          <div key={`${event.timestamp}-${index}`} className="flex items-center gap-2 text-[10px] text-slate-600">
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${index === refund.history.length - 1 ? "bg-cyan-600 text-white" : "bg-white text-cyan-700 border border-cyan-200"}`}>
              {index === refund.history.length - 1 ? <Clock3 className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            </span>
            <span><b className="block text-slate-800">{STATUS_LABELS[event.status]}</b>{new Date(event.timestamp).toLocaleDateString("en-IN")}</span>
          </div>
        ))}
      </div>
      {refund.adminRemarks && <p className="rounded-xl border border-white bg-white/70 px-3 py-2 text-[11px] text-slate-700"><b>Store note:</b> {refund.adminRemarks}</p>}
      {refund.failureReason && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] text-rose-800"><b>Action needed:</b> {refund.failureReason}</p>}
      {refund.status === "REFUNDED" && refund.processedAt && <p className="text-[10px] font-bold text-emerald-700">Completed {new Date(refund.processedAt).toLocaleString("en-IN")}</p>}
      {isActive && <p className="text-[10px] text-slate-500">Your refund is not marked complete until Razorpay confirms it.</p>}
    </div>
  );
}

export default function RefundRequestModal({
  order,
  existingRefunds,
  onClose,
  onCreated,
}: {
  order: Order | null;
  existingRefunds: Refund[];
  onClose: () => void;
  onCreated: (refund: Refund) => void;
}) {
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [reason, setReason] = useState<RefundReason>("Damaged");
  const [description, setDescription] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const activeProductIds = useMemo(() => new Set(existingRefunds.filter((refund) => ACTIVE_STATUSES.includes(refund.status)).flatMap((refund) => refund.items.map((item) => item.productId))), [existingRefunds]);
  if (!order) return null;

  const deliveryDate = getDeliveryDate(order);
  const deadline = deliveryDate ? new Date(deliveryDate.getTime() + 7 * 24 * 60 * 60 * 1000) : null;
  const itemBase = order.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountRatio = itemBase > 0 ? Math.min(1, order.discountAmount / itemBase) : 0;
  const estimatedPaise = Object.entries(selected).reduce((sum, [productId, quantity]) => {
    const item = order.items.find((line) => line.product.id === productId);
    return sum + Math.floor((item?.product.price || 0) * quantity * (1 - discountRatio) * 100);
  }, 0);

  const toggleItem = (product: Product) => {
    setSelected((current) => {
      const next = { ...current };
      if (next[product.id]) delete next[product.id];
      else next[product.id] = 1;
      return next;
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!Object.keys(selected).length) return setError("Select at least one product.");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          items: Object.entries(selected).map(([productId, quantity]) => ({ productId, quantity })),
          reason,
          description,
          evidenceUrls: evidenceUrl ? [evidenceUrl.trim()] : [],
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Could not submit the request.");
      onCreated(data.refund);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not submit the request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label="Request refund">
      <form onSubmit={submit} className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="mx-5 mt-5 flex items-start justify-between gap-4 border-b border-slate-100 pb-4 sm:mx-6 sm:mt-6">
          <div><p className="text-[10px] font-black uppercase tracking-wider text-cyan-700">Order #{order.id}</p><h2 className="mt-1 text-xl font-black text-slate-950">Refund / return request</h2><p className="mt-1 text-xs text-slate-500">Eligible until {deadline ? deadline.toLocaleDateString("en-IN") : "the delivery date is confirmed"}.</p></div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-5 text-amber-900"><b>Policy:</b> requests are accepted within 7 days of successful delivery. Shipping charges are not refundable. Approved amounts are processed through the original captured Razorpay payment.</div>
          <fieldset className="space-y-2"><legend className="text-xs font-black text-slate-900">Select product and quantity</legend>
            {order.items.map((item) => {
              const isUnavailable = activeProductIds.has(item.product.id);
              return <label key={item.product.id} className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${isUnavailable ? "border-slate-100 bg-slate-50 opacity-60" : "border-slate-200 hover:border-cyan-300"}`}>
                <span className="flex min-w-0 items-center gap-2"><input type="checkbox" disabled={isUnavailable} checked={Boolean(selected[item.product.id])} onChange={() => toggleItem(item.product)} className="h-4 w-4 rounded border-slate-300 text-cyan-600" /><span className="truncate text-xs font-bold text-slate-800">{item.product.title}<small className="ml-1 font-medium text-slate-500">× {item.quantity}{isUnavailable ? " · request active" : ""}</small></span></span>
                {selected[item.product.id] && <select value={selected[item.product.id]} onChange={(event) => setSelected((current) => ({ ...current, [item.product.id]: Number(event.target.value) }))} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700">{Array.from({ length: item.quantity }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select>}
              </label>;
            })}
          </fieldset>
          <label className="block space-y-1 text-xs font-bold text-slate-700">Reason<select value={reason} onChange={(event) => setReason(event.target.value as RefundReason)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-medium outline-none focus:border-cyan-500">{REASONS.map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="block space-y-1 text-xs font-bold text-slate-700">Description <span className="font-normal text-slate-400">(optional)</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={1200} rows={3} placeholder="Tell us what happened..." className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium outline-none focus:border-cyan-500" /></label>
          <label className="block space-y-1 text-xs font-bold text-slate-700">Evidence link <span className="font-normal text-slate-400">(optional HTTPS image URL)</span><input value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} type="url" placeholder="https://..." className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium outline-none focus:border-cyan-500" /></label>
          <div className="flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-white"><span className="text-xs font-bold text-slate-300">Estimated refund</span><span className="text-lg font-black text-emerald-300">{money(estimatedPaise)}</span></div>
        </div>
        <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-3 sm:px-6">
          {error && <p role="alert" className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</p>}
          <div className={`flex flex-col-reverse gap-2 sm:flex-row sm:justify-end ${error ? "mt-3" : ""}`}><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50">Not now</button><button type="submit" disabled={isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-cyan-700 disabled:opacity-60">{isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4 text-cyan-300" />}Submit request</button></div>
        </div>
      </form>
    </div>
  );
}
