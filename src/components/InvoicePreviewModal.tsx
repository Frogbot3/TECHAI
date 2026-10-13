"use client";
import { useEffect, useRef, useState } from "react";
import type { Order } from "@/lib/types";
import { generateOrderInvoice } from "@/lib/generateInvoice";
export default function InvoicePreviewModal({
  order,
  isOpen,
  onClose,
}: {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [url, setUrl] = useState(""),
    [error, setError] = useState(""),
    [state, setState] = useState(""),
    [busy, setBusy] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!isOpen || !order) return;
    const controller = new AbortController();
    let objectUrl = "";
    setUrl("");
    setError("");
    const overflow = document.body.style.overflow;
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    document.body.style.overflow = "hidden";
    fetch(`/api/orders/${encodeURIComponent(order.id)}/invoice`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (r) => {
        if (!r.ok) throw Error((await r.json()).message);
        setState(r.headers.get("X-Invoice-State") || "draft");
        return r.blob();
      })
      .then((blob) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      document.body.style.overflow = overflow;
      dialog.current?.close();
      previous?.focus();
    };
  }, [isOpen, order?.id]);
  if (!isOpen || !order) return null;
  return (
    <dialog
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      aria-labelledby="invoice-preview-title"
      className="fixed inset-0 z-[80] m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-2 backdrop:bg-slate-950/60 sm:p-5"
    >
      <section className="mx-auto flex h-full max-h-[95dvh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white text-slate-900">
        <header className="flex flex-wrap items-center gap-3 border-b p-4">
          <h2 id="invoice-preview-title" className="mr-auto font-semibold">
            Invoice {state === "issued" ? "(issued)" : "preview - not issued"}
          </h2>
          <button
            disabled={!url || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await generateOrderInvoice(order);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
            className="rounded-lg bg-teal-700 px-3 py-2 text-sm text-white"
          >
            Download PDF
          </button>
          <button
            disabled={!url}
            onClick={() => frame.current?.contentWindow?.print()}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            Print
          </button>
          <button
            onClick={onClose}
            aria-label="Close invoice"
            className="min-h-11 min-w-11 rounded-lg border"
          >
            ×
          </button>
        </header>
        <p className="px-4 py-2 text-xs text-slate-600">
          Current order payment: {order.paymentMethod} / {order.paymentStatus}.
          Issued PDFs preserve payment status at issue.
        </p>
        {error ? (
          <p role="alert" className="p-5 text-rose-700">
            {error}
          </p>
        ) : url ? (
          <iframe
            ref={frame}
            title="Authoritative invoice PDF"
            src={url}
            className="min-h-0 flex-1 border-0"
          />
        ) : (
          <p role="status" className="p-5">
            Preparing invoice preview…
          </p>
        )}
      </section>
    </dialog>
  );
}
