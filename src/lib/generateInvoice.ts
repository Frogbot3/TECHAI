import { Order } from "./types";

function numberToWordsINR(num: number): string {
  if (num === 0) return "Rupees Zero Only";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "");
  }

  const integerPart = Math.floor(num);
  return `Rupees ${inWords(integerPart)} Only`;
}

function formatINR(val: number): string {
  return `Rs. ${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function generateOrderInvoice(order: Order): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  await import("jspdf-autotable");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Background: Pure Clean White Paper
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Top Accent Bar (Professional Navy)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, 10, contentWidth, 1.5, "F");

  // ================= 1. HEADER =================
  let y = 18;

  // Left: Seller / Company Info
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("TECH AI RETAIL INDIA PVT. LTD.", margin, y);

  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Regd Office: Tech Corridor, Outer Ring Road, Bengaluru, KA - 560103", margin, y);

  y += 4;
  doc.text("GSTIN: 29AABCT1337M1Z6  |  CIN: U72200KA2024PTC189001  |  State Code: 29", margin, y);

  y += 4;
  doc.text("Helpline: 1800-889-TECH (Toll-Free)  |  Email: support@techai.store", margin, y);

  // Right: Invoice Title & Metadata
  const rightX = pageWidth - margin;
  let rightY = 18;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", rightX, rightY, { align: "right" });

  rightY += 5;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Invoice No: TA-INV-${order.id.replace(/[^0-9]/g, "").slice(-8) || "882103"}`, rightX, rightY, { align: "right" });

  rightY += 4;
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  doc.text(`Invoice Date: ${orderDate}`, rightX, rightY, { align: "right" });

  rightY += 4;
  doc.text(`Order ID: ${order.id}`, rightX, rightY, { align: "right" });

  rightY += 4;
  doc.text(`Place of Supply: ${order.shippingAddress.state || "Karnataka"}, India`, rightX, rightY, { align: "right" });

  // Divider Line
  y = 39;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageWidth - margin, y);

  // ================= 2. BILL TO & SHIP TO DUAL BOXES =================
  y = 43;
  const boxWidth = (contentWidth - 4) / 2; // ~89mm
  const boxHeight = 36;

  // Box 1: Billed To / Customer
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, y, boxWidth, boxHeight, 1.5, 1.5, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, boxWidth, boxHeight, 1.5, 1.5, "S");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("BILLED TO / CUSTOMER DETAILS", margin + 3.5, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(order.shippingAddress.fullName || "Valued Customer", margin + 3.5, y + 10.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const fullAddress = `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`;
  const splitAddress = doc.splitTextToSize(fullAddress, boxWidth - 7);
  doc.text(splitAddress, margin + 3.5, y + 15);

  const phoneY = y + 15 + splitAddress.length * 3.5;
  doc.text(`Phone: +91 ${order.shippingAddress.phone || "N/A"}`, margin + 3.5, Math.min(phoneY, y + 27));
  if (order.shippingAddress.email) {
    doc.text(`Email: ${order.shippingAddress.email}`, margin + 3.5, Math.min(phoneY + 3.5, y + 31));
  }

  // Box 2: Shipping & Transaction Details
  const box2X = margin + boxWidth + 4;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(box2X, y, boxWidth, boxHeight, 1.5, 1.5, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(box2X, y, boxWidth, boxHeight, 1.5, 1.5, "S");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("DISPATCH & PAYMENT DETAILS", box2X + 3.5, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Order Status: ${order.status}`, box2X + 3.5, y + 10.5);
  doc.text(`Payment Mode: ${order.paymentMethod} (${order.paymentStatus})`, box2X + 3.5, y + 14.5);
  doc.text(`Logistics Partner: ${order.courierName || "Tech AI Express Logistics"}`, box2X + 3.5, y + 18.5);
  doc.text(`Waybill / AWB No: ${order.trackingNumber || "TA-" + order.id.slice(-8)}`, box2X + 3.5, y + 22.5);

  const txnId = order.paymentDetails?.transactionId || order.paymentDetails?.upiId || "TXN-VERIFIED-" + order.id.slice(-6);
  doc.text(`Transaction Ref: ${txnId}`, box2X + 3.5, y + 26.5);
  doc.text(`Delivery Timeframe: ${order.estimatedDelivery || "2-4 Business Days"}`, box2X + 3.5, y + 30.5);

  // ================= 3. ITEMIZED PRODUCT TABLE =================
  const tableStartY = 83;

  const tableData = order.items.map((item, index) => {
    const itemTotal = item.product.price * item.quantity;
    const baseUnitPrice = Math.round((item.product.price / 1.18) * 100) / 100;
    const gstTotal = itemTotal - Math.round((itemTotal / 1.18) * 100) / 100;

    return [
      String(index + 1),
      item.product.title,
      item.product.brand || "TECH AI",
      String(item.quantity),
      formatINR(baseUnitPrice),
      "18%",
      formatINR(gstTotal),
      formatINR(itemTotal),
    ];
  });

  (doc as any).autoTable({
    startY: tableStartY,
    margin: { left: margin, right: margin },
    head: [["#", "Description of Goods", "Brand", "Qty", "Unit Price (Excl Tax)", "GST", "GST Amount", "Net Total"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42], // slate-900
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "left",
      cellPadding: 2.5,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 8 },
      1: { cellWidth: 62 },
      2: { cellWidth: 22 },
      3: { halign: "center", cellWidth: 10 },
      4: { halign: "right", cellWidth: 23 },
      5: { halign: "center", cellWidth: 11 },
      6: { halign: "right", cellWidth: 22 },
      7: { halign: "right", cellWidth: 24 },
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      overflow: "linebreak",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const lastTableY = (doc as any).lastAutoTable.finalY;
  let bottomY = lastTableY + 5;

  // If table went too close to bottom, add a new page
  if (bottomY > 220) {
    doc.addPage();
    bottomY = 15;
  }

  // ================= 4. SUMMARY & AMOUNT IN WORDS =================
  const summaryWidth = 80;
  const summaryX = pageWidth - margin - summaryWidth;
  const leftBlockWidth = contentWidth - summaryWidth - 6;

  // Left Block: Amount in Words & Terms
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("INVOICE AMOUNT IN WORDS:", margin, bottomY + 3);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const wordsText = numberToWordsINR(order.finalAmount);
  doc.text(wordsText, margin, bottomY + 7);

  // Left Box: Terms & Conditions
  const termsY = bottomY + 13;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("TERMS & CONDITIONS:", margin, termsY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("1. All goods supplied are 100% genuine and covered by manufacturer warranty.", margin, termsY + 4);
  doc.text("2. 7-Day replacement or return as per TECH AI Customer Return Policy.", margin, termsY + 7.5);
  doc.text("3. Registered under Goods and Services Tax Act, 2017.", margin, termsY + 11);

  // Digital Authenticity Seal
  doc.setFillColor(240, 253, 250); // teal-50
  doc.roundedRect(margin, termsY + 14, leftBlockWidth, 9, 1, 1, "F");
  doc.setDrawColor(20, 184, 166);
  doc.roundedRect(margin, termsY + 14, leftBlockWidth, 9, 1, 1, "S");

  doc.setFontSize(6.8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(13, 148, 136);
  doc.text("DIGITALLY SIGNED & VERIFIED BY TECH AI RETAIL INDIA PVT. LTD.", margin + 3, termsY + 19.5);

  // Right Block: Financial Calculation Card
  const calcBaseTotal = Math.round((order.totalAmount / 1.18) * 100) / 100;
  const calcGstTotal = Math.round((order.totalAmount - calcBaseTotal) * 100) / 100;
  const cgst = Math.round((calcGstTotal / 2) * 100) / 100;
  const sgst = Math.round((calcGstTotal - cgst) * 100) / 100;

  const cardHeight = 44;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(summaryX, bottomY, summaryWidth, cardHeight, 1.5, 1.5, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryX, bottomY, summaryWidth, cardHeight, 1.5, 1.5, "S");

  let cardLineY = bottomY + 5;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);

  // Subtotal
  doc.text("Taxable Value:", summaryX + 3.5, cardLineY);
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(calcBaseTotal), pageWidth - margin - 3.5, cardLineY, { align: "right" });

  // CGST
  cardLineY += 5;
  doc.setTextColor(100, 116, 139);
  doc.text("Central GST (9%):", summaryX + 3.5, cardLineY);
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(cgst), pageWidth - margin - 3.5, cardLineY, { align: "right" });

  // SGST
  cardLineY += 5;
  doc.setTextColor(100, 116, 139);
  doc.text("State GST (9%):", summaryX + 3.5, cardLineY);
  doc.setTextColor(15, 23, 42);
  doc.text(formatINR(sgst), pageWidth - margin - 3.5, cardLineY, { align: "right" });

  // Discount
  cardLineY += 5;
  doc.setTextColor(100, 116, 139);
  doc.text("Promotional Discount:", summaryX + 3.5, cardLineY);
  if (order.discountAmount > 0) {
    doc.setTextColor(16, 185, 129); // emerald
    doc.text(`- ${formatINR(order.discountAmount)}`, pageWidth - margin - 3.5, cardLineY, { align: "right" });
  } else {
    doc.setTextColor(15, 23, 42);
    doc.text("Rs. 0.00", pageWidth - margin - 3.5, cardLineY, { align: "right" });
  }

  // Shipping
  cardLineY += 5;
  doc.setTextColor(100, 116, 139);
  doc.text("Shipping & Handling:", summaryX + 3.5, cardLineY);
  doc.setTextColor(15, 23, 42);
  doc.text(order.shippingFee === 0 ? "FREE" : formatINR(order.shippingFee), pageWidth - margin - 3.5, cardLineY, { align: "right" });

  // Divider inside summary box
  cardLineY += 3.5;
  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX + 3.5, cardLineY, pageWidth - margin - 3.5, cardLineY);

  // Grand Total
  cardLineY += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("Grand Total (INR):", summaryX + 3.5, cardLineY);
  doc.text(formatINR(order.finalAmount), pageWidth - margin - 3.5, cardLineY, { align: "right" });

  // ================= 5. AUTHORIZED SIGNATORY =================
  const sigY = bottomY + cardHeight + 4;
  if (sigY < 275) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("For TECH AI RETAIL INDIA PRIVATE LIMITED", pageWidth - margin, sigY, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Authorized Signatory", pageWidth - margin, sigY + 4, { align: "right" });
  }

  // ================= 6. BOTTOM FOOTER =================
  const footerY = 286;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

  doc.setFontSize(6.8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("This is a computer-generated tax invoice and requires no physical signature.", margin, footerY);
  doc.text("24x7 Support: support@techai.store | www.techai.store", margin, footerY + 3.5);
  doc.text(`Page 1 of 1 | Invoice for Order ${order.id}`, pageWidth - margin, footerY, { align: "right" });

  // Download PDF
  doc.save(`TECHAI-TaxInvoice-${order.id}.pdf`);
}
