import { Order } from "./types";

export async function generateOrderInvoice(order: Order): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  await import("jspdf-autotable");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // ~210mm
  const margin = 14;

  // 1. Top Modern Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 38, "F");

  // Cyan Accent Strip
  doc.setFillColor(6, 182, 212); // cyan-500
  doc.rect(0, 38, pageWidth, 2, "F");

  // Logo & Title
  doc.setTextColor(34, 211, 238); // cyan-400
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("TECH AI", margin, 18);

  doc.setTextColor(226, 232, 240); // slate-200
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("OFFICIAL TAX INVOICE & RETAIL RECEIPT", margin, 26);
  doc.text("GSTIN: 29AABCT1337M1Z6 | CIN: U72200KA2024PTC189001", margin, 32);

  // Invoice Number & Date (Right Header)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`INVOICE #${order.id}`, pageWidth - margin, 18, { align: "right" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.text(`Date: ${orderDate}`, pageWidth - margin, 25, { align: "right" });
  doc.text(`Payment: ${order.paymentMethod} (${order.paymentStatus})`, pageWidth - margin, 32, { align: "right" });

  // 2. Billing & Logistics Information Box
  const startY = 48;
  
  // Left Box: Bill To / Ship To
  doc.setFillColor(248, 250, 252); // slate-50
  doc.roundedRect(margin, startY, 86, 38, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, startY, 86, 38, 2, 2, "S");

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("CUSTOMER & DELIVERY ADDRESS", margin + 4, startY + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(order.shippingAddress.fullName || "Customer", margin + 4, startY + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Phone: +91 ${order.shippingAddress.phone}`, margin + 4, startY + 17);
  if (order.shippingAddress.email) {
    doc.text(`Email: ${order.shippingAddress.email}`, margin + 4, startY + 22);
  }
  
  const fullAddress = `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`;
  const addressLines = doc.splitTextToSize(fullAddress, 78);
  doc.text(addressLines, margin + 4, startY + 27);

  // Right Box: Order & Logistics Details
  const rightBoxX = pageWidth - margin - 86;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightBoxX, startY, 86, 38, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(rightBoxX, startY, 86, 38, 2, 2, "S");

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("SHIPPING & TRANSACTION DETAILS", rightBoxX + 4, startY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Order Status: ${order.status}`, rightBoxX + 4, startY + 12);
  doc.text(`Tracking Number: ${order.trackingNumber}`, rightBoxX + 4, startY + 17);
  doc.text(`Courier Partner: ${order.courierName || "Tech AI Logistics"}`, rightBoxX + 4, startY + 22);
  doc.text(`Est. Delivery: ${order.estimatedDelivery || "3-5 Business Days"}`, rightBoxX + 4, startY + 27);
  if (order.paymentDetails?.transactionId) {
    doc.text(`Txn ID: ${order.paymentDetails.transactionId}`, rightBoxX + 4, startY + 32);
  } else {
    doc.text(`Order Channel: TECH AI Online Storefront`, rightBoxX + 4, startY + 32);
  }

  // 3. Products Itemized Table
  const tableData = order.items.map((item, index) => {
    const itemTotal = item.product.price * item.quantity;
    const basePrice = Math.round(item.product.price / 1.18);
    const gstAmount = item.product.price - basePrice;

    return [
      String(index + 1),
      item.product.title,
      item.product.brand || "TECH AI",
      String(item.quantity),
      `₹${item.product.price.toLocaleString("en-IN")}`,
      `₹${(gstAmount * item.quantity).toLocaleString("en-IN")}`,
      `₹${itemTotal.toLocaleString("en-IN")}`,
    ];
  });

  (doc as any).autoTable({
    startY: 92,
    head: [["#", "Product Description", "Brand", "Qty", "Unit Price", "GST (18%)", "Total Amount"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [34, 211, 238],
      fontStyle: "bold",
      fontSize: 8.5,
      halign: "left",
      cellPadding: 3.5,
    },
    columnStyles: {
      0: { halign: "center", cellWidth: 10 },
      1: { cellWidth: 70 },
      2: { cellWidth: 26 },
      3: { halign: "center", cellWidth: 14 },
      4: { halign: "right", cellWidth: 24 },
      5: { halign: "right", cellWidth: 24 },
      6: { halign: "right", cellWidth: 26 },
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3.5,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // 4. Financial Summary Card (Right aligned)
  const summaryBoxWidth = 84;
  const summaryBoxX = pageWidth - margin - summaryBoxWidth;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(summaryBoxX, finalY, summaryBoxWidth, 42, 2, 2, "F");
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(summaryBoxX, finalY, summaryBoxWidth, 42, 2, 2, "S");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);

  doc.text("Items Subtotal:", summaryBoxX + 4, finalY + 7);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(`₹${order.totalAmount.toLocaleString("en-IN")}`, pageWidth - margin - 4, finalY + 7, { align: "right" });

  if (order.discountAmount > 0) {
    doc.setTextColor(16, 185, 129); // emerald
    doc.setFont("helvetica", "normal");
    doc.text("Promotional Discount:", summaryBoxX + 4, finalY + 14);
    doc.text(`- ₹${order.discountAmount.toLocaleString("en-IN")}`, pageWidth - margin - 4, finalY + 14, { align: "right" });
  } else {
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.text("Promotional Discount:", summaryBoxX + 4, finalY + 14);
    doc.text("₹0", pageWidth - margin - 4, finalY + 14, { align: "right" });
  }

  doc.setTextColor(100, 116, 139);
  doc.text("Shipping & Handling:", summaryBoxX + 4, finalY + 21);
  doc.setTextColor(15, 23, 42);
  doc.text(
    order.shippingFee === 0 ? "FREE" : `₹${order.shippingFee.toLocaleString("en-IN")}`,
    pageWidth - margin - 4,
    finalY + 21,
    { align: "right" }
  );

  // Divider inside summary box
  doc.setDrawColor(203, 213, 225);
  doc.line(summaryBoxX + 4, finalY + 26, pageWidth - margin - 4, finalY + 26);

  // Grand Total
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(6, 182, 212); // cyan
  doc.text("Grand Total:", summaryBoxX + 4, finalY + 34);
  doc.text(`₹${order.finalAmount.toLocaleString("en-IN")}`, pageWidth - margin - 4, finalY + 34, { align: "right" });

  // 5. Left Notes & Verified Seal
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("TERMS & CONDITIONS:", margin, finalY + 6);
  doc.setFont("helvetica", "normal");
  doc.text("1. All items are backed by standard 1-year brand warranty.", margin, finalY + 12);
  doc.text("2. 7-day hassle-free returns or replacements supported.", margin, finalY + 17);
  doc.text("3. This is a computer-generated invoice and requires no physical signature.", margin, finalY + 22);

  // Digital Seal Badge
  doc.setFillColor(240, 253, 250);
  doc.roundedRect(margin, finalY + 27, 80, 13, 2, 2, "F");
  doc.setDrawColor(20, 184, 166);
  doc.roundedRect(margin, finalY + 27, 80, 13, 2, 2, "S");
  doc.setTextColor(13, 148, 136);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.text("✓ DIGITALLY VERIFIED & AUTHENTICATED BY TECH AI", margin + 3, finalY + 35);

  // 6. Professional Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 275, pageWidth - margin, 275);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text("TECH AI Retail India Private Limited • Registered in Bengaluru, Karnataka, India", margin, 281);
  doc.text("24/7 Priority Support: support@techai.store | Customer Helpline: 1800-889-TECH", margin, 286);
  doc.text(`Page 1 of 1 • Generated for Order ${order.id}`, pageWidth - margin, 286, { align: "right" });

  // Save the PDF file
  doc.save(`TECHAI-Tax-Invoice-${order.id}.pdf`);
}
