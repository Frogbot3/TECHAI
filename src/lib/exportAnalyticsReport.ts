import * as XLSX from "xlsx";
import { Order, Product } from "./types";

export interface AnalyticsStats {
  totalRevenue: number;
  totalOrdersCount: number;
  totalProductsCount: number;
  lowStockCount: number;
  totalCustomersCount: number;
}

export async function exportAnalyticsToPdf(
  stats: AnalyticsStats,
  orders: Order[],
  products: Product[]
): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  await import("jspdf-autotable");

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;

  // 1. Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 36, "F");

  doc.setFillColor(6, 182, 212); // cyan-500
  doc.rect(0, 36, pageWidth, 2, "F");

  doc.setTextColor(34, 211, 238);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("TECH AI", margin, 17);

  doc.setTextColor(226, 232, 240);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("EXECUTIVE SALES & ANALYTICS PERFORMANCE REPORT", margin, 24);
  doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, margin, 30);

  // Right Header
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("CONFIDENTIAL BUSINESS REPORT", pageWidth - margin, 18, { align: "right" });
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  doc.text(`Active Catalog: ${stats.totalProductsCount} Products`, pageWidth - margin, 25, { align: "right" });
  doc.text(`Total Customers: ${stats.totalCustomersCount}`, pageWidth - margin, 30, { align: "right" });

  // 2. Executive KPI Cards
  const startY = 44;
  const cardW = 42;
  const cardH = 22;
  const gap = 3.5;

  const avgOrderValue = stats.totalOrdersCount > 0 ? Math.round(stats.totalRevenue / stats.totalOrdersCount) : 0;

  const kpis = [
    { label: "Total Gross Revenue", val: `₹${stats.totalRevenue.toLocaleString("en-IN")}` },
    { label: "Total Orders Placed", val: String(stats.totalOrdersCount) },
    { label: "Avg Order Value (AOV)", val: `₹${avgOrderValue.toLocaleString("en-IN")}` },
    { label: "Delivered Orders", val: String(orders.filter(o => o.status === "Delivered").length) },
  ];

  kpis.forEach((kpi, i) => {
    const x = margin + i * (cardW + gap);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, startY, cardW, cardH, 2, 2, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, startY, cardW, cardH, 2, 2, "S");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3, startY + 6);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.val, x + 3, startY + 16);
  });

  // 3. Category Sales Breakdown Table
  const categoryMap: Record<string, { count: number; revenue: number }> = {};
  orders.forEach((ord) => {
    ord.items.forEach((item) => {
      const cat = item.product.category || "General";
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, revenue: 0 };
      categoryMap[cat].count += item.quantity;
      categoryMap[cat].revenue += item.product.price * item.quantity;
    });
  });

  const categoryRows = Object.entries(categoryMap).map(([cat, data], idx) => {
    const share = stats.totalRevenue > 0 ? ((data.revenue / stats.totalRevenue) * 100).toFixed(1) : "0";
    return [
      String(idx + 1),
      cat,
      String(data.count),
      `₹${data.revenue.toLocaleString("en-IN")}`,
      `${share}%`,
    ];
  });

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("1. SALES PERFORMANCE BY PRODUCT CATEGORY", margin, 74);

  (doc as any).autoTable({
    startY: 78,
    head: [["#", "Category Name", "Units Sold", "Total Revenue (₹)", "Revenue Share"]],
    body: categoryRows.length > 0 ? categoryRows : [["1", "All Categories", "0", "₹0", "0%"]],
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [34, 211, 238],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 3,
    },
    styles: { fontSize: 8, cellPadding: 3, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 10;

  // 4. Top Selling Products Leaderboard
  const productSalesMap: Record<string, { title: string; brand: string; units: number; revenue: number }> = {};
  orders.forEach((ord) => {
    ord.items.forEach((item) => {
      const id = item.product.id;
      if (!productSalesMap[id]) {
        productSalesMap[id] = {
          title: item.product.title,
          brand: item.product.brand || "TECH AI",
          units: 0,
          revenue: 0,
        };
      }
      productSalesMap[id].units += item.quantity;
      productSalesMap[id].revenue += item.product.price * item.quantity;
    });
  });

  const topProductsRows = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8)
    .map((prod, idx) => [
      String(idx + 1),
      prod.title,
      prod.brand,
      String(prod.units),
      `₹${prod.revenue.toLocaleString("en-IN")}`,
    ]);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("2. TOP PERFORMING PRODUCTS (BY REVENUE)", margin, currentY);

  (doc as any).autoTable({
    startY: currentY + 4,
    head: [["#", "Product Description", "Brand", "Units Sold", "Total Sales (₹)"]],
    body: topProductsRows.length > 0 ? topProductsRows : [["1", "No sales recorded yet", "N/A", "0", "₹0"]],
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [34, 211, 238],
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: 3,
    },
    styles: { fontSize: 8, cellPadding: 3, textColor: [51, 65, 85] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 280, pageWidth - margin, 280);
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text("TECH AI Retail India Private Limited • Confidential Business Intelligence", margin, 286);
  doc.text("Page 1 of 1", pageWidth - margin, 286, { align: "right" });

  doc.save(`TECHAI-Analytics-Report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportAnalyticsToExcel(
  stats: AnalyticsStats,
  orders: Order[],
  products: Product[]
): void {
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Executive KPI Metrics
  const avgOrderValue = stats.totalOrdersCount > 0 ? Math.round(stats.totalRevenue / stats.totalOrdersCount) : 0;
  const kpiData = [
    ["TECH AI - EXECUTIVE ANALYTICS SUMMARY"],
    ["Generated At", new Date().toLocaleString("en-IN")],
    [],
    ["METRIC", "VALUE"],
    ["Total Gross Revenue (₹)", stats.totalRevenue],
    ["Total Orders Count", stats.totalOrdersCount],
    ["Average Order Value (₹)", avgOrderValue],
    ["Total Catalog Products", stats.totalProductsCount],
    ["Low Stock Products Alert", stats.lowStockCount],
    ["Registered Customers", stats.totalCustomersCount],
    ["Placed Orders", orders.filter(o => o.status === "Placed").length],
    ["Processing Orders", orders.filter(o => o.status === "Processing").length],
    ["Shipped Orders", orders.filter(o => o.status === "Shipped").length],
    ["Out for Delivery Orders", orders.filter(o => o.status === "Out for Delivery").length],
    ["Delivered Orders", orders.filter(o => o.status === "Delivered").length],
  ];

  const kpiSheet = XLSX.utils.aoa_to_sheet(kpiData);
  XLSX.utils.book_append_sheet(workbook, kpiSheet, "Executive KPIs");

  // Sheet 2: Category Sales
  const categoryMap: Record<string, { count: number; revenue: number }> = {};
  orders.forEach((ord) => {
    ord.items.forEach((item) => {
      const cat = item.product.category || "General";
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, revenue: 0 };
      categoryMap[cat].count += item.quantity;
      categoryMap[cat].revenue += item.product.price * item.quantity;
    });
  });

  const categoryHeaders = ["Category Name", "Units Sold", "Total Revenue (₹)", "Revenue Share (%)"];
  const categoryRows = Object.entries(categoryMap).map(([cat, data]) => {
    const share = stats.totalRevenue > 0 ? ((data.revenue / stats.totalRevenue) * 100).toFixed(2) : "0";
    return [cat, data.count, data.revenue, Number(share)];
  });

  const catSheet = XLSX.utils.aoa_to_sheet([categoryHeaders, ...categoryRows]);
  XLSX.utils.book_append_sheet(workbook, catSheet, "Category Breakdown");

  // Sheet 3: Top Products Performance
  const productSalesMap: Record<string, { id: string; title: string; brand: string; units: number; revenue: number }> = {};
  orders.forEach((ord) => {
    ord.items.forEach((item) => {
      const id = item.product.id;
      if (!productSalesMap[id]) {
        productSalesMap[id] = {
          id: item.product.id,
          title: item.product.title,
          brand: item.product.brand || "TECH AI",
          units: 0,
          revenue: 0,
        };
      }
      productSalesMap[id].units += item.quantity;
      productSalesMap[id].revenue += item.product.price * item.quantity;
    });
  });

  const prodHeaders = ["Product ID", "Product Title", "Brand", "Units Sold", "Total Revenue (₹)"];
  const prodRows = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .map((p) => [p.id, p.title, p.brand, p.units, p.revenue]);

  const prodSheet = XLSX.utils.aoa_to_sheet([prodHeaders, ...prodRows]);
  XLSX.utils.book_append_sheet(workbook, prodSheet, "Product Sales");

  // Save the workbook
  XLSX.writeFile(workbook, `TECHAI-Analytics-Report-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
