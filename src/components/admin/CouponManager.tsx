"use client";
import { useCallback, useEffect, useState } from "react";
import { Plus, Search, Ticket, Pencil, X } from "lucide-react";
import { couponStatus, type CouponData } from "@/lib/coupons";
import { AdminEmpty, AdminError, AdminLoading, AdminModal } from "./AdminUI";
import { useAdminFeedback } from "./AdminFeedback";

const blank: CouponData = {
  name: "",
  code: "",
  type: "percentage",
  value: 10,
  minimumSpend: 0,
  maximumDiscount: 0,
  published: false,
  startsAt: null,
  endsAt: null,
};
const localDate = (date: CouponData["startsAt"]) => {
  if (!date) return "";
  const d = new Date(date);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
const displayDate = (date: CouponData["startsAt"]) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No limit";

export default function CouponManager() {
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<CouponData | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingCode, setPendingCode] = useState("");
  const [formError, setFormError] = useState("");
  const [clock, setClock] = useState(Date.now());
  const { notify, confirm } = useAdminFeedback();
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/coupons", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setCoupons(data.coupons);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load coupons.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    const timer = setInterval(() => setClock(Date.now()), 60000);
    return () => clearInterval(timer);
  }, [load]);
  const persist = async (coupon: CouponData, method: "POST" | "PATCH") => {
    const res = await fetch("/api/admin/coupons", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coupon),
    });
    const data = await res.json();
    if (!res.ok || !data.success)
      throw new Error(data.message || "Unable to save coupon.");
    setCoupons((all) =>
      method === "POST"
        ? [data.coupon, ...all]
        : all.map((c) => (c.code === coupon.code ? data.coupon : c)),
    );
  };
  const toggle = async (coupon: CouponData) => {
    if (
      coupon.published &&
      !(await confirm(
        `Pause ${coupon.code}? Customers will no longer be able to apply it to new orders.`,
      ))
    )
      return;
    setPendingCode(coupon.code);
    try {
      await persist({ ...coupon, published: !coupon.published }, "PATCH");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Unable to update coupon.");
    } finally {
      setPendingCode("");
    }
  };
  const filtered = coupons.filter(
    (c) =>
      `${c.name} ${c.code}`.toLowerCase().includes(search.toLowerCase()) &&
      (status === "All statuses" || couponStatus(c, clock) === status),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pages);
  const open = (coupon?: CouponData) => {
    setEditing(!!coupon);
    setForm(coupon ? { ...coupon } : { ...blank });
    setFormError("");
  };
  return (
    <div className="admin-coupons">
      <div className="admin-coupon-toolbar">
        <div>
          <h2>Discount coupons</h2>
          <p>Create offers, schedule campaigns and control availability.</p>
        </div>
        <button className="admin-button admin-primary" onClick={() => open()}>
          <Plus size={16} /> Add Coupon
        </button>
      </div>
      <div className="admin-coupon-filters">
        <label className="admin-search-field">
          <Search size={16} />
          <input
            aria-label="Search coupons"
            placeholder="Search by name or code…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </label>
        <select
          aria-label="Coupon status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          {["All statuses", "Active", "Scheduled", "Expired", "Paused"].map(
            (s) => (
              <option key={s}>{s}</option>
            ),
          )}
        </select>
        <span>{filtered.length} coupons</span>
      </div>
      {error && <AdminError message={error} retry={load} busy={loading} />}
      {loading ? (
        <AdminLoading />
      ) : (
        !error && (
          <>
            <div className="admin-coupon-table-wrap">
              <table className="admin-coupon-table">
                <thead>
                  <tr>
                    <th>Campaign / code</th>
                    <th>Discount</th>
                    <th>Published</th>
                    <th>Start date</th>
                    <th>End date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered
                    .slice((currentPage - 1) * 10, currentPage * 10)
                    .map((coupon) => {
                      const state = couponStatus(coupon, clock);
                      return (
                        <tr key={coupon.code}>
                          <td data-label="Campaign">
                            <div className="admin-coupon-name">
                              <span className="admin-coupon-icon">
                                <Ticket size={20} />
                              </span>
                              <div>
                                <strong>{coupon.name}</strong>
                                <code>{coupon.code}</code>
                              </div>
                            </div>
                          </td>
                          <td data-label="Discount">
                            <strong>
                              {coupon.type === "percentage"
                                ? `${coupon.value}%`
                                : `₹${coupon.value.toLocaleString("en-IN")}`}
                            </strong>
                            <small>
                              {coupon.minimumSpend > 0
                                ? `Min. ₹${coupon.minimumSpend.toLocaleString("en-IN")}`
                                : "No minimum spend"}
                            </small>
                            {coupon.maximumDiscount > 0 && (
                              <small>
                                Up to ₹
                                {coupon.maximumDiscount.toLocaleString("en-IN")}
                              </small>
                            )}
                          </td>
                          <td data-label="Published">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={coupon.published}
                              aria-label={`Publish ${coupon.code}`}
                              className="admin-coupon-switch"
                              disabled={!!pendingCode}
                              onClick={() => void toggle(coupon)}
                            >
                              <span />
                            </button>
                          </td>
                          <td data-label="Start date">
                            {displayDate(coupon.startsAt)}
                          </td>
                          <td data-label="End date">
                            {displayDate(coupon.endsAt)}
                          </td>
                          <td data-label="Status">
                            <span
                              className={`admin-badge ${state === "Active" ? "success" : state === "Expired" ? "danger" : state === "Scheduled" ? "info" : "warning"}`}
                            >
                              {state}
                            </span>
                          </td>
                          <td data-label="Actions">
                            <button
                              className="admin-button"
                              aria-label={`Edit ${coupon.code}`}
                              onClick={() => open(coupon)}
                            >
                              <Pencil size={14} /> Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
              {!filtered.length && (
                <AdminEmpty
                  title="No coupons found"
                  description="Add a coupon or try a different search."
                />
              )}
            </div>
            <div className="admin-list-pagination">
              <span>
                Page {currentPage} of {pages} · 10 per page
              </span>
              <div>
                <button
                  className="admin-button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Previous
                </button>
                <button
                  className="admin-button"
                  disabled={currentPage >= pages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
            <p className="text-xs text-admin-muted mt-3">
              Pause a coupon to stop new uses. Existing orders keep their
              original discount.
            </p>
          </>
        )
      )}
      {form && (
        <AdminModal
          label={editing ? "Edit coupon" : "Add coupon"}
          onClose={() => {
            if (!saving) setForm(null);
          }}
        >
          <div className="admin-detail-dialog admin-coupon-editor">
            <header className="admin-detail-heading">
              <div>
                <p className="admin-eyebrow">Promotion</p>
                <h2>{editing ? "Edit coupon" : "Add coupon"}</h2>
              </div>
              <button
                className="admin-icon-button"
                disabled={saving}
                aria-label="Close coupon editor"
                onClick={() => setForm(null)}
              >
                <X size={20} />
              </button>
            </header>
            <form
              id="coupon-form"
              className="admin-detail-scroll"
              onSubmit={async (e) => {
                e.preventDefault();
                setSaving(true);
                setFormError("");
                try {
                  await persist(form, editing ? "PATCH" : "POST");
                  setForm(null);
                  notify("Coupon saved.", "success");
                } catch (e) {
                  setFormError(
                    e instanceof Error ? e.message : "Unable to save coupon.",
                  );
                } finally {
                  setSaving(false);
                }
              }}
            >
              {formError && (
                <p role="alert" className="admin-error">
                  {formError}
                </p>
              )}
              <fieldset disabled={saving} className="admin-coupon-form-grid">
                <label className="col-span-full">
                  Campaign name
                  <input
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Weekend electronics offer"
                  />
                </label>
                <label>
                  Coupon code
                  <input
                    required
                    pattern="[A-Za-z0-9_-]{3,32}"
                    maxLength={32}
                    disabled={editing}
                    value={form.code}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value.toUpperCase() })
                    }
                    placeholder="WEEKEND10"
                  />
                </label>
                <label>
                  Discount type
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value as CouponData["type"],
                      })
                    }
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed amount (₹)</option>
                  </select>
                </label>
                <label>
                  Discount value
                  <input
                    required
                    type="number"
                    min="0.01"
                    max={form.type === "percentage" ? 100 : 1000000}
                    step="0.01"
                    value={form.value}
                    onChange={(e) =>
                      setForm({ ...form, value: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  Minimum spend (₹)
                  <input
                    required
                    type="number"
                    min="0"
                    max="1000000"
                    step="0.01"
                    value={form.minimumSpend}
                    onChange={(e) =>
                      setForm({ ...form, minimumSpend: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  Maximum discount (₹)
                  <input
                    required
                    type="number"
                    min="0"
                    max="1000000"
                    step="0.01"
                    value={form.maximumDiscount}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        maximumDiscount: Number(e.target.value),
                      })
                    }
                  />
                  <small>0 means no cap.</small>
                </label>
                <label>
                  Start date & time
                  <input
                    type="datetime-local"
                    value={localDate(form.startsAt)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        startsAt: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : null,
                      })
                    }
                  />
                </label>
                <label>
                  End date & time
                  <input
                    type="datetime-local"
                    value={localDate(form.endsAt)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        endsAt: e.target.value
                          ? new Date(e.target.value).toISOString()
                          : null,
                      })
                    }
                  />
                </label>
                <label className="admin-publish-label">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) =>
                      setForm({ ...form, published: e.target.checked })
                    }
                  />{" "}
                  Published
                </label>
                <p className="col-span-full text-xs text-admin-muted">
                  Dates use your local time zone. Leave dates empty for an
                  ongoing offer. Coupons apply to the item subtotal, before
                  delivery.
                </p>
              </fieldset>
            </form>
            <footer className="admin-detail-heading">
              <button
                className="admin-button"
                disabled={saving}
                onClick={() => setForm(null)}
              >
                Cancel
              </button>
              <button
                form="coupon-form"
                className="admin-button admin-primary"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save coupon"}
              </button>
            </footer>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
