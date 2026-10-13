"use client";
import type { BuyerTaxDetails } from "@/lib/tax-types";
import type { ShippingAddress } from "@/lib/types";
import { checkoutAddress } from "@/lib/checkout";
export default function CheckoutBillingFields({
  value,
  address,
  onChange,
}: {
  value: BuyerTaxDetails;
  address: ShippingAddress;
  onChange: (value: BuyerTaxDetails) => void;
}) {
  const input =
    "mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base";
  return (
    <details className="border-t border-slate-200 pt-4">
      <summary className="cursor-pointer text-sm text-teal-800">
        Business invoice / billing details (optional)
      </summary>
      <div className="mt-4 space-y-4">
        <label className="block text-sm">
          Purchase type
          <select
            className={input}
            value={value.kind}
            onChange={(e) =>
              onChange({
                ...value,
                kind: e.target.value as BuyerTaxDetails["kind"],
              })
            }
          >
            <option value="consumer">Personal / unregistered buyer</option>
            <option value="registered">
              GST-registered business; ordinary delivery
            </option>
            <option value="bill-to-ship-to">
              Registered business directing delivery to another location
            </option>
            <option value="sez">SEZ (requires review)</option>
            <option value="export">Export (requires review)</option>
            <option value="other">
              Other special supply (requires review)
            </option>
          </select>
        </label>
        {value.kind !== "consumer" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm">
              Business name
              <input
                className={input}
                value={value.businessName || ""}
                onChange={(e) =>
                  onChange({ ...value, businessName: e.target.value })
                }
              />
            </label>
            <label className="text-sm">
              Buyer GSTIN
              <input
                className={input}
                maxLength={15}
                value={value.gstin || ""}
                onChange={(e) =>
                  onChange({ ...value, gstin: e.target.value.toUpperCase() })
                }
              />
            </label>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!value.billingAddress}
            onChange={(e) =>
              onChange({
                ...value,
                billingAddress: e.target.checked
                  ? undefined
                  : checkoutAddress(address),
              })
            }
          />
          Billing address is the same as delivery
        </label>
        {value.billingAddress && (
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ["fullName", "Billing name"],
                ["houseNumber", "Building / flat"],
                ["street", "Street / area"],
                ["city", "City"],
                ["state", "State"],
                ["pincode", "PIN code"],
              ] as const
            ).map(([key, label]) => (
              <label className="text-sm" key={key}>
                {label}
                <input
                  className={input}
                  value={value.billingAddress?.[key] || ""}
                  autoComplete={
                    key === "state"
                      ? "billing address-level1"
                      : key === "pincode"
                        ? "billing postal-code"
                        : "off"
                  }
                  onChange={(e) =>
                    onChange({
                      ...value,
                      billingAddress: {
                        ...value.billingAddress!,
                        [key]: e.target.value,
                      },
                    })
                  }
                />
              </label>
            ))}
          </div>
        )}
        <p className="text-xs text-slate-500">
          Review billing and delivery addresses before continuing. SEZ, exports,
          cess and other special cases cannot be processed automatically.
        </p>
      </div>
    </details>
  );
}
