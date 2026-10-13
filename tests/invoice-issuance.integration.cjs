// Explicit opt-in command: local, disposable MongoDB replica set. No configured URI is used.
const assert = require("node:assert/strict"),
  mongoose = require("mongoose");
const { MongoMemoryReplSet } = require("mongodb-memory-server"),
  loader = require("./load-ts.cjs");
const { settings, address, line, order } = require("./invoice-fixtures.cjs");
async function main() {
  const repl = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
    binary: { version: "8.2.6" },
  });
  try {
    await mongoose.connect(repl.getUri(), {
      dbName: "techai_invoice_synthetic",
    });
    let current = settings(),
      renders = 0;
    const load = loader({
      "./server-business-settings": {
        getBusinessSettings: async () => structuredClone(current),
      },
      "./invoice-pdf": {
        renderInvoicePdf: async (document) => {
          renders++;
          return Buffer.from(JSON.stringify(document));
        },
      },
    });
    const Order = load("src/models/Order.ts").default,
      Invoice = load("src/models/Invoice.ts").default,
      Sequence = load("src/models/InvoiceSequence.ts").default;
    const { calculateTaxOrder } = load("src/lib/tax.ts"),
      { issueInvoice, issuedInvoiceAttachment } = load(
        "src/lib/server-invoice.ts",
      );
    await Promise.all([Order.init(), Invoice.init(), Sequence.init()]);
    const snapshot = calculateTaxOrder(
      settings(),
      [line()],
      address,
      { kind: "consumer" },
      0,
      0,
    );
    const create = async (id) => {
      const data = order(snapshot, id);
      return Order.create({
        ...data,
        items: snapshot.lines.map((l) => ({
          productId: l.productId,
          title: l.description,
          price: l.unitPrice / 100,
          quantity: l.quantity,
          image: "/sample.png",
        })),
      });
    };
    await Promise.all(["SAMPLE-A", "SAMPLE-B", "SAMPLE-C"].map(create));
    const issued = await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        issueInvoice(
          ["SAMPLE-A", "SAMPLE-B", "SAMPLE-C"][i % 3],
          "SAMPLE-ADMIN",
          i % 3 === 2 ? "Paid" : undefined,
        ),
      ),
    );
    assert.equal(await Invoice.countDocuments(), 3);
    assert.equal(new Set(issued.map((i) => i.number)).size, 3);
    const counters = await Sequence.find({});
    assert.equal(counters.length, 1);
    assert.equal(counters[0].value, 3);
    assert.equal(
      (await Invoice.findOne({ orderId: "SAMPLE-C" })).document.paymentStatus,
      "Paid",
    );
    assert.equal(
      (await Order.findOne({ orderId: "SAMPLE-C" })).paymentStatus,
      "Paid",
    );
    const original = await Invoice.findOne({ orderId: "SAMPLE-A" }),
      bytes = Buffer.from(original.pdf),
      number = original.number;
    current.seller.legalName = "Changed settings after issue";
    current.enabled = false;
    const repeated = await issueInvoice("SAMPLE-A", "SAMPLE-ADMIN");
    assert.equal(repeated.number, number);
    assert.deepEqual(Buffer.from(repeated.pdf), bytes);
    assert.deepEqual(
      (await issuedInvoiceAttachment("SAMPLE-A")).content,
      bytes,
    );
    await Invoice.updateOne(
      { orderId: "SAMPLE-A" },
      { $set: { document: { tampered: true }, pdf: Buffer.from("changed") } },
    );
    assert.deepEqual(
      Buffer.from((await Invoice.findOne({ orderId: "SAMPLE-A" })).pdf),
      bytes,
    );
    await Order.updateOne(
      { orderId: "SAMPLE-A" },
      { $set: { taxSnapshot: { total: 1 } } },
    );
    assert.equal(
      (await Order.findOne({ orderId: "SAMPLE-A" })).taxSnapshot.total,
      snapshot.total,
    );
    current = settings();
    await create("SAMPLE-UNPAID");
    await Order.updateOne(
      { orderId: "SAMPLE-UNPAID" },
      { $set: { paymentMethod: "UPI" } },
    );
    await assert.rejects(
      issueInvoice("SAMPLE-UNPAID", "SAMPLE-ADMIN"),
      /Verify online payment/,
    );
    assert.equal((await Sequence.findOne({})).value, 3);
    const b2b = calculateTaxOrder(
      settings(),
      [line()],
      address,
      {
        kind: "registered",
        gstin: "32AFVFS6088Q1ZR",
        businessName: "SAMPLE B2B",
        billingAddress: address,
      },
      0,
      0,
    );
    await Order.create({ ...order(b2b, "SAMPLE-B2B"), items: [] });
    current.einvoice = "required";
    await assert.rejects(
      issueInvoice("SAMPLE-B2B", "SAMPLE-ADMIN"),
      /IRP integration/,
    );
    assert.equal((await Sequence.findOne({})).value, 3);
    console.log(
      JSON.stringify({
        concurrentRequests: 12,
        issuedDocuments: 3,
        sequence: 3,
        idempotent: true,
        storedBytesImmutable: true,
        unpaidOnlineBlocked: true,
        pdfRenderAttempts: renders,
      }),
    );
  } finally {
    await mongoose.disconnect();
    await repl.stop();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
