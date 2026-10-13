import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import { amountInWords, deliveryQrPayload } from "./invoice-document";
import type { InvoiceDocument } from "./tax-types";

export interface InvoiceAssets {
  fontBase64: string;
  logoDataUrl: string;
}
export async function renderInvoicePdf(
  invoice: InvoiceDocument,
  assets: InvoiceAssets,
): Promise<Uint8Array> {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.addFileToVFS("NotoSans.ttf", assets.fontBase64);
  doc.addFont("NotoSans.ttf", "NotoSans", "normal");
  doc.setFont("NotoSans");
  const money = (n: number) =>
    "₹" +
    (n / 100).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const date = (v: string) =>
    v
      ? new Date(v).toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Not issued";
  const navy: [number, number, number] = [15, 23, 42],
    teal: [number, number, number] = [15, 118, 110];
  let y = 17;
  const text = (
    value: string,
    x: number,
    top: number,
    width: number,
    size = 8,
  ) => {
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(value, width);
    doc.text(lines, x, top);
    return lines.length * size * 0.3528 * 1.2;
  };
  const room = (height: number) => {
    if (y + height > 274) {
      doc.addPage();
      y = 19;
    }
  };
  const table = (
    head: string[][],
    body: (string | number)[][],
    widths?: Record<number, number>,
  ) => {
    autoTable(doc, {
      startY: y,
      head,
      body,
      margin: { left: 14, right: 14, top: 20, bottom: 23 },
      styles: {
        font: "NotoSans",
        fontStyle: "normal",
        fontSize: 7,
        cellPadding: 2.1,
        textColor: navy,
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: navy,
        textColor: [255, 255, 255],
        fontStyle: "normal",
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: widths
        ? Object.fromEntries(
            Object.entries(widths).map(([k, w]) => [k, { cellWidth: w }]),
          )
        : {},
      showHead: "everyPage",
      rowPageBreak: "avoid",
    });
    y = (doc as any).lastAutoTable.finalY + 7;
  };
  doc.setFillColor(...teal);
  doc.rect(14, 10, 182, 1.3, "F");
  const image = doc.getImageProperties(assets.logoDataUrl);
  const logoWidth = 39,
    logoHeight = (logoWidth * image.height) / image.width;
  doc.addImage(assets.logoDataUrl, 14, y, logoWidth, logoHeight);
  doc.setTextColor(...navy);
  const status =
    invoice.state === "issued"
      ? "ORIGINAL FOR RECIPIENT"
      : invoice.state === "sample"
        ? "SAMPLE - NOT VALID FOR TAX"
        : "DRAFT - NOT ISSUED";
  text(status, 111, y + 2, 85, 8);
  text(invoice.title, 111, y + 9, 85, 11);
  text(
    invoice.number || "Invoice number assigned at dispatch",
    111,
    y + 22,
    85,
    8,
  );
  text("Issue date: " + date(invoice.issuedAt), 111, y + 28, 85, 8);
  y += Math.max(logoHeight + 6, 16);
  const s = invoice.seller;
  y += text("Sold by: " + s.legalName, 14, y, 91, 8.2) + 2;
  y +=
    text(
      [
        s.building,
        s.road,
        s.town,
        s.district,
        `${s.state} ${s.pincode}`,
        s.country,
      ]
        .filter(Boolean)
        .join(", "),
      14,
      y,
      91,
      8,
    ) + 2;
  y +=
    text(`GSTIN: ${s.gstin} | State code: ${s.stateCode}`, 14, y, 182, 8) + 2;
  if (s.phone || s.email)
    y +=
      text([s.phone, s.email].filter(Boolean).join(" | "), 14, y, 182, 8) + 2;
  y = Math.max(y + 3, 58);
  table(
    [
      [
        "Order reference / date",
        "Payment at " + (invoice.state === "issued" ? "issue" : "preview"),
      ],
    ],
    [
      [
        invoice.orderId + "\n" + date(invoice.orderDate),
        `${invoice.paymentMethod} / ${invoice.paymentStatus}${invoice.transactionReference ? "\nTransaction: " + invoice.transactionReference : ""}`,
      ],
    ],
  );
  const address = (a: InvoiceDocument["shippingAddress"]) =>
    [
      a.fullName,
      [a.houseNumber, a.street, a.landmark].filter(Boolean).join(", "),
      [a.city, a.state, a.pincode].filter(Boolean).join(", "),
      a.country || "India",
    ]
      .filter(Boolean)
      .join("\n");
  table(
    [["Bill To", "Ship To"]],
    [
      [
        [
          invoice.buyer.businessName,
          address(invoice.billingAddress),
          invoice.buyer.gstin ? "GSTIN: " + invoice.buyer.gstin : "",
        ]
          .filter(Boolean)
          .join("\n"),
        address(invoice.shippingAddress),
      ],
    ],
  );
  if (invoice.tax) {
    room(12);
    y +=
      text(
        `Place of supply: ${invoice.tax.placeOfSupply.state} (${invoice.tax.placeOfSupply.code}) | Reverse charge: No`,
        14,
        y,
        182,
        8,
      ) + 4;
  }
  if (invoice.tax) {
    table(
      [
        [
          "# / HSN",
          "Description / variant",
          "Qty / unit",
          "Unit price*",
          "Discount*",
          "Value after discount**",
          "GST % / tax",
          "Line total",
        ],
      ],
      invoice.tax.lines.map((line, i) => [
        `${i + 1}\n${line.hsn}`,
        `${line.description}${line.variant ? "\n" + line.variant : ""}\nSKU: ${line.sku || "-"}\n${line.treatment}`,
        `${line.quantity} ${line.unit}`,
        `${money(line.unitPrice)}\n${line.priceBasis === "inclusive" ? "Incl. GST" : "Excl. GST"}`,
        money(line.discount),
        money(line.taxable),
        `${line.rate}%\n${money(line.tax)}`,
        money(line.total),
      ]),
      { 0: 17, 1: 42, 2: 16, 3: 22, 4: 18, 5: 24, 6: 20, 7: 23 },
    );
    room(15);
    y +=
      text(
        "* Unit prices and discounts follow each line's stated inclusive/exclusive basis. ** Taxable value for taxable goods; supply value for nil-rated/exempt/non-GST lines. Shipping allocations are separate rows.",
        14,
        y,
        182,
        7,
      ) + 5;
    const groups = new Map<
      string,
      {
        hsn: string;
        rate: number;
        treatment: string;
        base: number;
        cgst: number;
        sgst: number;
        utgst: number;
        igst: number;
      }
    >();
    for (const line of invoice.tax.lines) {
      const key = `${line.hsn}:${line.rate}:${line.treatment}`;
      const g = groups.get(key) || {
        hsn: line.hsn,
        rate: line.rate,
        treatment: line.treatment,
        base: 0,
        cgst: 0,
        sgst: 0,
        utgst: 0,
        igst: 0,
      };
      g.base += line.taxable;
      g.cgst += line.cgst;
      g.sgst += line.sgst;
      g.utgst += line.utgst;
      g.igst += line.igst;
      groups.set(key, g);
    }
    const intra = invoice.tax.placeOfSupply.code === invoice.seller.stateCode;
    table(
      [
        [
          "HSN / treatment",
          "GST rate",
          "Value",
          "CGST rate / tax",
          "SGST / UTGST rate / tax",
          "IGST rate / tax",
        ],
      ],
      [...groups.values()].map((g) => [
        g.hsn + " / " + g.treatment,
        g.rate + "%",
        money(g.base),
        `${intra ? g.rate / 2 : 0}% / ${money(g.cgst)}`,
        `${intra ? g.rate / 2 : 0}% / ${money(g.sgst + g.utgst)}`,
        `${intra ? 0 : g.rate}% / ${money(g.igst)}`,
      ]),
    );
  } else
    table(
      [
        [
          "#",
          "Description",
          "Quantity",
          "Recorded unit price",
          "Recorded line value",
        ],
      ],
      (invoice.legacyItems || []).map((line, i) => [
        i + 1,
        line.description,
        line.quantity,
        money(line.price),
        money(line.price * line.quantity),
      ]),
    );
  const t = invoice.tax;
  const totals = t
    ? [
        [
          "Taxable subtotal (after discounts; includes shipping base)",
          money(t.taxable),
        ],
        ["Nil-rated / exempt / non-GST value", money(t.exemptValue)],
        ["Discounts already deducted (reference only)", money(t.discount)],
        ["CGST", money(t.cgst)],
        ["SGST / UTGST", money(t.sgst + t.utgst)],
        ["IGST", money(t.igst)],
        ["Shipping total, included above", money(t.shipping)],
        ["Shipping tax, included above", money(t.shippingTax)],
        [
          "Round-off adjustment",
          (t.roundOff < 0 ? "-" : "") + money(Math.abs(t.roundOff)),
        ],
        ["Grand total", money(t.total)],
      ]
    : [
        ["Recorded discount", money(invoice.discount)],
        ["Recorded shipping", money(invoice.shipping)],
        ["Recorded grand total", money(invoice.total)],
      ];
  room(83);
  table([["Totals", "INR"]], totals);
  room(22);
  y += text(amountInWords(invoice.total), 14, y, 182, 9) + 5;
  const payload = deliveryQrPayload(invoice);
  const qr = QRCode.create(payload, { errorCorrectionLevel: "M" });
  const size = Math.max(38, (qr.modules.size + 8) * 0.65);
  if (size > 160)
    throw Error("Delivery address is too long for a printable QR.");
  const data = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 4,
    scale: 6,
    color: { dark: "#000000", light: "#ffffff" },
  });
  const noteX = 14 + size + 7,
    noteWidth = 196 - noteX;
  const notes = [
    ...invoice.notes,
    t ? "Shipping treatment: " + t.shippingPolicy : "",
    t ? t.roundingPolicy : "",
    invoice.signatureMode === "wet-signature"
      ? "For " + s.legalName + "\n\n\nAuthorised signatory (sign before supply)"
      : invoice.signatureMode === "electronic-policy-approved"
        ? "Issued under the seller's approved electronic-invoice policy."
        : "Signature policy requires business review.",
  ]
    .filter(Boolean)
    .join("\n\n");
  doc.setFontSize(7);
  const estimatedNotesHeight =
    doc.splitTextToSize(notes, noteWidth).length * 7 * 0.3528 * 1.2;
  room(Math.max(size + 10, estimatedNotesHeight + 10));
  text("Delivery address", 14, y, 80, 9);
  doc.addImage(data, "PNG", 14, y + 3, size, size);
  const noteHeight = text(notes, noteX, y + 4, noteWidth, 7);
  y += Math.max(size + 5, noteHeight) + 6;
  const count = doc.getNumberOfPages();
  for (let page = 1; page <= count; page++) {
    doc.setPage(page);
    doc.setDrawColor(203, 213, 225);
    doc.line(14, 281, 196, 281);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`${invoice.number || "Draft"} | ${invoice.orderId}`, 14, 287);
    doc.text(`Page ${page} of ${count}`, 196, 287, { align: "right" });
    if (page > 1) {
      doc.text(status + " | " + invoice.title, 14, 12);
    }
  }
  return new Uint8Array(doc.output("arraybuffer"));
}
