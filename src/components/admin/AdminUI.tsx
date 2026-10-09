"use client";
import { useEffect, useRef, type ImgHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, PackageOpen } from "lucide-react";

let openDialogs = 0;
let previousBodyOverflow = "";

export function AdminModal({
  children,
  label,
  onClose,
  className = "",
}: {
  children: React.ReactNode;
  label: string;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    if (openDialogs === 0) previousBodyOverflow = document.body.style.overflow;
    openDialogs += 1;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      openDialogs -= 1;
      if (openDialogs === 0)
        document.body.style.overflow = previousBodyOverflow;
      previous?.focus();
    };
  }, []);
  const root =
    typeof document !== "undefined"
      ? document.getElementById("admin-portals")
      : null;
  if (!root) return null;
  return createPortal(
    <dialog
      ref={ref}
      aria-label={label}
      className={`admin-dialog ${className}`}
      onCancel={(event) => {
        event.preventDefault();
        closeRef.current();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeRef.current();
      }}
    >
      {children}
    </dialog>,
    root,
  );
}
export function AdminEmpty({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="admin-empty">
      <PackageOpen size={28} aria-hidden="true" />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}
export function AdminError({
  message,
  retry,
  busy,
}: {
  message: string;
  retry: () => void;
  busy?: boolean;
}) {
  return (
    <div role="alert" className="admin-error">
      <AlertCircle size={18} />
      <span>{message}</span>
      <button
        type="button"
        className="admin-button"
        disabled={busy}
        onClick={retry}
      >
        Retry
      </button>
    </div>
  );
}
export function AdminLoading() {
  return (
    <div
      role="status"
      aria-label="Loading admin data"
      className="admin-loading"
    >
      <span>Loading your workspace…</span>
      <div className="admin-metrics">
        {[0, 1, 2, 3, 4].map((n) => (
          <div key={n} className="admin-skeleton" />
        ))}
      </div>
      <div className="admin-skeleton h-80" />
    </div>
  );
}
export function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="admin-form-section">
      <legend>{title}</legend>
      {children}
    </fieldset>
  );
}

export function AdminImage({
  src,
  alt,
  onError,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      {...props}
      src={src || "/product-placeholder.svg"}
      alt={alt || "Product image"}
      loading="lazy"
      onError={(event) => {
        if (!event.currentTarget.src.endsWith("/product-placeholder.svg"))
          event.currentTarget.src = "/product-placeholder.svg";
        onError?.(event);
      }}
    />
  );
}
