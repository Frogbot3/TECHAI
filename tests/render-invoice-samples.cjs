// Generates synthetic artifacts only; never connects to a database or sends mail.
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const load = require("./load-ts.cjs")(),
  { settings, address, line, order } = require("./invoice-fixtures.cjs");
const { calculateTaxOrder } = load("src/lib/tax.ts"),
  { invoiceDraft, deliveryQrPayload } = load("src/lib/invoice-document.ts"),
  { renderInvoicePdf } = load("src/lib/invoice-pdf.ts");
const assets = {
  fontBase64: fs
    .readFileSync("public/fonts/NotoSans-Regular.ttf")
    .toString("base64"),
  logoDataUrl:
    "data:image/png;base64," +
    fs.readFileSync("public/brand/techai-logo.png").toString("base64"),
};
async function main() {
  const {
    createCanvas,
    DOMMatrix,
    ImageData,
    Path2D,
  } = require("@napi-rs/canvas");
  Object.assign(global, { DOMMatrix, ImageData, Path2D });
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const {
    RGBLuminanceSource,
    BinaryBitmap,
    HybridBinarizer,
    QRCodeReader,
  } = require("@zxing/library");
  const longAddress = {
    ...address,
    fullName:
      "Sample Recipient with a deliberately long name for invoice wrapping",
    houseNumber: "Sample Building 7, Third Floor, Unit 12",
    street:
      "Example Technology Park, West Service Road, beside the sample distribution centre and pedestrian entrance",
    landmark:
      "Opposite the fictional demonstration library; use the marked visitor entrance",
    city: "Example Bengaluru District",
    state: "Karnataka",
    pincode: "560001",
  };
  const cases = [
    {
      name: "sample-mixed-intrastate",
      lines: [
        line("a", 118, 18, "inclusive", 2),
        line("b", 100, 5, "exclusive", 3),
      ],
      ship: address,
      discount: 23.6,
      freight: 49,
    },
    {
      name: "sample-interstate",
      lines: [line("a", 112, 12), line("b", 100, 18, "exclusive")],
      ship: {
        ...address,
        state: "Karnataka",
        city: "Bengaluru",
        pincode: "560001",
      },
      discount: 0,
      freight: 49,
    },
    {
      name: "sample-multipage",
      lines: Array.from({ length: 38 }, (_, i) => ({
        ...line(
          "item-" + (i + 1),
          118 + i / 100,
          i % 2 ? 5 : 18,
          "inclusive",
          (i % 3) + 1,
        ),
        description:
          "SAMPLE product " +
          (i + 1) +
          " with a long technical description to verify wrapping across multiple printed invoice pages",
        variant: "Sample finish / Sample specification",
      })),
      ship: longAddress,
      discount: 100,
      freight: 0,
    },
  ];
  const output = path.resolve("output/pdf");
  fs.mkdirSync(output, { recursive: true });
  const report = [];
  for (const [i, c] of cases.entries()) {
    const tax = calculateTaxOrder(
      settings(),
      c.lines,
      c.ship,
      { kind: "consumer" },
      c.discount,
      c.freight,
    );
    const document = {
      ...invoiceDraft(order(tax, "SAMPLE-ORDER-" + (i + 1)), settings()),
      state: "sample",
      number: "SAMPLE-" + (i + 1),
      issuedAt: "2026-10-12T05:00:00.000Z",
      notes: [
        "SAMPLE — synthetic fixture, not a transaction. Product classifications and rates are illustrative.",
      ],
    };
    const bytes = await renderInvoicePdf(document, assets);
    fs.writeFileSync(path.join(output, c.name + ".pdf"), bytes);
    const pdf = await pdfjs.getDocument({ data: bytes, useSystemFonts: false })
      .promise;
    let foundQr = false,
      allText = "",
      pageStats = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n),
        viewport = page.getViewport({ scale: 2 });
      const canvas = createCanvas(
          Math.ceil(viewport.width),
          Math.ceil(viewport.height),
        ),
        context = canvas.getContext("2d");
      await page.render({ canvasContext: context, viewport }).promise;
      fs.writeFileSync(
        path.join(output, c.name + "-page-" + n + ".png"),
        canvas.toBuffer("image/png"),
      );
      const content = await page.getTextContent();
      const text = content.items.map((t) => t.str || "").join(" ");
      allText += text;
      assert.match(text, /Page \d+ of \d+/);
      assert.match(text, /SAMPLE/);
      pageStats.push({ page: n, textItems: content.items.length });
      const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      ).data;
      const luminance = new Uint8ClampedArray(canvas.width * canvas.height);
      for (let p = 0; p < luminance.length; p++)
        luminance[p] =
          (pixels[p * 4] * 306 +
            pixels[p * 4 + 1] * 601 +
            pixels[p * 4 + 2] * 117) >>
          10;
      try {
        const decoded = new QRCodeReader()
          .decode(
            new BinaryBitmap(
              new HybridBinarizer(
                new RGBLuminanceSource(luminance, canvas.width, canvas.height),
              ),
            ),
          )
          .getText();
        assert.equal(decoded, deliveryQrPayload(document));
        foundQr = true;
      } catch (error) {
        if (error.name === "AssertionError") throw error;
      }
    }
    assert.ok(foundQr, c.name + " QR must decode from the rendered PDF");
    assert.ok(
      allText.includes("₹"),
      "Embedded font must expose the rupee glyph",
    );
    assert.ok(allText.includes("SUPPLYCO"));
    assert.ok(allText.includes("Grand total"));
    if (i === 2) assert.ok(pdf.numPages > 2, "long fixture must paginate");
    report.push({
      sample: c.name,
      pages: pdf.numPages,
      qrDecoded: foundQr,
      totalPaise: tax.total,
      ...{ pageStats },
    });
    await pdf.cleanup();
  }
  fs.writeFileSync(
    path.join(output, "verification.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
