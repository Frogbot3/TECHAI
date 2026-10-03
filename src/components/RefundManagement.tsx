"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Eye, ExternalLink, FileText, Loader2, RefreshCw, RotateCcw, Search, ShieldCheck, XCircle } from "lucide-react";
import { Refund, RefundStatus } from "@/lib/types";

const STATUS_OPTIONS: ("ALL" | RefundStatus)[] = ["ALL", "REQUESTED", "UNDER_REVIEW", "APPROVED", "REFUND_PROCESSING", "REFUNDED", "REJECTED", "FAILED", "CANCELLED"];
const money = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
const statusLabel = (status: RefundStatus) => status.replaceAll("_", " ");
const statusClass = (status: RefundStatus) => ({
  REQUESTED: "bg-amber-950 text-amber-300 border-amber-800",
  UNDER_REVIEW: "bg-cyan-950 text-cyan-300 border-cyan-800",
  APPROVED: "bg-blue-950 text-blue-300 border-blue-800",
  REFUND_PROCESSING: "bg-purple-950 text-purple-300 border-purple-800",
  REFUNDED: "bg-emerald-950 text-emerald-300 border-emerald-800",
  REJECTED: "bg-rose-950 text-rose-300 border-rose-800",
  FAILED: "bg-red-950 text-red-300 border-red-800",
  CANCELLED: "bg-slate-800 text-slate-300 border-slate-700",
}[status]);

