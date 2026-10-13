import type { BusinessSettings } from "./tax-types";
import {
  rateBasisPoints,
  stateCode,
  TaxSetupError,
  validGstin,
  validateProductTax,
} from "./tax";

export const INITIAL_BUSINESS_SETTINGS: BusinessSettings = {
  seller: {
    legalName: "SUPPLYCO PACKAGING AND INDUSTRIAL TECHNOLOGY",
    gstin: "32AFVFS6088Q1ZR",
    building: "16/621",
    road: "Trithala Padinjarangadi Road",
    town: "Thrithala",
    district: "Palakkad",
    state: "Kerala",
    stateCode: "32",
    pincode: "679552",
    country: "India",
    phone: "",
    email: "",
    logo: "/brand/techai-logo.png",
  },
  enabled: false,
  existingPriceBasis: "unconfirmed",
  approvedRates: [],
  customRatesAllowed: false,
  shippingMode: "unconfigured",
  shippingPriceBasis: "unconfirmed",
  discountPolicy: "unconfirmed",
  rounding: "paise",
  invoicePrefix: "",
  sequenceStart: 1,
  signatureMode: "unconfirmed",
  einvoice: "unconfirmed",
  approvalNote: "",
};
export function validateBusinessSettings(input: unknown): BusinessSettings {
  if (!input || typeof input !== "object")
    throw new TaxSetupError("Invalid settings.");
  const raw = input as BusinessSettings,
    s = raw.seller;
  if (!s || typeof s !== "object")
    throw new TaxSetupError("Seller details are required.");
  const seller = Object.fromEntries(
    Object.keys(INITIAL_BUSINESS_SETTINGS.seller).map((key) => {
      const v = s[key as keyof typeof s];
      if (typeof v !== "string" || v.length > (key === "logo" ? 2000000 : 200))
        throw new TaxSetupError("Invalid seller field: " + key);
      return [key, v.trim()];
    }),
  ) as unknown as BusinessSettings["seller"];
  if (
    !validGstin(seller.gstin) ||
    seller.gstin.slice(0, 2) !== seller.stateCode ||
    stateCode(seller.state) !== seller.stateCode
  )
    throw new TaxSetupError("Seller GSTIN and state code must agree.");
  if (
    !seller.legalName ||
    !seller.building ||
    !seller.road ||
    !seller.town ||
    !seller.district ||
    !/^\d{6}$/.test(seller.pincode) ||
    seller.country !== "India"
  )
    throw new TaxSetupError("Complete the Indian seller address.");
  if (
    seller.logo !== "/brand/techai-logo.png" &&
    !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(seller.logo)
  )
    throw new TaxSetupError(
      "Use the existing logo or upload a PNG/JPEG (maximum 1.5 MB).",
    );
  if (seller.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(seller.email))
    throw new TaxSetupError("Invalid contact email.");
  if (!Array.isArray(raw.approvedRates) || raw.approvedRates.length > 40)
    throw new TaxSetupError("Provide approved rates.");
  raw.approvedRates.forEach(rateBasisPoints);
  if (
    typeof raw.enabled !== "boolean" ||
    typeof raw.customRatesAllowed !== "boolean"
  )
    throw new TaxSetupError("Invalid enable flags.");
  if (
    !["unconfirmed", "inclusive", "exclusive"].includes(
      raw.existingPriceBasis,
    ) ||
    !["unconfirmed", "inclusive", "exclusive"].includes(
      raw.shippingPriceBasis,
    ) ||
    !["unconfigured", "allocated-incidental", "separate-supply"].includes(
      raw.shippingMode,
    ) ||
    !["unconfirmed", "before-supply-proportional"].includes(
      raw.discountPolicy,
    ) ||
    !["paise", "rupee"].includes(raw.rounding) ||
    !["unconfirmed", "wet-signature", "electronic-policy-approved"].includes(
      raw.signatureMode,
    ) ||
    !["unconfirmed", "not-applicable", "required"].includes(raw.einvoice)
  )
    throw new TaxSetupError("Choose valid tax policies.");
  if (
    typeof raw.invoicePrefix !== "string" ||
    !/^([A-Z0-9]{1,3})?$/.test(raw.invoicePrefix) ||
    !Number.isInteger(raw.sequenceStart) ||
    raw.sequenceStart < 1 ||
    raw.sequenceStart > 999999
  )
    throw new TaxSetupError(
      "Use a 1-3 character series and a starting sequence from 1 to 999999.",
    );
  if (typeof raw.approvalNote !== "string" || raw.approvalNote.length > 1000)
    throw new TaxSetupError("Add a short accountant/business approval note.");
  const settings: BusinessSettings = {
    seller,
    enabled: raw.enabled,
    existingPriceBasis: raw.existingPriceBasis,
    approvedRates: [...new Set(raw.approvedRates)],
    customRatesAllowed: raw.customRatesAllowed,
    shippingMode: raw.shippingMode,
    shippingPriceBasis: raw.shippingPriceBasis,
    discountPolicy: raw.discountPolicy,
    rounding: raw.rounding,
    invoicePrefix: raw.invoicePrefix,
    sequenceStart: raw.sequenceStart,
    signatureMode: raw.signatureMode,
    einvoice: raw.einvoice,
    approvalNote: raw.approvalNote.trim(),
  };
  if (raw.shippingTax)
    settings.shippingTax = validateProductTax(raw.shippingTax, settings);
  if (
    settings.enabled &&
    (settings.existingPriceBasis === "unconfirmed" ||
      settings.shippingMode === "unconfigured" ||
      settings.shippingPriceBasis === "unconfirmed" ||
      settings.discountPolicy === "unconfirmed" ||
      settings.signatureMode === "unconfirmed" ||
      settings.einvoice === "unconfirmed" ||
      !settings.invoicePrefix ||
      settings.approvalNote.length < 10)
  )
    throw new TaxSetupError(
      "Confirm pricing, shipping, discount, signature, e-invoice applicability, numbering and approval before enabling.",
    );
  if (
    settings.enabled &&
    settings.shippingMode === "separate-supply" &&
    !settings.shippingTax
  )
    throw new TaxSetupError("Configure the separate shipping supply tax.");
  return settings;
}
