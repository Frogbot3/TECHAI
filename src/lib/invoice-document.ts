import type { InvoiceDocument, BusinessSettings } from "./tax-types";
import type { Order } from "./types";
export function financialYear(date: Date) {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
  }).formatToParts(date);
  const year = Number(parts.find((p) => p.type === "year")!.value),
    month = Number(parts.find((p) => p.type === "month")!.value);
  const start = month >= 4 ? year : year - 1;
  return `${String(start).slice(-2)}-${String(start + 1).slice(-2)}`;
}
export function invoiceNumber(prefix: string, fy: string, sequence: number) {
  if (
    !/^[A-Z0-9]{1,3}$/.test(prefix) ||
    !/^\d{2}-\d{2}$/.test(fy) ||
    !Number.isInteger(sequence) ||
    sequence < 1 ||
    sequence > 999999
  )
    throw Error("Invoice series is invalid or exhausted.");
  return `${prefix}/${fy}/${String(sequence).padStart(6, "0")}`;
}
export function deliveryQrPayload(
  doc: Pick<InvoiceDocument, "orderId" | "shippingAddress">,
) {
  const a = doc.shippingAddress;
  return `Order: ${doc.orderId}\nRecipient: ${a.fullName}\nAddress: ${[a.houseNumber, a.street, a.landmark, a.city, a.state, a.pincode, a.country || "India"].filter(Boolean).join(", ")}`;
}
export function invoiceDraft(
  order: Order,
  settings: BusinessSettings,
): InvoiceDocument {
  const tax = order.taxSnapshot;
  return {
    version: 1,
    number: "",
    issuedAt: "",
    orderId: order.id,
    orderDate: order.createdAt,
    state: tax ? "draft" : "legacy",
    title: tax ? tax.documentTitle : "Order summary - tax details unavailable",
    seller: tax?.seller || settings.seller,
    shippingAddress: tax?.shippingAddress || order.shippingAddress,
    billingAddress: tax?.billingAddress || order.shippingAddress,
    buyer: tax?.buyer || { kind: "consumer" },
    tax,
    legacyItems: tax
      ? undefined
      : order.items.map((i) => ({
          description: [i.product.title, i.selectedColor, i.selectedSize]
            .filter(Boolean)
            .join(" / "),
          quantity: i.quantity,
          price: Math.round(i.product.price * 100),
        })),
    total: tax?.total ?? Math.round(order.finalAmount * 100),
    discount: tax?.discount ?? Math.round(order.discountAmount * 100),
    shipping: tax?.shipping ?? Math.round(order.shippingFee * 100),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    transactionReference:
      order.paymentDetails?.transactionId || order.razorpayPaymentId || "",
    signatureMode: settings.signatureMode,
    notes: tax
      ? ["Discounts shown on lines are already deducted from taxable values."]
      : [
          "Legacy order: recorded totals retained; tax and original seller details require review. This is not a tax invoice.",
          "Seller shown is the currently configured business, not a verified historical seller snapshot.",
        ],
  };
}
export function amountInWords(paise: number): string {
  const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ],
    tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
  const words = (n: number): string =>
    n < 20
      ? ones[n]
      : n < 100
        ? tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "")
        : n < 1000
          ? ones[Math.floor(n / 100)] +
            " Hundred" +
            (n % 100 ? " " + words(n % 100) : "")
          : n < 100000
            ? words(Math.floor(n / 1000)) +
              " Thousand" +
              (n % 1000 ? " " + words(n % 1000) : "")
            : n < 10000000
              ? words(Math.floor(n / 100000)) +
                " Lakh" +
                (n % 100000 ? " " + words(n % 100000) : "")
              : words(Math.floor(n / 10000000)) +
                " Crore" +
                (n % 10000000 ? " " + words(n % 10000000) : "");
  return `Rupees ${words(Math.floor(paise / 100)) || "Zero"}${paise % 100 ? " and " + words(paise % 100) + " Paise" : ""} Only`;
}
