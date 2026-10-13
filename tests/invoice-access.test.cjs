const test = require("node:test"),
  assert = require("node:assert/strict"),
  loader = require("./load-ts.cjs");
const {
  settings,
  address,
  line,
  order,
  productTax,
} = require("./invoice-fixtures.cjs");
const load = loader(),
  { calculateTaxOrder } = load("src/lib/tax.ts");
const snapshot = () =>
  calculateTaxOrder(settings(), [line()], address, { kind: "consumer" }, 0, 0);
const req = (path = "/api/orders/SAMPLE/invoice", body) =>
  new Request(
    "http://localhost" + path,
    body ? { method: "POST", body: JSON.stringify(body) } : undefined,
  );

test("invoice downloads enforce owner/admin access, keep drafts read-only and reuse stored PDF bytes", async () => {
  let customer = null,
    admin = null,
    query,
    issued = null,
    renders = 0;
  const record = order(snapshot(), "SAMPLE");
  const { GET } = loader({
    "@/lib/auth": {
      ADMIN_SESSION_COOKIE: "admin",
      CUSTOMER_SESSION_COOKIE: "customer",
      getSessionFromCookie: async (cookie) =>
        cookie === "admin" ? admin : customer,
    },
    "@/lib/mongodb": { connectToDatabase: async () => {} },
    "@/models/Order": {
      findOne: async (filter) => {
        query = filter;
        return filter.customerId && filter.customerId !== "sample-customer"
          ? null
          : record;
      },
    },
    "@/models/Invoice": { findOne: async () => issued },
    "@/lib/server-business-settings": {
      getBusinessSettings: async () => settings(),
    },
    "@/lib/server-invoice": {
      invoicePdf: async (doc) => {
        assert.equal(doc.number, "");
        renders++;
        return Buffer.from("DRAFT-PDF");
      },
      issueInvoice: () => assert.fail("GET cannot issue"),
    },
  })("src/app/api/orders/[id]/invoice/route.ts");
  const params = { params: Promise.resolve({ id: "SAMPLE" }) };
  assert.equal((await GET(req(), params)).status, 401);
  assert.equal(query, undefined);
  customer = { role: "customer", id: "other" };
  assert.equal((await GET(req(), params)).status, 404);
  customer = { role: "customer", id: "sample-customer" };
  let response = await GET(req(), params);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("X-Invoice-State"), "draft");
  assert.equal(renders, 1);
  issued = {
    document: { state: "issued" },
    number: "TA/26-27/000001",
    pdf: Buffer.from("IMMUTABLE-PDF"),
  };
  for (let i = 0; i < 3; i++) {
    response = await GET(req("/api/orders/SAMPLE/invoice?download=1"), params);
    assert.equal(await response.text(), "IMMUTABLE-PDF");
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
    assert.match(response.headers.get("Content-Disposition"), /^attachment/);
  }
  assert.equal(renders, 1);
  admin = { role: "admin", id: "admin" };
  customer = null;
  assert.equal((await GET(req(), params)).status, 200);
  assert.equal(query.customerId, undefined);
});
test("business settings are authorized, seeded disabled and require explicit approval", async () => {
  const { INITIAL_BUSINESS_SETTINGS, validateBusinessSettings } = load(
    "src/lib/business-settings.ts",
  );
  assert.equal(INITIAL_BUSINESS_SETTINGS.enabled, false);
  assert.deepEqual(INITIAL_BUSINESS_SETTINGS.approvedRates, []);
  assert.equal(INITIAL_BUSINESS_SETTINGS.seller.phone, "");
  assert.throws(
    () =>
      validateBusinessSettings({ ...INITIAL_BUSINESS_SETTINGS, enabled: true }),
    /Confirm/,
  );
  assert.equal(
    validateBusinessSettings(settings()).seller.gstin,
    "32AFVFS6088Q1ZR",
  );
  const { PUT } = loader({
    "@/lib/auth": { getSessionFromCookie: async () => null },
    "@/lib/mongodb": {
      connectToDatabase: () => assert.fail("Unauthorized DB access"),
    },
  })("src/app/api/admin/business-settings/route.ts");
  assert.equal(
    (
      await PUT(
        new Request("http://localhost", {
          method: "PUT",
          body: JSON.stringify(settings()),
        }),
      )
    ).status,
    403,
  );
});
test("product edits preserve tax when omitted and reject invalid, dotted or unapproved rate updates", async () => {
  let saved = { productId: "sample", price: 118, tax: productTax() },
    writes = 0;
  const { PATCH } = loader({
    "@/lib/auth": { getSessionFromCookie: async () => ({ role: "admin" }) },
    "@/lib/mongodb": { connectToDatabase: async () => {} },
    "@/lib/server-business-settings": {
      getBusinessSettings: async () => settings(),
    },
    "@/models/Product": {
      findOneAndUpdate: async (_q, update) => {
        Object.assign(saved, update.$set);
        writes++;
        return saved;
      },
    },
  })("src/app/api/products/[id]/route.ts");
  const edit = (body) =>
    PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ id: "sample" }) },
    );
  assert.equal((await edit({ title: "Edited description" })).status, 200);
  assert.deepEqual(saved.tax, productTax());
  assert.equal(saved.price, 118);
  assert.equal((await edit({ tax: { ...productTax(), rate: 7 } })).status, 400);
  assert.equal((await edit({ "tax.rate": 7 })).status, 400);
  assert.equal(writes, 1);
  const r = await edit({ tax: productTax(5, "exclusive") });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).product.tax.priceBasis, "exclusive");
  assert.equal(saved.price, 118);
});
test("public quote ignores client prices/rates, groups duplicates and matches trusted order math", async () => {
  const p = {
    productId: "sample",
    title: "Synthetic",
    price: 118,
    tax: productTax(),
    sku: "SKU",
  };
  const { POST } = loader({
    "@/lib/mongodb": { connectToDatabase: async () => {} },
    "./server-business-settings": {
      getBusinessSettings: async () => settings(),
    },
    "@/models/Product": { findOne: () => ({ lean: async () => p }) },
  })("src/app/api/checkout/quote/route.ts");
  const result = await POST(
    req("/api/checkout/quote", {
      items: [
        { productId: "sample", quantity: 1, price: 1, tax: { rate: 0 } },
        { productId: "sample", quantity: 1 },
      ],
      shippingAddress: address,
      buyerTax: { kind: "consumer" },
    }),
  );
  assert.equal(result.status, 200);
  const body = await result.json();
  assert.equal(body.tax.lines[0].quantity, 2);
  assert.equal(body.tax.lines[0].rate, 18);
  assert.equal(body.tax.total, 28500);
});
test("Razorpay creation rejects a snapshot mismatch before contacting the gateway", async () => {
  const { POST } = loader({
    "@/lib/auth": { getSessionFromCookie: async () => ({ id: "owner" }) },
    "@/lib/mongodb": { connectToDatabase: async () => {} },
    "@/models/Order": {
      findOne: async () => ({
        customerId: "owner",
        paymentMethod: "UPI",
        paymentStatus: "Pending",
        status: "Placed",
        finalAmount: 100,
        taxSnapshot: { total: 11800 },
      }),
    },
    "@/lib/razorpay-server": {
      getRazorpayConfig: () => assert.fail("No gateway contact"),
    },
  })("src/app/api/payment/create-order/route.ts");
  assert.equal(
    (await POST(req("/api/payment/create-order", { orderId: "SAMPLE" })))
      .status,
    409,
  );
});

