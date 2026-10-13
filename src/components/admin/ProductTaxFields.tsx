"use client";
import { useEffect, useState } from "react";
import type { ProductTax } from "@/lib/tax-types";
import { paise, taxAmounts, validateProductTax } from "@/lib/tax";
const input =
  "mt-1 w-full rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-sm";
export default function ProductTaxFields({
  value,
  onChange,
  price,
}: {
  value?: ProductTax;
  onChange: (tax: ProductTax | undefined) => void;
  price: number;
}) {
  const [rates, setRates] = useState<number[]>([]),
    [custom, setCustom] = useState(false);
  useEffect(() => {
    fetch("/api/admin/business-settings")
      .then((r) => r.json())
      .then((data) => {
        setRates(data.settings?.approvedRates || []);
        setCustom(!!data.settings?.customRatesAllowed);
      })
      .catch(() => {});
  }, []);
  const update = (patch: Partial<ProductTax>) =>
    onChange({ ...value!, ...patch });
  let preview = "Tax setup required";
  try {
    const tax = validateProductTax(value);
    const amount = taxAmounts(paise(price), tax, true);
    preview = `Taxable/supply value ₹${(amount.taxable / 100).toFixed(2)} + GST ₹${(amount.tax / 100).toFixed(2)} = customer price ₹${(amount.total / 100).toFixed(2)}`;
  } catch {}
  return (
    <section className="space-y-3 rounded-xl border border-admin-border p-4">
      <h3 className="font-semibold">Tax</h3>
      <p className="text-sm text-admin-muted">
        Rates must be approved for this specific product. Existing prices are
        never converted automatically.
      </p>
      {!value ? (
        <>
          <p className="text-sm text-amber-700">Tax setup required</p>
          <button
            type="button"
            className="rounded-lg border px-3 py-2 text-sm"
            onClick={() =>
              onChange({
                treatment: "taxable",
                rate: NaN,
                hsn: "",
                unit: "",
                priceBasis: "" as ProductTax["priceBasis"],
                cess: "review-required",
                reverseCharge: false,
              })
            }
          >
            Configure product tax
          </button>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              Tax treatment
              <select
                className={input}
                value={value.treatment}
                onChange={(e) =>
                  update({
                    treatment: e.target.value as ProductTax["treatment"],
                    rate: e.target.value === "taxable" ? NaN : 0,
                  })
                }
              >
                <option value="taxable">Taxable</option>
                <option value="nil-rated">Nil-rated</option>
                <option value="exempt">Exempt</option>
                <option value="non-gst">Non-GST</option>
              </select>
            </label>
            <label className="text-sm">
              GST rate (%)
              <select
                className={input}
                value={Number.isFinite(value.rate) ? value.rate : ""}
                onChange={(e) =>
                  update({
                    rate: e.target.value === "" ? NaN : Number(e.target.value),
                  })
                }
              >
                <option value="">Select an approved rate</option>
                {[
                  ...new Set([
                    ...rates,
                    ...(value.treatment !== "taxable" ? [0] : []),
                    ...(Number.isFinite(value.rate) ? [value.rate] : []),
                  ]),
                ].map((rate) => (
                  <option key={rate} value={rate}>
                    {rate}%
                    {rates.includes(rate) || rate === 0
                      ? ""
                      : " (custom - approval required)"}
                  </option>
                ))}
              </select>
            </label>
            {custom && (
              <label className="text-sm">
                Authorized custom rate (%)
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  className={input}
                  value={Number.isFinite(value.rate) ? value.rate : ""}
                  onChange={(e) =>
                    update({
                      rate:
                        e.target.value === "" ? NaN : Number(e.target.value),
                    })
                  }
                />
              </label>
            )}
            <label className="text-sm">
              HSN code
              <input
                inputMode="numeric"
                className={input}
                value={value.hsn}
                onChange={(e) => update({ hsn: e.target.value })}
                maxLength={8}
              />
            </label>
            <label className="text-sm">
              Unit of measurement
              <input
                className={input}
                placeholder="e.g. NOS, KGS"
                value={value.unit}
                onChange={(e) => update({ unit: e.target.value })}
              />
            </label>
            <label className="text-sm">
              Selling price basis
              <select
                className={input}
                value={value.priceBasis}
                onChange={(e) =>
                  update({
                    priceBasis: e.target.value as ProductTax["priceBasis"],
                  })
                }
              >
                <option value="">Choose explicitly</option>
                <option value="inclusive">Price includes GST</option>
                <option value="exclusive">Price excludes GST</option>
              </select>
            </label>
            <label className="text-sm">
              Cess / special treatment
              <select
                className={input}
                value={value.cess}
                onChange={(e) =>
                  update({ cess: e.target.value as ProductTax["cess"] })
                }
              >
                <option value="review-required">
                  Applicable or not reviewed - block checkout
                </option>
                <option value="none">Confirmed: no cess applies</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={value.reverseCharge}
                onChange={(e) => update({ reverseCharge: e.target.checked })}
              />
              Reverse charge applies (review required)
            </label>
          </div>
          <p
            role="status"
            className="rounded-lg bg-teal-50 p-3 text-sm text-teal-900"
          >
            {preview}
          </p>
          {(value.cess !== "none" || value.reverseCharge) && (
            <p className="text-sm text-amber-700">
              Preview excludes special taxes. Checkout is blocked until this
              treatment is reviewed.
            </p>
          )}
          <button
            type="button"
            className="text-sm text-admin-muted underline"
            onClick={() => onChange(undefined)}
          >
            Mark tax setup required
          </button>
        </>
      )}
    </section>
  );
}
