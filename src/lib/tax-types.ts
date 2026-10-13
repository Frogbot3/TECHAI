import type { ShippingAddress } from "./types";

export type TaxTreatment = "taxable" | "nil-rated" | "exempt" | "non-gst";
export type PriceBasis = "inclusive" | "exclusive";
export interface ProductTax {
  treatment: TaxTreatment;
  rate: number;
  hsn: string;
  unit: string;
  priceBasis: PriceBasis;
  cess: "none" | "review-required";
  reverseCharge: boolean;
}
export interface SellerDetails {
  legalName: string;
  gstin: string;
  building: string;
  road: string;
  town: string;
  district: string;
  state: string;
  stateCode: string;
  pincode: string;
  country: string;
  phone: string;
  email: string;
  logo: string;
}
export interface BusinessSettings {
  seller: SellerDetails;
  enabled: boolean;
  existingPriceBasis: "unconfirmed" | PriceBasis;
  approvedRates: number[];
  customRatesAllowed: boolean;
  shippingMode: "unconfigured" | "allocated-incidental" | "separate-supply";
  shippingPriceBasis: "unconfirmed" | PriceBasis;
  shippingTax?: ProductTax;
  discountPolicy: "unconfirmed" | "before-supply-proportional";
  rounding: "paise" | "rupee";
  invoicePrefix: string;
  sequenceStart: number;
  signatureMode: "unconfirmed" | "wet-signature" | "electronic-policy-approved";
  einvoice: "unconfirmed" | "not-applicable" | "required";
  approvalNote: string;
}
export interface BuyerTaxDetails {
  kind:
    | "consumer"
    | "registered"
    | "bill-to-ship-to"
    | "sez"
    | "export"
    | "other";
  businessName?: string;
  gstin?: string;
  billingAddress?: ShippingAddress;
}
export interface TaxComponents {
  cgst: number;
  sgst: number;
  utgst: number;
  igst: number;
}
export interface TaxLine extends TaxComponents {
  productId: string;
  sku: string;
  description: string;
  variant: string;
  quantity: number;
  unit: string;
  hsn: string;
  treatment: TaxTreatment;
  rate: number;
  priceBasis: PriceBasis;
  unitPrice: number;
  gross: number;
  discount: number;
  taxable: number;
  tax: number;
  total: number;
  kind: "product" | "shipping";
}
// Monetary amounts in snapshots are integer paise, never binary float currency.
export interface TaxSnapshot extends TaxComponents {
  version: 1;
  seller: SellerDetails;
  buyer: BuyerTaxDetails;
  billingAddress: ShippingAddress;
  shippingAddress: ShippingAddress;
  placeOfSupply: { state: string; code: string; basis: string };
  documentTitle:
    | "Tax Invoice"
    | "Bill of Supply"
    | "Invoice-cum-Bill of Supply";
  lines: TaxLine[];
  subtotal: number;
  discount: number;
  taxable: number;
  exemptValue: number;
  tax: number;
  shipping: number;
  shippingTax: number;
  roundOff: number;
  total: number;
  shippingPolicy: string;
  roundingPolicy: string;
  reverseCharge: false;
}
export interface InvoiceDocument {
  version: 1;
  number: string;
  issuedAt: string;
  orderId: string;
  orderDate: string;
  state: "issued" | "draft" | "legacy" | "sample";
  title: string;
  seller: SellerDetails;
  shippingAddress: ShippingAddress;
  billingAddress: ShippingAddress;
  buyer: BuyerTaxDetails;
  tax?: TaxSnapshot;
  legacyItems?: { description: string; quantity: number; price: number }[];
  total: number;
  discount: number;
  shipping: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionReference: string;
  signatureMode: BusinessSettings["signatureMode"];
  notes: string[];
}
