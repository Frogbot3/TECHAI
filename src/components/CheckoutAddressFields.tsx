"use client";

import type { ShippingAddress } from "@/lib/types";
import { checkPincode } from "@/lib/storefront-config";

interface Props {
  address: ShippingAddress;
  errors: Record<string, string>;
  onChange: (field: keyof ShippingAddress, value: string) => void;
  detailsOpen: boolean;
  onDetailsToggle: (open: boolean) => void;
}

export default function CheckoutAddressFields({ address, errors, onChange, detailsOpen, onDetailsToggle }: Props) {
  const pinStatus = /^[1-9]\d{5}$/.test(address.pincode) ? checkPincode(address.pincode) : null;
  const field = (name: keyof ShippingAddress, label: string, autocomplete: string, type = "text", wide = false) => (
    <div className={wide ? "sm:col-span-2" : ""} key={name}>
      <label htmlFor={`checkout-${name}`} className="mb-1.5 block text-sm text-slate-700">{label}</label>
      <input id={`checkout-${name}`} name={name} type={type} autoComplete={autocomplete}
        value={String(address[name] || "")} inputMode={name === "pincode" ? "numeric" : type === "tel" ? "tel" : undefined}
        maxLength={name === "pincode" ? 6 : name === "phone" ? 10 : undefined}
        aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : name === "pincode" && pinStatus ? "checkout-serviceability" : undefined}
        onChange={event => onChange(name, ["pincode", "phone"].includes(name) ? event.target.value.replace(/\D/g, "") : event.target.value)}
        className={`h-11 w-full min-w-0 rounded-lg border bg-white px-3 text-base text-slate-900 outline-none focus:ring-2 focus:ring-teal-700/20 ${errors[name] ? "border-rose-500" : "border-slate-300 focus:border-teal-700"}`} />
      {errors[name] && <p id={`${name}-error`} className="mt-1 text-xs text-rose-700">{errors[name]}</p>}
      {name === "pincode" && pinStatus && !errors[name] && <p id="checkout-serviceability" role="status" className="mt-1.5 text-xs leading-relaxed text-slate-500">
        {pinStatus === "available" ? "Delivery is available to this PIN code." : pinStatus === "unavailable" ? "Delivery is unavailable to this PIN code." : "Delivery availability is not confirmed yet. Contact support before ordering."}
      </p>}
    </div>
  );
  return <div className="space-y-6">
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-slate-900">Contact details</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field("fullName", "Full name", "name")}
        {field("phone", "Mobile number", "tel-national", "tel")}
        {field("email", "Email (optional)", "email", "email", true)}
      </div>
    </fieldset>
    <fieldset>
      <legend className="mb-3 text-sm font-semibold text-slate-900">Delivery address <span className="ml-2 font-normal text-slate-500">India</span></legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field("houseNumber", "House / flat / building", "address-line1", "text", true)}
        {field("street", "Street / area", "address-line2", "text", true)}
        {field("pincode", "PIN code", "postal-code")}
        {field("city", "City", "address-level2")}
        {field("state", "State", "address-level1", "text", true)}
      </div>
    </fieldset>
    <details open={detailsOpen} onToggle={event => onDetailsToggle(event.currentTarget.open)}>
      <summary className="cursor-pointer py-1 text-sm text-teal-800">Add delivery details (optional)</summary>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {field("landmark", "Landmark", "off")}
        {field("deliveryInstructions", "Delivery instructions", "off")}
      </div>
    </details>
  </div>;
}
