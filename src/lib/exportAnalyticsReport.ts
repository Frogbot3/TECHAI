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
  const contentWidth = pageWidth - margin * 2;

  // Background: Clean White Paper
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 297, "F");

  // Top Navy Header Bar
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, 10, contentWidth, 1.5, "F");

  // 1. Header
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("TECH AI RETAIL INDIA PVT. LTD.", margin, 18);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Executive E-Commerce Sales & Analytics Report", margin, 23);
  doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, margin, 27.5);

  // Right Header
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("CONFIDENTIAL BUSINESS REPORT", pageWidth - margin, 18, { align: "right" });

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Active Catalog: ${stats.totalProductsCount} Products`, pageWidth - margin, 23, { align: "right" });
  doc.text(`Total Customers: ${stats.totalCustomersCount} Registered`, pageWidth - margin, 27.5, { align: "right" });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, 31, pageWidth - margin, 31);

  // 2. Executive KPI Cards
  const startY = 35;
  const cardW = (contentWidth - 9) / 4; // ~43mm
  const cardH = 20;

  const avgOrderValue = stats.totalOrdersCount > 0 ? Math.round(stats.totalRevenue / stats.totalOrdersCount) : 0;

  const kpis = [
    { label: "Total Gross Revenue", val: `Rs. ${stats.totalRevenue.toLocaleString("en-IN")}` },
    { label: "Total Orders Placed", val: String(stats.totalOrdersCount) },
    { label: "Avg Order Value (AOV)", val: `Rs. ${avgOrderValue.toLocaleString("en-IN")}` },
    { label: "Completed Deliveries", val: String(orders.filter(o => o.status === "Delivered").length) },
  ];

  kpis.forEach((kpi, i) => {
    const x = margin + i * (cardW + 3);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, startY, cardW, cardH, 1.5, 1.5, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, startY, cardW, cardH, 1.5, 1.5, "S");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3, startY + 5.5);

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.val, x + 3, startY + 14);
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
      `Rs. ${data.revenue.toLocaleString("en-IN")}`,
      `${share}%`,
    ];
  });

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("1. SALES PERFORMANCE BY PRODUCT CATEGORY", margin, 62);

  (doc as any).autoTable({
    startY: 65,
    margin: { left: margin, right: margin },
    head: [["#", "Category Name", "Units Sold", "Total Sales (INR)", "Revenue Share"]],
    body: categoryRows.length > 0 ? categoryRows : [["1", "All Categories", "0", "Rs. 0", "0%"]],
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
      cellPadding: 2.5,
    },
    styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [51, 65, 85], lineColor: [226, 232, 240], lineWidth: 0.2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 8;

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
      `Rs. ${prod.revenue.toLocaleString("en-IN")}`,
    ]);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("2. TOP PERFORMING PRODUCTS (BY REVENUE)", margin, currentY);

  (doc as any).autoTable({
    startY: currentY + 3,
    margin: { left: margin, right: margin },
    head: [["#", "Product Description", "Brand", "Units Sold", "Total Sales (INR)"]],
    body: topProductsRows.length > 0 ? topProductsRows : [["1", "No sales recorded yet", "N/A", "0", "Rs. 0"]],
    theme: "grid",
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
      cellPadding: 2.5,
    },
    styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [51, 65, 85], lineColor: [226, 232, 240], lineWidth: 0.2 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  // Footer
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, 282, pageWidth - margin, 282);
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("TECH AI Retail India Private Limited • Confidential Business Intelligence", margin, 287);
  doc.text("Page 1 of 1", pageWidth - margin, 287, { align: "right" });

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
  const kpiHeaders = ["Key Metric", "Value"];
  const kpiRows = [
    ["Total Gross Revenue (INR)", stats.totalRevenue],
    ["Total Orders Count", stats.totalOrdersCount],
    ["Average Order Value (INR)", avgOrderValue],
    ["Total Catalog Products", stats.totalProductsCount],
    ["Low Stock Products Alert", stats.lowStockCount],
    ["Registered Customers Count", stats.totalCustomersCount],
    ["Placed Orders", orders.filter(o => o.status === "Placed").length],
    ["Processing Orders", orders.filter(o => o.status === "Processing").length],
    ["Shipped Orders", orders.filter(o => o.status === "Shipped").length],
    ["Out for Delivery Orders", orders.filter(o => o.status === "Out for Delivery").length],
    ["Delivered Orders", orders.filter(o => o.status === "Delivered").length],
  ];

  const kpiSheet = XLSX.utils.aoa_to_sheet([kpiHeaders, ...kpiRows]);
  kpiSheet["!cols"] = [{ wch: 32 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(workbook, kpiSheet, "Executive Summary");

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

  const categoryHeaders = ["Category Name", "Units Sold", "Total Revenue (INR)", "Revenue Share (%)"];
  const categoryRows = Object.entries(categoryMap).map(([cat, data]) => {
    const share = stats.totalRevenue > 0 ? Number(((data.revenue / stats.totalRevenue) * 100).toFixed(2)) : 0;
    return [cat, data.count, data.revenue, share];
  });

  const catSheet = XLSX.utils.aoa_to_sheet([categoryHeaders, ...categoryRows]);
  catSheet["!cols"] = [{ wch: 24 }, { wch: 14 }, { wch: 22 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, catSheet, "Category Sales");

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

  const prodHeaders = ["Product ID", "Product Title", "Brand", "Units Sold", "Total Sales (INR)"];
  const prodRows = Object.values(productSalesMap)
    .sort((a, b) => b.revenue - a.revenue)
    .map((p) => [p.id, p.title, p.brand, p.units, p.revenue]);

  const prodSheet = XLSX.utils.aoa_to_sheet([prodHeaders, ...prodRows]);
  prodSheet["!cols"] = [{ wch: 22 }, { wch: 38 }, { wch: 18 }, { wch: 14 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, prodSheet, "Product Performance");

  // Save the workbook
  XLSX.writeFile(workbook, `TECHAI-Analytics-Report-${new Date().toISOString().slice(0, 10)}.xlsx`);
}
