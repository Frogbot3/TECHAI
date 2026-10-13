"use client";
import { useEffect, useState } from "react";
import type { BusinessSettings } from "@/lib/tax-types";
import ProductTaxFields from "./ProductTaxFields";
const input =
  "mt-1 w-full rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-sm";
export default function BusinessInvoiceSettings() {
  const [rateText, setRateText] = useState("");
  const [value, setValue] = useState<BusinessSettings | null>(null),
    [review, setReview] = useState<
      { id: string; title: string; reason: string }[]
    >([]),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/api/admin/business-settings")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw Error(data.message);
        setValue(data.settings);
        setRateText(data.settings.approvedRates.join(", "));
        setReview(data.review);
      })
      .catch((e) => setMessage(e.message));
  }, []);
  if (!value)
    return <p role="status">{message || "Loading business settings…"}</p>;
  const update = (patch: Partial<BusinessSettings>) =>
    setValue({ ...value, ...patch });
  const select = (
    key: keyof BusinessSettings,
    label: string,
    options: [string, string][],
  ) => (
    <label className="text-sm" key={key}>
      {label}
      <select
        className={input}
        value={String(value[key])}
        onChange={(e) => update({ [key]: e.target.value })}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <form
      className="space-y-6 rounded-xl border border-admin-border bg-admin-surface p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy) return;
        setBusy(true);
        setMessage("");
        try {
          const r = await fetch("/api/admin/business-settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...value,
              approvedRates: rateText
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
                .map(Number),
            }),
          });
          const data = await r.json();
          if (!r.ok) throw Error(data.message);
          setValue(data.settings);
          setMessage("Settings saved. Issued invoices remain unchanged.");
        } catch (e) {
          setMessage((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <h2 className="text-xl font-semibold">Business / Invoice Settings</h2>
        <p className="mt-2 text-sm text-admin-muted">
          Verify GST applicability and policies with your accountant before
          enabling. The supplied certificate is not a live registration-status
          check. TECH AI is branding, not a verified registered trade name.
        </p>
      </div>
      <fieldset>
        <legend className="mb-3 font-medium">Registered seller</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {Object.entries({
            legalName: "Legal seller name",
            gstin: "GSTIN",
            building: "Building number",
            road: "Road",
            town: "Town",
            district: "District",
            state: "State",
            stateCode: "State code",
            pincode: "PIN code",
            country: "Country",
            phone: "Contact phone (optional)",
            email: "Contact email (optional)",
          }).map(([key, label]) => (
            <label className="text-sm" key={key}>
              {label}
              <input
                className={input}
                value={value.seller[key as keyof typeof value.seller]}
                onChange={(e) =>
                  update({ seller: { ...value.seller, [key]: e.target.value } })
                }
              />
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <img
          src={value.seller.logo}
          alt="Invoice logo"
          className="mb-3 h-12 w-auto object-contain"
        />
        <label className="text-sm">
          Invoice logo (PNG/JPEG)
          <input
            type="file"
            accept="image/png,image/jpeg"
            className="mt-2 block text-sm"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 1500000) {
                setMessage("Logo must be under 1.5 MB.");
                return;
              }
              const reader = new FileReader();
              reader.onload = () =>
                update({
                  seller: { ...value.seller, logo: String(reader.result) },
                });
              reader.readAsDataURL(file);
            }}
          />
        </label>
        <button
          className="mt-2 text-sm underline"
          type="button"
          onClick={() =>
            update({
              seller: { ...value.seller, logo: "/brand/techai-logo.png" },
            })
          }
        >
          Use existing TECH AI logo
        </button>
      </div>
      <fieldset>
        <legend className="mb-3 font-medium">Tax and pricing approval</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {select(
            "existingPriceBasis",
            "Confirm existing selling-price semantics",
            [
              ["unconfirmed", "Not confirmed"],
              ["inclusive", "Existing prices include GST"],
              ["exclusive", "Existing prices exclude GST"],
            ],
          )}
          <label className="text-sm">
            Approved GST rates (comma-separated)
            <input
              className={input}
              value={rateText}
              onChange={(e) => setRateText(e.target.value)}
              placeholder="Enter accountant-approved options"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={value.customRatesAllowed}
              onChange={(e) => update({ customRatesAllowed: e.target.checked })}
            />
            Allow authorized admins to enter validated custom rates
          </label>
          {select("discountPolicy", "Order discounts", [
            ["unconfirmed", "Not approved"],
            [
              "before-supply-proportional",
              "Before-supply; proportional allocation to prices",
            ],
          ])}
          {select("shippingMode", "Shipping tax treatment", [
            ["unconfigured", "Not approved"],
            [
              "allocated-incidental",
              "Incidental freight; allocate across supplied goods",
            ],
            ["separate-supply", "Separately classified shipping supply"],
          ])}
          {select("shippingPriceBasis", "Existing shipping charge basis", [
            ["unconfirmed", "Not confirmed"],
            ["inclusive", "Includes applicable GST"],
            ["exclusive", "Excludes applicable GST"],
          ])}
          {select("rounding", "Final total rounding", [
            ["paise", "Keep paise"],
            ["rupee", "Nearest rupee; disclose adjustment"],
          ])}
          {select("signatureMode", "Signature treatment", [
            ["unconfirmed", "Not approved"],
            ["wet-signature", "Print and sign before supply"],
            [
              "electronic-policy-approved",
              "Electronic issuance policy verified under IT Act",
            ],
          ])}
          {select("einvoice", "Official e-invoicing applicability", [
            ["unconfirmed", "Not reviewed"],
            ["not-applicable", "Reviewed: not applicable"],
            ["required", "Required: B2B blocked until IRP integration"],
          ])}
        </div>
        <p className="mt-3 text-sm text-admin-muted">
          Incidental freight allocation requires a justified business
          classification. Separate-supply treatment requires its own approved
          HSN and rate. No highest-rate shortcut is used. SEZ, exports, reverse
          charge, cess, and unsupported mixed B2B supplies require review.
        </p>
      </fieldset>
      {value.shippingMode === "separate-supply" && (
        <ProductTaxFields
          value={value.shippingTax}
          price={49}
          onChange={(tax) => update({ shippingTax: tax })}
        />
      )}
      <fieldset>
        <legend className="mb-3 font-medium">Invoice numbering</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Series prefix (1–3 letters/digits)
            <input
              className={input}
              value={value.invoicePrefix}
              onChange={(e) =>
                update({ invoicePrefix: e.target.value.toUpperCase() })
              }
              placeholder="TA"
              maxLength={3}
            />
          </label>
          <label className="text-sm">
            Starting sequence for a new financial-year series
            <input
              className={input}
              type="number"
              min={1}
              max={999999}
              value={value.sequenceStart}
              onChange={(e) =>
                update({ sequenceStart: Number(e.target.value) })
              }
            />
          </label>
        </div>
        <p className="mt-2 text-sm text-admin-muted">
          Example: TA/26-27/000001. Existing counters never reset. Confirm your
          established series and last issued number before enabling. Issuance
          occurs at dispatch; previews and downloads do not issue invoices.
        </p>
      </fieldset>
      <label className="block text-sm">
        Business/accountant approval and shipping classification rationale
        <textarea
          className={input}
          value={value.approvalNote}
          onChange={(e) => update({ approvalNote: e.target.value })}
        />
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(e) => update({ enabled: e.target.checked })}
        />
        Enable configured tax checkout and invoice issuance
      </label>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      <button
        disabled={busy}
        className="rounded-lg bg-teal-700 px-5 py-3 text-sm text-white disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save business settings"}
      </button>
      <section className="border-t border-admin-border pt-5">
        <h3 className="font-semibold">Tax setup review ({review.length})</h3>
        <p className="my-2 text-sm text-admin-muted">
          No products are changed by this report.
        </p>
        <button
          type="button"
          className="text-sm underline"
          onClick={() => {
            const blob = new Blob([JSON.stringify(review, null, 2)], {
              type: "application/json",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "tax-setup-review.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download review list
        </button>
        <ul className="mt-3 max-h-80 overflow-auto text-sm">
          {review.map((p) => (
            <li key={p.id} className="border-b border-admin-border py-2">
              {p.title} ({p.id}) — {p.reason}
            </li>
          ))}
        </ul>
      </section>
    </form>
  );
}
