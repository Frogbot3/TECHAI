const test = require("node:test"),
  assert = require("node:assert/strict"),
  loader = require("./load-ts.cjs");
const load = loader(),
  tax = load("src/lib/tax.ts"),
  docs = load("src/lib/invoice-document.ts");
const {
  settings,
  productTax,
  address,
  line,
  order,
} = require("./invoice-fixtures.cjs");
const calc = (
  lines,
  changes = {},
  ship = address,
  buyer = { kind: "consumer" },
  discount = 0,
  freight = 0,
) =>
  tax.calculateTaxOrder(
    { ...settings(), ...changes },
    lines,
    ship,
    buyer,
    discount,
    freight,
  );

test("mixed inclusive/exclusive lines use independent rates and exact quantities", () => {
  const result = calc([
    line("a", 118, 18, "inclusive", 2),
    line("b", 100, 5, "exclusive", 3),
  ]);
  assert.deepEqual(
    result.lines.map((l) => [l.taxable, l.tax, l.total]),
    [
      [20000, 3600, 23600],
      [30000, 1500, 31500],
    ],
  );
  assert.equal(result.total, 55100);
  assert.equal(result.cgst, 2550);
  assert.equal(result.sgst, 2550);
  assert.equal(result.igst, 0);
  const inter = calc(
    [line()],
    {},
    { ...address, state: "Karnataka", pincode: "560001" },
  );
  assert.equal(inter.igst, 1800);
  assert.equal(inter.cgst + inter.sgst, 0);
  assert.equal(inter.placeOfSupply.code, "29");
});
test("before-supply discounts, mixed-rate freight and rounding reconcile every paise", () => {
  const r = calc(
    [line("a", 118, 18), line("b", 105, 5)],
    {},
    address,
    undefined,
    22.3,
    49,
  );
  assert.deepEqual(
    r.lines.slice(0, 2).map((l) => l.discount),
    [1180, 1050],
  );
  assert.equal(r.shipping, 4900);
  assert.equal(r.total, 24970);
  assert.equal(r.discount, 2230);
  assert.equal(
    r.total,
    r.taxable + r.exemptValue + r.cgst + r.sgst + r.utgst + r.igst + r.roundOff,
  );
  assert.deepEqual(
    r.lines.filter((l) => l.kind === "shipping").map((l) => l.rate),
    [18, 5],
  );
  const rounded = calc([line("a", 1.01, 18, "exclusive")], {
    rounding: "rupee",
  });
  assert.equal(rounded.total, 100);
  assert.equal(rounded.roundOff, -19);
  assert.deepEqual(tax.allocate(2, [1, 1, 1]), [1, 1, 0]);
  for (let cents = 1; cents < 300; cents++) {
    const v = tax.taxAmounts(cents, productTax(), true);
    assert.equal(v.cgst + v.sgst, v.tax);
    assert.equal(v.taxable + v.tax, v.total);
  }
  const separate = calc(
    [line()],
    {
      shippingMode: "separate-supply",
      shippingTax: productTax(5, "exclusive"),
      shippingPriceBasis: "exclusive",
    },
    address,
    undefined,
    0,
    49,
  );
  assert.equal(separate.shipping, 5145);
  assert.equal(separate.shippingTax, 245);
});
test("missing configuration, unsafe custom rates and unsupported special taxes fail closed", () => {
  assert.throws(
    () => calc([{ ...line(), tax: undefined }]),
    /Tax setup required/,
  );
  assert.throws(
    () => calc([line()], { existingPriceBasis: "unconfirmed" }),
    /Tax setup required/,
  );
  assert.throws(
    () => calc([line()], { shippingMode: "unconfigured" }),
    /policies/,
  );
  assert.throws(() => calc([line("a", 100, 7)]), /not been approved/);
  assert.equal(
    calc([line("a", 100, 7)], { customRatesAllowed: true }).lines[0].rate,
    7,
  );
  for (const patch of [
    { rate: -1 },
    { rate: 18.001 },
    { hsn: "bad" },
    { priceBasis: "" },
    { cess: "review-required" },
    { reverseCharge: true },
  ])
    assert.throws(() =>
      calc([{ ...line(), tax: { ...productTax(), ...patch } }]),
    );
  assert.throws(() => calc([line()], {}, address, { kind: "sez" }), /review/);
  assert.throws(() => tax.paise(0.1 + 0.2), /decimal/);
  assert.throws(
    () => calc([line()], {}, { ...address, pincode: "bad" }),
    /address/,
  );
});
test("B2C delivery and B2B bill-to/ship-to use distinct legal place-of-supply rules", () => {
  const ship = { ...address, state: "Karnataka", pincode: "560001" };
  const consumer = calc([line()], {}, ship, {
    kind: "consumer",
    billingAddress: address,
  });
  assert.equal(consumer.placeOfSupply.code, "29");
  const business = {
    kind: "bill-to-ship-to",
    businessName: "SAMPLE BUYER",
    gstin: "32AFVFS6088Q1ZR",
    billingAddress: address,
  };
  assert.equal(calc([line()], {}, ship, business).placeOfSupply.code, "32");
  assert.throws(
    () => calc([line()], {}, ship, { ...business, kind: "registered" }),
    /bill-to/,
  );
  assert.throws(
    () => calc([line()], { einvoice: "required" }, ship, business),
    /IRP/,
  );
  assert.equal(tax.validGstin(business.gstin), true);
  assert.equal(tax.validGstin(business.gstin.slice(0, -1) + "0"), false);
});
test("nil-rated, exempt and non-GST remain distinct; mixed B2B is not mislabelled", () => {
  for (const treatment of ["nil-rated", "exempt", "non-gst"]) {
    const r = calc([{ ...line(), tax: productTax(0, "inclusive", treatment) }]);
    assert.equal(r.documentTitle, "Bill of Supply");
    assert.equal(r.tax, 0);
    assert.equal(r.lines[0].treatment, treatment);
  }
  const lines = [
    line(),
    { ...line("b"), tax: productTax(0, "inclusive", "exempt") },
  ];
  assert.equal(calc(lines).documentTitle, "Invoice-cum-Bill of Supply");
  assert.throws(
    () =>
      calc(lines, {}, address, {
        kind: "registered",
        gstin: "32AFVFS6088Q1ZR",
        businessName: "SAMPLE",
        billingAddress: address,
      }),
    /separate documents/,
  );
});
test("snapshot history is independent of product and business edits; legacy totals remain recorded", () => {
  const s = settings(),
    l = line(),
    a = structuredClone(address),
    r = tax.calculateTaxOrder(s, [l], a, { kind: "consumer" }, 0, 0);
  s.seller.legalName = "Changed";
  l.price = 999;
  l.tax.rate = 5;
  a.street = "Changed";
  assert.equal(r.total, 11800);
  assert.equal(r.lines[0].rate, 18);
  assert.equal(r.seller.legalName, settings().seller.legalName);
  assert.equal(r.shippingAddress.street, address.street);
  const draft = docs.invoiceDraft(order(r), s);
  assert.equal(draft.number, "");
  assert.equal(draft.state, "draft");
  assert.equal(draft.seller.legalName, r.seller.legalName);
  const legacy = docs.invoiceDraft(
    { ...order(r), taxSnapshot: undefined, finalAmount: 777.77 },
    s,
  );
  assert.equal(legacy.total, 77777);
  assert.equal(legacy.state, "legacy");
  assert.match(legacy.title, /tax details unavailable/);
});
test("FY uses IST at April boundary and series never exceeds sixteen characters", () => {
  assert.equal(docs.financialYear(new Date("2026-03-31T18:29:59Z")), "25-26");
  assert.equal(docs.financialYear(new Date("2026-03-31T18:30:00Z")), "26-27");
  assert.equal(docs.invoiceNumber("TA", "26-27", 1), "TA/26-27/000001");
  assert.equal(docs.invoiceNumber("ABC", "26-27", 999999).length, 16);
  assert.throws(() => docs.invoiceNumber("TA", "26-27", 1000000));
});
test("QR payload contains only reference, recipient and printed shipping address", () => {
  const payload = docs.deliveryQrPayload({
    orderId: "SAMPLE-1",
    shippingAddress: {
      ...address,
      phone: "PRIVATE-PHONE",
      email: "PRIVATE-EMAIL",
      deliveryInstructions: "SECRET",
      coordinates: { lat: 1, lng: 2 },
    },
  });
  assert.match(payload, /SAMPLE-1/);
  assert.match(payload, /679552/);
  assert.doesNotMatch(payload, /PRIVATE|SECRET|lat|GST|payment/i);
  assert.equal(
    docs.amountInWords(123456789),
    "Rupees Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven and Eighty Nine Paise Only",
  );
});