export default function RefundManagement() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<"ALL" | RefundStatus>("ALL");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [approvalAmount, setApprovalAmount] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [adminRemarks, setAdminRemarks] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");

  const selected = useMemo(() => refunds.find((refund) => refund.id === selectedId) || null, [refunds, selectedId]);

  const loadRefunds = useCallback(async (overrideSearch?: string) => {
    setIsLoading(true);
    setError("");
    try {
      const searchValue = overrideSearch !== undefined ? overrideSearch : search;
      const params = new URLSearchParams({ status, sort });
      if (searchValue.trim()) params.set("search", searchValue.trim());
      const response = await fetch(`/api/admin/refunds?${params.toString()}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Could not load refunds.");
      setRefunds(data.refunds || []);
      setCounts(data.counts || {});
      setSelectedId((current) => current && (data.refunds || []).some((refund: Refund) => refund.id === current) ? current : data.refunds?.[0]?.id || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load refunds.");
    } finally {
      setIsLoading(false);
    }
  }, [status, sort, search]);

  useEffect(() => { loadRefunds(); }, [status, sort]);
  useEffect(() => {
    const timer = window.setTimeout(() => { loadRefunds(search); }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    if (!selected) return;
    setApprovalAmount(String((selected.approvedAmountPaise || selected.requestedAmountPaise) / 100));
    setInternalNotes(selected.internalNotes || "");
    setAdminRemarks(selected.adminRemarks || "");
  }, [selected?.id]);

  const applyRefund = (updated: Refund) => {
    setRefunds((current) => current.map((refund) => refund.id === updated.id ? updated : refund));
    setSelectedId(updated.id);
  };

  const callAction = async (key: string, url: string, options: RequestInit = {}) => {
    setBusyAction(key);
    setError("");
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Refund action failed.");
      if (data.refund) applyRefund(data.refund);
      else await loadRefunds();
      return true;
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Refund action failed.");
      return false;
    } finally {
      setBusyAction("");
    }
  };

  const saveNotes = () => selected && callAction("notes", `/api/admin/refunds/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "notes", internalNotes, adminRemarks }) });
  const approve = async () => {
    if (!selected) return;
    const amountPaise = Math.round(Number(approvalAmount) * 100);
    if (!Number.isInteger(amountPaise) || amountPaise <= 0) return setError("Enter a valid approved amount.");
    if (!window.confirm(`Start a Razorpay refund for ${money(amountPaise)}? This cannot be undone.`)) return;
    await callAction("approve", `/api/admin/refunds/${selected.id}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approvedAmountPaise: amountPaise }) });
  };
  const reject = async () => {
    if (!selected || !rejectionReason.trim()) return setError("A rejection reason is required.");
    if (!window.confirm("Reject this refund request?")) return;
    const completed = await callAction("reject", `/api/admin/refunds/${selected.id}/reject`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: rejectionReason }) });
    if (completed) setRejectionReason("");
  };

  const totalPending = (counts.REQUESTED || 0) + (counts.UNDER_REVIEW || 0);
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[{ label: "Pending", value: totalPending, tone: "text-amber-300" }, { label: "Processing", value: counts.REFUND_PROCESSING || 0, tone: "text-purple-300" }, { label: "Completed", value: counts.REFUNDED || 0, tone: "text-emerald-300" }, { label: "Failed", value: counts.FAILED || 0, tone: "text-rose-300" }].map((card) => <div key={card.label} className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{card.label}</p><p className={`mt-1 text-xl font-black ${card.tone}`}>{card.value}</p></div>)}
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 sm:flex-row">
        <label className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search refund, order, or customer..." className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-cyan-500" /></label>
        <select value={status} onChange={(event) => setStatus(event.target.value as "ALL" | RefundStatus)} className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200"><option value="ALL">All statuses</option>{STATUS_OPTIONS.slice(1).map((option) => <option key={option} value={option}>{statusLabel(option as RefundStatus)}</option>)}</select>
        <select value={sort} onChange={(event) => setSort(event.target.value as "newest" | "oldest")} className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>
        <button type="button" onClick={() => loadRefunds()} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-extrabold text-cyan-300 hover:bg-slate-700"><RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />Refresh</button>
      </div>
      {error && <p role="alert" className="rounded-xl border border-rose-800 bg-rose-950/40 px-3 py-2 text-xs font-bold text-rose-300">{error}</p>}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.75fr)]">
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/70">
          {isLoading ? <div className="flex items-center justify-center gap-2 py-16 text-xs text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading refunds...</div> : refunds.length === 0 ? <div className="py-16 text-center text-xs text-slate-500"><RotateCcw className="mx-auto mb-2 h-7 w-7 text-slate-700" />No refund requests match these filters.</div> : <div className="divide-y divide-slate-800">{refunds.map((refund) => <button type="button" key={refund.id} onClick={() => setSelectedId(refund.id)} className={`w-full p-4 text-left transition hover:bg-slate-900 ${selectedId === refund.id ? "bg-slate-900" : ""}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-mono text-xs font-black text-cyan-300">{refund.id}</p><p className="mt-1 truncate text-sm font-extrabold text-white">#{refund.orderId}</p><p className="mt-1 truncate text-[11px] text-slate-500">{refund.customerName} · {refund.customerEmail || refund.customerPhone}</p></div><span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-black uppercase ${statusClass(refund.status)}`}>{statusLabel(refund.status)}</span></div><div className="mt-3 flex items-center justify-between text-[11px]"><span className="text-slate-500">{refund.reason} · {new Date(refund.createdAt).toLocaleDateString("en-IN")}</span><b className="text-emerald-300">{money(refund.approvedAmountPaise || refund.requestedAmountPaise)}</b></div></button>)}</div>}
        </div>
        {selected ? <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-wider text-cyan-400">Refund details</p><h3 className="mt-1 text-lg font-black text-white">{selected.id}</h3></div><span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${statusClass(selected.status)}`}>{statusLabel(selected.status)}</span></div><div className="grid grid-cols-2 gap-3 text-xs"><div><p className="text-[10px] uppercase text-slate-500">Customer</p><p className="mt-1 font-bold text-white">{selected.customerName}</p><p className="text-slate-400">{selected.customerEmail || selected.customerPhone}</p></div><div><p className="text-[10px] uppercase text-slate-500">Payment</p><p className="mt-1 font-mono font-bold text-cyan-300">{selected.paymentId}</p><p className="text-slate-400">Order #{selected.orderId}</p></div></div><div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Items & amounts</p>{selected.items.map((item) => <div key={item.itemKey} className="flex justify-between gap-3 text-xs"><span className="truncate text-slate-300">{item.title} × {item.quantity}</span><b className="text-emerald-300">{money(item.amountPaise)}</b></div>)}<div className="flex justify-between border-t border-slate-800 pt-2 text-xs"><span className="font-bold text-slate-400">Requested</span><b className="text-white">{money(selected.requestedAmountPaise)}</b></div></div><div className="rounded-xl border border-slate-800 bg-slate-900 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Timeline</p><div className="mt-3 space-y-3">{selected.history.map((event, index) => <div key={`${event.timestamp}-${index}`} className="flex gap-2"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-950 text-cyan-300">{index === selected.history.length - 1 ? <Clock3 className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}</span><div><p className="text-xs font-bold text-white">{statusLabel(event.status)}</p><p className="text-[10px] text-slate-500">{new Date(event.timestamp).toLocaleString("en-IN")} · {event.note}</p></div></div>)}</div></div>{selected.description && <p className="rounded-xl bg-slate-900 p-3 text-xs leading-5 text-slate-300"><b className="text-white">Customer description:</b> {selected.description}</p>}{selected.evidenceUrls.length > 0 && <div className="space-y-1"><p className="text-[10px] font-black uppercase text-slate-500">Evidence</p>{selected.evidenceUrls.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold text-cyan-300 hover:text-white"><Eye className="h-3.5 w-3.5" />Open evidence <ExternalLink className="h-3 w-3" /></a>)}</div>}
          {(selected.status === "REQUESTED" || selected.status === "UNDER_REVIEW") && <><div className="grid gap-2 sm:grid-cols-2"><label className="text-[10px] font-bold text-slate-400">Customer-visible remarks<textarea value={adminRemarks} onChange={(event) => setAdminRemarks(event.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white outline-none focus:border-cyan-500" /></label><label className="text-[10px] font-bold text-slate-400">Internal notes<textarea value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 p-2 text-xs text-white outline-none focus:border-cyan-500" /></label></div><button type="button" onClick={saveNotes} disabled={busyAction === "notes"} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-[11px] font-extrabold text-slate-200 hover:bg-slate-700">{busyAction === "notes" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}Save notes</button></>}
          {(selected.status === "REQUESTED" || selected.status === "UNDER_REVIEW") && <div className="space-y-2 border-t border-slate-800 pt-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => callAction("review", `/api/admin/refunds/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "under_review", internalNotes, adminRemarks }) })} disabled={selected.status === "UNDER_REVIEW" || Boolean(busyAction)} className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-950 px-3 py-2 text-[11px] font-extrabold text-cyan-300 hover:bg-cyan-900 disabled:opacity-50"><ShieldCheck className="h-3.5 w-3.5" />Under review</button><button type="button" onClick={approve} disabled={Boolean(busyAction)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-extrabold text-white hover:bg-emerald-500 disabled:opacity-50"><CheckCircle2 className="h-3.5 w-3.5" />Approve & refund</button></div><label className="block text-[10px] font-bold text-slate-400">Approved amount (INR)<input value={approvalAmount} onChange={(event) => setApprovalAmount(event.target.value)} inputMode="decimal" className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-black text-emerald-300 outline-none focus:border-emerald-500" /></label><label className="block text-[10px] font-bold text-slate-400">Rejection reason<input value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Required to reject" className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-rose-500" /></label><button type="button" onClick={reject} disabled={Boolean(busyAction)} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-950 px-3 py-2 text-[11px] font-extrabold text-rose-300 hover:bg-rose-900 disabled:opacity-50"><XCircle className="h-3.5 w-3.5" />Reject request</button></div>}
          {selected.status === "REFUND_PROCESSING" && <button type="button" onClick={() => callAction("reconcile", `/api/admin/refunds/${selected.id}/reconcile`, { method: "POST" })} disabled={Boolean(busyAction)} className="inline-flex items-center gap-1.5 rounded-lg bg-purple-950 px-3 py-2 text-[11px] font-extrabold text-purple-300 hover:bg-purple-900 disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5" />Reconcile Razorpay status</button>}
          {selected.razorpayRefundId && <p className="break-all text-[10px] text-slate-500">Razorpay refund: {selected.razorpayRefundId}</p>}
        </section> : <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-slate-800 text-xs text-slate-600">Select a refund request to inspect it.</div>}
      </div>
    </div>
  );
}
