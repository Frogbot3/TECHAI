import type {
  BusinessSettings,
  BuyerTaxDetails,
  ProductTax,
  TaxComponents,
  TaxLine,
  TaxSnapshot,
} from "./tax-types";
import type { ShippingAddress } from "./types";

export const INDIAN_STATE_CODES: Record<string, string> = {
  "Jammu and Kashmir": "01",
  "Himachal Pradesh": "02",
  Punjab: "03",
  Chandigarh: "04",
  Uttarakhand: "05",
  Haryana: "06",
  Delhi: "07",
  Rajasthan: "08",
  "Uttar Pradesh": "09",
  Bihar: "10",
  Sikkim: "11",
  "Arunachal Pradesh": "12",
  Nagaland: "13",
  Manipur: "14",
  Mizoram: "15",
  Tripura: "16",
  Meghalaya: "17",
  Assam: "18",
  "West Bengal": "19",
  Jharkhand: "20",
  Odisha: "21",
  Chhattisgarh: "22",
  "Madhya Pradesh": "23",
  Gujarat: "24",
  "Dadra and Nagar Haveli and Daman and Diu": "26",
  Maharashtra: "27",
  Karnataka: "29",
  Goa: "30",
  Lakshadweep: "31",
  Kerala: "32",
  "Tamil Nadu": "33",
  Puducherry: "34",
  "Andaman and Nicobar Islands": "35",
  Telangana: "36",
  "Andhra Pradesh": "37",
  Ladakh: "38",
};
export function stateCode(state: string) {
  const aliases: Record<string, string> = {
    "delhi ncr": "Delhi",
    "new delhi": "Delhi",
    "jammu & kashmir": "Jammu and Kashmir",
    orissa: "Odisha",
    pondicherry: "Puducherry",
  };
  const normalized = aliases[state.trim().toLowerCase()] || state.trim();
  return (
    Object.entries(INDIAN_STATE_CODES).find(
      ([name]) => name.toLowerCase() === normalized.toLowerCase(),
    )?.[1] || ""
  );
}
export class TaxSetupError extends Error {}
export function taxAddress(value: unknown): ShippingAddress {
  if (!value || typeof value !== "object")
    throw new TaxSetupError("Complete the delivery and billing addresses.");
  const input = value as Record<string, unknown>;
  const result: Record<string, string> = {};
  for (const key of [
    "fullName",
    "houseNumber",
    "street",
    "landmark",
    "city",
    "state",
    "pincode",
    "country",
    "phone",
    "email",
  ]) {
    const field = input[key] ?? "";
    if (
      typeof field !== "string" ||
      field.length > (key === "street" ? 300 : 150) ||
      /[\x00-\x1f]/.test(field)
    )
      throw new TaxSetupError("Invalid address field: " + key);
    result[key] = field.trim();
  }
  result.country ||= "India";
  if (
    !result.fullName ||
    !result.street ||
    !result.city ||
    !stateCode(result.state) ||
    !/^[1-9]\d{5}$/.test(result.pincode) ||
    result.country !== "India"
  )
    throw new TaxSetupError("Complete a valid Indian address and PIN code.");
  return result as unknown as ShippingAddress;
}
export function paise(value: number | string): number {
  const text = String(value);
  if (!/^\d+(\.\d{1,2})?$/.test(text))
    throw new TaxSetupError(
      "Money must be non-negative with at most two decimal places.",
    );
  const [whole, fraction = ""] = text.split(".");
  const result = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
  if (result > BigInt(1e12))
    throw new TaxSetupError("Amount exceeds the supported limit.");
  return Number(result);
}
export function roundRatio(numerator: bigint, denominator: bigint) {
  if (denominator <= BigInt(0))
    throw new TaxSetupError("Invalid calculation denominator.");
  return Number(
    (numerator * BigInt(2) + denominator) / (denominator * BigInt(2)),
  );
}
export function rateBasisPoints(rate: number) {
  if (
    typeof rate !== "number" ||
    !Number.isFinite(rate) ||
    rate < 0 ||
    rate > 100
  )
    throw new TaxSetupError("GST rate must be between 0 and 100%.");
  return paise(rate);
}
export function validateProductTax(
  value: unknown,
  settings?: Pick<BusinessSettings, "approvedRates" | "customRatesAllowed">,
): ProductTax {
  const tax = value as ProductTax;
  if (!tax || typeof tax !== "object")
    throw new TaxSetupError("Tax setup required.");
  if (!["taxable", "nil-rated", "exempt", "non-gst"].includes(tax.treatment))
    throw new TaxSetupError("Choose a tax treatment.");
  rateBasisPoints(tax.rate);
  if (tax.treatment === "taxable" ? tax.rate <= 0 : tax.rate !== 0)
    throw new TaxSetupError(
      "Taxable goods need a positive rate; nil-rated, exempt and non-GST goods need an explicit zero rate.",
    );
  if (
    settings &&
    tax.treatment === "taxable" &&
    !settings.approvedRates.includes(tax.rate) &&
    !settings.customRatesAllowed
  )
    throw new TaxSetupError(
      "This GST rate has not been approved in Business / Invoice Settings.",
    );
  if (!/^\d{4,8}$/.test(tax.hsn || "") || ![4, 6, 8].includes(tax.hsn.length))
    throw new TaxSetupError("Enter a 4, 6 or 8 digit HSN code.");
  if (typeof tax.unit !== "string" || !/^[A-Za-z0-9 /-]{1,20}$/.test(tax.unit))
    throw new TaxSetupError("Enter a unit of measurement.");
  if (!["inclusive", "exclusive"].includes(tax.priceBasis))
    throw new TaxSetupError("Select whether the price includes GST.");
  if (
    !["none", "review-required"].includes(tax.cess) ||
    typeof tax.reverseCharge !== "boolean"
  )
    throw new TaxSetupError("Confirm cess and reverse-charge treatment.");
  return {
    treatment: tax.treatment,
    rate: tax.rate,
    hsn: tax.hsn,
    unit: tax.unit,
    priceBasis: tax.priceBasis,
    cess: tax.cess,
    reverseCharge: tax.reverseCharge,
  };
}
export function validGstin(value: string) {
  if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(value)) return false;
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const n = chars.indexOf(value[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(n / 36) + (n % 36);
  }
  return chars[(36 - (sum % 36)) % 36] === value[14];
}
export function placeOfSupply(
  sellerCode: string,
  shipping: ShippingAddress,
  buyer: BuyerTaxDetails,
) {
  const shippingCode = stateCode(shipping.state || "");
  if (!shippingCode || (shipping.country && shipping.country !== "India"))
    throw new TaxSetupError(
      "Confirm a valid Indian delivery state and country.",
    );
  if (!["consumer", "registered", "bill-to-ship-to"].includes(buyer.kind))
    throw new TaxSetupError(
      "SEZ, exports and special supplies require accountant review before checkout.",
    );
  if (buyer.kind === "consumer" && buyer.gstin)
    throw new TaxSetupError("Choose registered business for a buyer GSTIN.");
  if (buyer.kind !== "consumer") {
    if (!validGstin(buyer.gstin || "") || !buyer.businessName?.trim())
      throw new TaxSetupError("Enter a valid buyer GSTIN and business name.");
    const billingCode = stateCode(buyer.billingAddress?.state || "");
    if (billingCode !== buyer.gstin!.slice(0, 2))
      throw new TaxSetupError("Buyer GSTIN must match the billing state.");
    if (buyer.kind === "registered" && billingCode !== shippingCode)
      throw new TaxSetupError(
        "Confirm the bill-to/ship-to arrangement for a different delivery state.",
      );
  }
  const code =
    buyer.kind === "bill-to-ship-to" ? buyer.gstin!.slice(0, 2) : shippingCode;
  if (!Object.values(INDIAN_STATE_CODES).includes(sellerCode))
    throw new TaxSetupError("Seller state code needs review.");
  return {
    code,
    state: Object.keys(INDIAN_STATE_CODES).find(
      (name) => INDIAN_STATE_CODES[name] === code,
    )!,
    basis:
      buyer.kind === "consumer"
        ? "IGST section 10(1)(ca); Circular 209/3/2024: confirmed delivery address"
        : buyer.kind === "bill-to-ship-to"
          ? "IGST section 10(1)(b): directing registered buyer's principal place of business"
          : "IGST section 10(1)(a): movement terminates at delivery",
  };
}
// Largest remainder allocation: every paise is allocated once, ties follow line order.
export function allocate(total: number, weights: number[]) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!sum) {
    if (total)
      throw new TaxSetupError("Cannot allocate a charge to zero-value goods.");
    return weights.map(() => 0);
  }
  const entries = weights.map((w, i) => ({
    i,
    value: Number((BigInt(total) * BigInt(w)) / BigInt(sum)),
    remainder: (BigInt(total) * BigInt(w)) % BigInt(sum),
  }));
  let remaining = total - entries.reduce((a, b) => a + b.value, 0);
  for (const entry of [...entries].sort((a, b) =>
    a.remainder === b.remainder
      ? a.i - b.i
      : a.remainder > b.remainder
        ? -1
        : 1,
  )) {
    if (!remaining--) break;
    entry.value++;
  }
  return entries.map((e) => e.value);
}
export function taxAmounts(
  value: number,
  tax: ProductTax,
  intra: boolean,
  unionTerritory = false,
) {
  const rate = rateBasisPoints(tax.rate);
  const taxable =
    tax.priceBasis === "inclusive"
      ? roundRatio(BigInt(value) * BigInt(10000), BigInt(10000 + rate))
      : value;
  const gst =
    tax.priceBasis === "inclusive"
      ? value - taxable
      : roundRatio(BigInt(taxable) * BigInt(rate), BigInt(10000));
  const half = intra ? Math.floor(gst / 2) : 0;
  const components: TaxComponents = {
    cgst: half,
    sgst: intra && !unionTerritory ? gst - half : 0,
    utgst: intra && unionTerritory ? gst - half : 0,
    igst: intra ? 0 : gst,
  };
  return { taxable, tax: gst, total: taxable + gst, ...components };
}
export interface TaxInputLine {
  productId: string;
  sku?: string;
  description: string;
  variant?: string;
  quantity: number;
  price: number;
  tax?: ProductTax;
}
export function calculateTaxOrder(
  settings: BusinessSettings,
  inputs: TaxInputLine[],
  shipping: ShippingAddress,
  buyer: BuyerTaxDetails,
  discount: number,
  shippingCharge: number,
): TaxSnapshot {
  if (!settings.enabled || settings.existingPriceBasis === "unconfirmed")
    throw new TaxSetupError(
      "Tax setup required: an administrator must confirm pricing and invoice settings.",
    );
  if (
    settings.discountPolicy !== "before-supply-proportional" ||
    settings.shippingMode === "unconfigured" ||
    settings.shippingPriceBasis === "unconfirmed"
  )
    throw new TaxSetupError(
      "Discount and shipping tax policies require approval.",
    );
  if (!inputs.length || inputs.length > 100)
    throw new TaxSetupError("Checkout requires between 1 and 100 lines.");
  shipping = taxAddress(shipping);
  if (!buyer || typeof buyer !== "object")
    throw new TaxSetupError("Choose a buyer type.");
  for (const field of [buyer.businessName, buyer.gstin])
    if (
      field !== undefined &&
      (typeof field !== "string" || field.length > 200)
    )
      throw new TaxSetupError("Invalid buyer details.");
  const billingAddress = taxAddress(buyer.billingAddress || shipping);
  buyer = {
    kind: buyer.kind,
    businessName: buyer.businessName?.trim(),
    gstin: buyer.gstin?.trim().toUpperCase(),
    billingAddress,
  };
  if (
    !billingAddress.fullName?.trim() ||
    !billingAddress.street?.trim() ||
    !billingAddress.city?.trim() ||
    !/^[1-9]\d{5}$/.test(billingAddress.pincode)
  )
    throw new TaxSetupError("Complete the billing address.");
  const pos = placeOfSupply(settings.seller.stateCode, shipping, buyer);
  const intra = pos.code === settings.seller.stateCode,
    ut = ["04", "26", "31", "35", "38"].includes(pos.code);
  const taxes = inputs.map((line) => {
    const tax = validateProductTax(line.tax, settings);
    if (tax.cess !== "none" || tax.reverseCharge)
      throw new TaxSetupError(
        `${line.description}: cess or reverse-charge review required.`,
      );
    return tax;
  });
  if (buyer.kind !== "consumer" && settings.einvoice === "required")
    throw new TaxSetupError(
      "This business requires IRP integration before registered-buyer checkout. No substitute e-invoice is generated.",
    );
  const values = inputs.map((line) => {
    if (
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      line.quantity > 99
    )
      throw new TaxSetupError("Invalid quantity.");
    return paise(line.price) * line.quantity;
  });
  const subtotal = values.reduce((a, b) => a + b, 0),
    discountPaise = paise(discount);
  if (!Number.isSafeInteger(subtotal) || subtotal > 1e12)
    throw new TaxSetupError("Order exceeds the supported amount limit.");
  if (discountPaise > subtotal)
    throw new TaxSetupError("Discount exceeds the item value.");
  const discounts = allocate(discountPaise, values);
  const lines: TaxLine[] = inputs.map((line, i) => ({
    productId: line.productId,
    sku: line.sku || line.productId,
    description: line.description,
    variant: line.variant || "",
    quantity: line.quantity,
    ...taxes[i],
    unitPrice: paise(line.price),
    gross: values[i],
    discount: discounts[i],
    ...taxAmounts(values[i] - discounts[i], taxes[i], intra, ut),
    kind: "product",
  }));
  const charge = paise(shippingCharge);
  if (charge) {
    if (settings.shippingMode === "allocated-incidental") {
      const portions = allocate(
        charge,
        lines.map((line) => line.total),
      );
      portions.forEach((value, i) => {
        if (value) {
          const tax = {
            ...taxes[i],
            priceBasis: settings.shippingPriceBasis as
              | "inclusive"
              | "exclusive",
          };
          lines.push({
            productId: "shipping",
            sku: "",
            description: `Shipping allocated to ${inputs[i].description}`,
            variant: "",
            quantity: 1,
            ...tax,
            unitPrice: value,
            gross: value,
            discount: 0,
            ...taxAmounts(value, tax, intra, ut),
            kind: "shipping",
          });
        }
      });
    } else {
      const tax = validateProductTax(settings.shippingTax, settings);
      if (tax.cess !== "none" || tax.reverseCharge)
        throw new TaxSetupError(
          "Shipping requires cess/reverse-charge review.",
        );
      const configured = {
        ...tax,
        priceBasis: settings.shippingPriceBasis as "inclusive" | "exclusive",
      };
      lines.push({
        productId: "shipping",
        sku: "",
        description: "Shipping",
        variant: "",
        quantity: 1,
        ...configured,
        unitPrice: charge,
        gross: charge,
        discount: 0,
        ...taxAmounts(charge, configured, intra, ut),
        kind: "shipping",
      });
    }
  }
  const taxablePresent = lines.some((l) => l.treatment === "taxable"),
    exemptPresent = lines.some((l) => l.treatment !== "taxable");
  if (taxablePresent && exemptPresent && buyer.kind !== "consumer")
    throw new TaxSetupError(
      "Mixed taxable/exempt B2B supplies require separate documents and accountant review.",
    );
  const sum = (
    key: "tax" | "taxable" | "total" | keyof TaxComponents,
    predicate = (l: TaxLine) => true,
  ) => lines.filter(predicate).reduce((n, l) => n + l[key], 0);
  const exact = sum("total"),
    total =
      settings.rounding === "rupee" ? Math.round(exact / 100) * 100 : exact;
  return {
    version: 1,
    seller: structuredClone(settings.seller),
    buyer: structuredClone(buyer),
    billingAddress: structuredClone(buyer.billingAddress || shipping),
    shippingAddress: structuredClone(shipping),
    placeOfSupply: pos,
    documentTitle: taxablePresent
      ? exemptPresent
        ? "Invoice-cum-Bill of Supply"
        : "Tax Invoice"
      : "Bill of Supply",
    lines,
    subtotal,
    discount: discountPaise,
    taxable: sum("taxable", (l) => l.treatment === "taxable"),
    exemptValue: sum("taxable", (l) => l.treatment !== "taxable"),
    tax: sum("tax"),
    cgst: sum("cgst"),
    sgst: sum("sgst"),
    utgst: sum("utgst"),
    igst: sum("igst"),
    shipping: sum("total", (l) => l.kind === "shipping"),
    shippingTax: sum("tax", (l) => l.kind === "shipping"),
    roundOff: total - exact,
    total,
    shippingPolicy: settings.shippingMode,
    roundingPolicy:
      "Integer paise; half-up per line; odd intra-state tax paise assigned to SGST/UTGST; final " +
      settings.rounding,
    reverseCharge: false,
  };
}