test("Excel tax export includes shipping components and reconciles to the invoice snapshot", () => {
  const XLSX = require("xlsx"); let workbook;
  const {exportSingleOrderToExcel} = loader({xlsx:{...XLSX,writeFile:value=>{workbook=value;}}})("src/lib/exportOrderExcel.ts");
  const tax = calculateTaxOrder(settings(),[line("a",118,18),line("b",100,5,"exclusive")],address,{kind:"consumer"},10,49);
  exportSingleOrderToExcel(order(tax));
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets["Tax Snapshots"]);
  assert.equal(rows.filter(r=>r["Line type"] === "shipping").length,2);
  assert.equal(Math.round(rows.reduce((sum,r)=>sum+r["Line total INR"],0)*100)+tax.roundOff,tax.total);
  assert.equal(Math.round(rows.reduce((sum,r)=>sum+r["CGST INR"]+r["SGST INR"],0)*100),tax.tax);
});

test("refund item value uses recorded GST-inclusive line totals after product edits", () => {
  const tax=calculateTaxOrder(settings(),[line("a",100,18,"exclusive",2)],address,{kind:"consumer"},0,0);
  const {getRefundableLineAmountPaise}=load("src/lib/refunds.ts");
  const record={taxSnapshot:tax,items:[{productId:"a",price:999,quantity:2}],discountAmount:0};
  assert.equal(getRefundableLineAmountPaise(record,"a",1),11800);
  assert.equal(getRefundableLineAmountPaise(record,"a",2),23600);
});
