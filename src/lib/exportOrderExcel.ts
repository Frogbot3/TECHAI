import * as XLSX from "xlsx";
import { Order } from "./types";

export function exportSingleOrderToExcel(order: Order): void {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Order Overview & Customer / Payment Details
  const summaryData = [
    ["TECH AI E-COMMERCE - ORDER MANIFEST & TAX INVOICE DATA"],
    [],
    ["ORDER METADATA", ""],
    ["Order ID", order.id],
    ["Created At", order.createdAt],
    ["Order Status", order.status],
    ["Tracking Number", order.trackingNumber || "N/A"],
    ["Courier Partner", order.courierName || "Tech AI Logistics"],
    ["Estimated Delivery", order.estimatedDelivery || "3-5 Business Days"],
    [],
    ["CUSTOMER DETAILS", ""],
    ["Customer Name", order.shippingAddress.fullName || "Customer"],
    ["Contact Phone", order.shippingAddress.phone || "N/A"],
    ["Email Address", order.shippingAddress.email || "N/A"],
    ["Street Address", order.shippingAddress.street || "N/A"],
    ["City", order.shippingAddress.city || "N/A"],
    ["State", order.shippingAddress.state || "N/A"],
    ["Pincode", order.shippingAddress.pincode || "N/A"],
    ["Landmark", order.shippingAddress.landmark || "N/A"],
    [],
    ["PAYMENT & FINANCIAL DETAILS", ""],
    ["Payment Mode", order.paymentMethod],
    ["Payment Status", order.paymentStatus],
    ["Transaction ID / Ref", order.paymentDetails?.transactionId || order.paymentDetails?.upiId || "N/A"],
    ["Payment Provider", order.paymentDetails?.provider || order.paymentMethod],
    ["Subtotal (₹)", order.totalAmount],
    ["Promotional Discount (₹)", order.discountAmount],
    ["Shipping Fee (₹)", order.shippingFee === 0 ? "FREE" : order.shippingFee],
    ["Grand Total Amount (₹)", order.finalAmount],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Order Overview");

  // Sheet 2: Itemized Products Breakdown
  const itemsHeaders = [
    "Item #",
    "Product ID",
    "Product Title",
    "Brand",
    "Category",
    "Quantity",
    "Unit Price (₹)",
    "GST 18% (₹)",
    "Total Item Price (₹)"
  ];

  const itemsRows = order.items.map((item, idx) => {
    const itemTotal = item.product.price * item.quantity;
    const basePrice = Math.round(item.product.price / 1.18);
    const gstAmount = item.product.price - basePrice;

    return [
      idx + 1,
      item.product.id,
      item.product.title,
      item.product.brand || "TECH AI",
      item.product.category || "General",
      item.quantity,
      item.product.price,
      gstAmount * item.quantity,
      itemTotal,
    ];
  });

  const itemsSheet = XLSX.utils.aoa_to_sheet([itemsHeaders, ...itemsRows]);
  XLSX.utils.book_append_sheet(workbook, itemsSheet, "Ordered Items");

  // Save the workbook
  XLSX.writeFile(workbook, `TECHAI-Order-${order.id}.xlsx`);
}
