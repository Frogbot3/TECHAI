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
  "GST 18% (INR)",
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
];

function transformOrderToRows(order: Order) {
  return order.items.map((item) => {
    const itemTotal = item.product.price * item.quantity;
    const baseUnitPrice = Math.round((item.product.price / 1.18) * 100) / 100;
    const gstAmount = Math.round((itemTotal - itemTotal / 1.18) * 100) / 100;

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
      itemTotal,
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
    ];
  });
}

export function exportSingleOrderToExcel(order: Order): void {
  const workbook = XLSX.utils.book_new();
  const rows = transformOrderToRows(order);
  const worksheet = XLSX.utils.aoa_to_sheet([ORDER_HEADERS, ...rows]);
  worksheet["!cols"] = ORDER_COL_WIDTHS;

  XLSX.utils.book_append_sheet(workbook, worksheet, "Order Details");
  XLSX.writeFile(workbook, `TECHAI-Order-${order.id}.xlsx`);
}

export function exportAllOrdersToExcel(orders: Order[]): void {
  const workbook = XLSX.utils.book_new();
  const allRows = orders.flatMap((order) => transformOrderToRows(order));
  const worksheet = XLSX.utils.aoa_to_sheet([ORDER_HEADERS, ...allRows]);
  worksheet["!cols"] = ORDER_COL_WIDTHS;

  XLSX.utils.book_append_sheet(workbook, worksheet, "All Orders Master");
  XLSX.writeFile(workbook, `TECHAI-All-Orders-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
