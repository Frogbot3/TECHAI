import * as XLSX from "xlsx";
import { Order } from "./types";

const ORDER_COL_WIDTHS = [
  { wch: 22 }, // Order ID
  { wch: 22 }, // Order Date
  { wch: 20 }, // Customer Name
  { wch: 15 }, // Phone
  { wch: 26 }, // Email
  { wch: 32 }, // Delivery Address
  { wch: 16 }, // City
  { wch: 16 }, // State
  { wch: 10 }, // Pincode
  { wch: 36 }, // Product Title
  { wch: 16 }, // Brand
  { wch: 18 }, // Category
  { wch: 10 }, // Quantity
  { wch: 16 }, // Unit Price
  { wch: 14 }, // GST
  { wch: 18 }, // Item Net Total
  { wch: 18 }, // Order Subtotal
  { wch: 14 }, // Discount
  { wch: 14 }, // Shipping
  { wch: 22 }, // Order Grand Total
  { wch: 16 }, // Payment Method
  { wch: 14 }, // Payment Status
  { wch: 16 }, // Order Status
  { wch: 22 }, // Logistics Partner
  { wch: 18 }, // Tracking AWB
  { wch: 26 }, // Transaction Ref
];

const ORDER_HEADERS = [
  "Order ID",
  "Order Date",
  "Customer Name",
  "Phone",
  "Email",
  "Delivery Address",
  "City",
  "State",
  "Pincode",
  "Product Title",
  "Brand",
  "Category",
  "Quantity",
  "Unit Price (INR)",
  "GST from snapshot (INR)",
  "Item Net Total (INR)",
  "Order Subtotal (INR)",
  "Discount (INR)",
  "Shipping (INR)",
  "Order Grand Total (INR)",
  "Payment Method",
  "Payment Status",
  "Order Status",
  "Logistics Partner",
  "Tracking AWB",
  "Transaction / UPI Ref",
  "HSN", "GST rate", "Tax treatment", "Price basis", "Taxable value", "Line discount", "CGST", "SGST / UTGST", "IGST", "Invoice number", "Place of supply code",
];

export function transformOrderToRows(order: Order) {
  return order.items.map((item, index) => {
    const itemTotal = item.product.price * item.quantity;
    const taxLine = order.taxSnapshot?.lines.filter(line => line.kind === "product")[index];
    const baseUnitPrice = item.product.price;
    const gstAmount = taxLine ? taxLine.tax / 100 : "Tax details unavailable";

    return [
      order.id,
      order.createdAt,
      order.shippingAddress.fullName || "Customer",
      order.shippingAddress.phone || "N/A",
      order.shippingAddress.email || "N/A",
      order.shippingAddress.street || "N/A",
      order.shippingAddress.city || "N/A",
      order.shippingAddress.state || "N/A",
      order.shippingAddress.pincode || "N/A",
      item.product.title,
      item.product.brand || "TECH AI",
      item.product.category || "General",
      item.quantity,
      baseUnitPrice,
      gstAmount,
      taxLine ? taxLine.total / 100 : itemTotal,
      order.totalAmount,
      order.discountAmount,
      order.shippingFee,
      order.finalAmount,
      order.paymentMethod,
      order.paymentStatus,
      order.status,
      order.courierName || "Tech AI Express",
      order.trackingNumber || "N/A",
      order.paymentDetails?.transactionId || order.paymentDetails?.upiId || "N/A",
      taxLine?.hsn || "", taxLine?.rate ?? "", taxLine?.treatment || "Review required", taxLine?.priceBasis || "Unknown", taxLine ? taxLine.taxable / 100 : "", taxLine ? taxLine.discount / 100 : "", taxLine ? taxLine.cgst / 100 : "", taxLine ? (taxLine.sgst + taxLine.utgst) / 100 : "", taxLine ? taxLine.igst / 100 : "", order.invoiceNumber || "Not issued", order.taxSnapshot?.placeOfSupply.code || "",
    ];
  });
}

function appendTaxSnapshots(workbook: XLSX.WorkBook, orders: Order[]) {
  const rows = orders.flatMap(order => order.taxSnapshot ? order.taxSnapshot.lines.map(line => [
    order.id, order.invoiceNumber || "Not issued", order.taxSnapshot!.placeOfSupply.code,
    line.kind, line.sku, line.description, line.variant, line.hsn, line.quantity, line.unit,
    line.priceBasis, line.unitPrice / 100, line.discount / 100, line.treatment, line.rate,
    line.taxable / 100, line.cgst / 100, line.sgst / 100, line.utgst / 100, line.igst / 100,
    line.total / 100, order.taxSnapshot!.roundOff / 100, order.taxSnapshot!.total / 100,
  ]) : [[order.id, order.invoiceNumber || "Not issued", "Legacy: tax details unavailable"]]);
  const sheet = XLSX.utils.aoa_to_sheet([[
    "Order", "Invoice", "Place of supply", "Line type", "SKU", "Description", "Variant", "HSN", "Quantity", "Unit",
    "Price basis", "Unit price INR", "Line discount INR", "Treatment", "GST rate %", "Taxable/supply value INR",
    "CGST INR", "SGST INR", "UTGST INR", "IGST INR", "Line total INR", "Order round-off INR (reference)", "Order total INR (reference)",
  ], ...rows]);
  XLSX.utils.book_append_sheet(workbook, sheet, "Tax Snapshots");
}

export function exportSingleOrderToExcel(order: Order): void {
  const workbook = XLSX.utils.book_new();
  const rows = transformOrderToRows(order);
  const worksheet = XLSX.utils.aoa_to_sheet([ORDER_HEADERS, ...rows]);
  worksheet["!cols"] = ORDER_COL_WIDTHS;

  XLSX.utils.book_append_sheet(workbook, worksheet, "Order Details");
  appendTaxSnapshots(workbook, [order]);
  XLSX.writeFile(workbook, `TECHAI-Order-${order.id}.xlsx`);
}

export function exportAllOrdersToExcel(orders: Order[], sheetName = "All Orders Master", filename?: string): void {
  const workbook = XLSX.utils.book_new();
  const allRows = orders.flatMap((order) => transformOrderToRows(order));
  const worksheet = XLSX.utils.aoa_to_sheet([ORDER_HEADERS, ...allRows]);
  worksheet["!cols"] = ORDER_COL_WIDTHS;

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  appendTaxSnapshots(workbook, orders);
  XLSX.writeFile(workbook, filename || `TECHAI-All-Orders-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
