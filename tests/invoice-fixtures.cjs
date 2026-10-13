// Synthetic values only. HSN/rates below demonstrate calculation, not product classification.
const load = require("./load-ts.cjs")();
const { INITIAL_BUSINESS_SETTINGS } = load("src/lib/business-settings.ts");
const settings = () => ({
  ...structuredClone(INITIAL_BUSINESS_SETTINGS),
  enabled: true,
  existingPriceBasis: "inclusive",
  approvedRates: [5, 12, 18, 28],
  shippingMode: "allocated-incidental",
  shippingPriceBasis: "inclusive",
  discountPolicy: "before-supply-proportional",
  invoicePrefix: "TA",
  signatureMode: "wet-signature",
  einvoice: "not-applicable",
  approvalNote:
    "SYNTHETIC TEST ONLY: incidental freight allocation approved for fixture.",
});
const productTax = (
  rate = 18,
  priceBasis = "inclusive",
  treatment = "taxable",
) => ({
  rate,
  priceBasis,
  treatment,
  hsn: "8471",
  unit: "NOS",
  cess: "none",
  reverseCharge: false,
});
const address = {
  fullName: "Sample Recipient",
  houseNumber: "Sample Building 7",
  street: "Example Street",
  city: "Thrithala",
  state: "Kerala",
  pincode: "679552",
  country: "India",
  phone: "",
  email: "",
};
const line = (
  id = "sample-a",
  price = 118,
  rate = 18,
  basis = "inclusive",
  quantity = 1,
) => ({
  productId: id,
  sku: id.toUpperCase(),
  description: "SAMPLE product " + id,
  variant: "Example variant",
  price,
  quantity,
  tax: productTax(rate, basis),
});
function order(snapshot, id = "SAMPLE-ORDER-001") {
  return {
    id,
    orderId: id,
    customerId: "sample-customer",
    createdAt: "2026-10-12T05:00:00.000Z",
    shippingAddress: structuredClone(snapshot.shippingAddress),
    taxSnapshot: snapshot,
    items: snapshot.lines
      .filter((l) => l.kind === "product")
      .map((l) => ({
        product: {
          id: l.productId,
          title: l.description,
          price: l.unitPrice / 100,
        },
        quantity: l.quantity,
        selectedColor: l.variant,
      })),
    totalAmount: snapshot.subtotal / 100,
    discountAmount: snapshot.discount / 100,
    shippingFee: snapshot.shipping / 100,
    finalAmount: snapshot.total / 100,
    paymentMethod: "COD",
    paymentStatus: "Pending",
    status: "Processing",
    statusHistory: [],
  };
}
module.exports = { settings, productTax, address, line, order };
