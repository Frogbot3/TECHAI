"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import TechAiLogo from "@/components/TechAiLogo";
import { Product, Order, OrderStatus, User } from "@/lib/types";
import { CATEGORIES } from "@/lib/data";
import * as XLSX from "xlsx";
import {
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Clock,
  Truck,
  Phone,
  Mail,
  Search,
  LogOut,
  ShieldCheck,
  MapPin,
  ExternalLink,
  Sparkles,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Check,
  SlidersHorizontal,
  ArrowUpRight
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"ANALYTICS" | "PRODUCTS" | "ORDERS" | "CUSTOMERS">("ANALYTICS");
  const [productSearch, setProductSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrdersCount: 0,
    totalProductsCount: 0,
    lowStockCount: 0,
    totalCustomersCount: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: "",
    brand: "TECH AI",
    category: "AI Electronics",
    price: 1499,
    originalPrice: 1999,
    stock: 20,
    isAiProduct: true,
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80",
    description: "High-performance AI gadget designed for seamless integration and maximum efficiency.",
    features: ["Neural Processing Coprocessor", "Ultra-fast Connectivity", "Premium Build"],
    specs: { "Warranty": "1 Year Official TECH AI Warranty" }
  });

  const [refillModalProduct, setRefillModalProduct] = useState<Product | null>(null);
  const [refillAmount, setRefillAmount] = useState(10);

  // Fetch real-time live statistics and orders from MongoDB
  const fetchLiveData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setOrders(data.orders || []);
        setProducts(data.products || []);
        setCustomers(data.customers || []);
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (error) {
      console.error("Error fetching live admin stats:", error);
    } finally {
      setIsLoading(false);
      if (showIndicator) setIsRefreshing(false);
    }
  }, []);

  // Initial load and 5-second periodic polling for live customer-to-admin sync
  useEffect(() => {
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("techai_admin_session");
      if (!session) {
        router.push("/admin/login");
        return;
      }
    }

    fetchLiveData();
    const interval = setInterval(() => {
      fetchLiveData(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [router, fetchLiveData]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("techai_admin_session");
    }
    router.push("/admin/login");
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    note?: string
  ) => {
    try {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note }),
      });
      fetchLiveData();
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  const handleRefillStock = async (productId: string, addQty: number) => {
    try {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, stock: Math.max(0, p.stock + addQty) } : p))
      );
      await fetch(`/api/products/${productId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: addQty }),
      });
      fetchLiveData();
      setRefillModalProduct(null);
    } catch (err) {
      console.error("Failed to refill stock:", err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      await fetch(`/api/products/${productId}`, { method: "DELETE" });
      fetchLiveData();
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  };

  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const discount = Math.round(((newProduct.originalPrice - newProduct.price) / newProduct.originalPrice) * 100);
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProduct,
          discountPercent: discount > 0 ? discount : 0,
          rating: 4.9,
          reviewCount: 1,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        fetchLiveData(true);
      } else {
        alert(data.message || "Could not save product");
      }
    } catch (err) {
      alert("Failed to save product.");
    }
  };

  const exportOrdersToExcel = () => {
    const exportData = orders.map((order) => ({
      "Order ID": order.id,
      "Customer Name": order.shippingAddress.fullName,
      "Phone": order.shippingAddress.phone,
      "Email": order.shippingAddress.email,
      "Address": `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
      "Payment Method": order.paymentMethod,
      "Payment Status": order.paymentStatus,
      "Order Status": order.status,
      "Tracking Number": order.trackingNumber,
      "Final Amount (₹)": order.finalAmount,
      "Created At": order.createdAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, `techai-orders-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filteredOrders = orders.filter((o) => {
    const query = orderSearch.toLowerCase();
    return (
      o.id.toLowerCase().includes(query) ||
      o.shippingAddress.fullName.toLowerCase().includes(query) ||
      o.shippingAddress.phone.toLowerCase().includes(query) ||
      o.shippingAddress.email.toLowerCase().includes(query) ||
      o.status.toLowerCase().includes(query)
    );
  });

  const filteredProducts = products.filter((p) =>
    p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header Navigation */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TechAiLogo size="md" />
            <div className="flex items-center space-x-2">
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                ADMIN CONTROL CENTER
              </span>
              <span className="hidden sm:flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>MongoDB Connected</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={() => fetchLiveData(true)}
              disabled={isRefreshing}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg font-bold transition-all border border-slate-700 disabled:opacity-50"
              title="Manually sync live data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{isRefreshing ? "Syncing..." : "Sync Live"}</span>
            </button>

            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold transition-all border border-slate-700"
            >
              <span>Customer Portal</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg font-bold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Live Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-2 relative overflow-hidden group shadow-xl">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
              <DollarSign className="w-16 h-16 text-emerald-400" />
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Sales</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">₹{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-[11px] font-semibold text-emerald-400 flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>From {stats.totalOrdersCount} order(s)</span>
            </p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-2 relative overflow-hidden group shadow-xl">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
              <ShoppingBag className="w-16 h-16 text-cyan-400" />
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Orders</span>
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">{stats.totalOrdersCount}</p>
            <p className="text-[11px] font-semibold text-cyan-400">Live order tracking active</p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-2 relative overflow-hidden group shadow-xl">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
              <Package className="w-16 h-16 text-purple-400" />
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Catalog Items</span>
              <Package className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">{stats.totalProductsCount}</p>
            <p className="text-[11px] font-semibold text-purple-400">Products in MongoDB</p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-2 relative overflow-hidden group shadow-xl">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
              <AlertCircle className="w-16 h-16 text-amber-400" />
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Low Stock</span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-amber-400">{stats.lowStockCount}</p>
            <p className="text-[11px] font-semibold text-amber-400/80">Products with ≤ 5 stock</p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-2 relative overflow-hidden group shadow-xl col-span-2 md:col-span-1">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
              <Users className="w-16 h-16 text-blue-400" />
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Registered Users</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">{stats.totalCustomersCount}</p>
            <p className="text-[11px] font-semibold text-blue-400">Google / Phone / Email</p>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-3">
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab("ANALYTICS")}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
                activeTab === "ANALYTICS"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Overview & Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab("PRODUCTS")}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
                activeTab === "PRODUCTS"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Products & Stock</span>
            </button>

            <button
              onClick={() => setActiveTab("ORDERS")}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
                activeTab === "ORDERS"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Live Orders ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab("CUSTOMERS")}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center space-x-2 ${
                activeTab === "CUSTOMERS"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black shadow-lg shadow-cyan-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customer Directory ({customers.length})</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {activeTab === "PRODUCTS" && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            )}

            <button
              onClick={exportOrdersToExcel}
              className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Export Orders</span>
            </button>
          </div>
        </div>

        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === "ANALYTICS" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sales & Orders Overview */}
              <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span>Real-time Sales Activity Summary</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">Synced at {lastSyncTime || "now"}</span>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                    <p className="text-[11px] text-slate-400 font-bold uppercase">Avg Order Value</p>
                    <p className="text-lg font-black text-emerald-400 mt-1">
                      ₹{stats.totalOrdersCount > 0 ? Math.round(stats.totalRevenue / stats.totalOrdersCount).toLocaleString() : 0}
                    </p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                    <p className="text-[11px] text-slate-400 font-bold uppercase">Placed Orders</p>
                    <p className="text-lg font-black text-cyan-400 mt-1">
                      {orders.filter((o) => o.status === "Placed").length}
                    </p>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                    <p className="text-[11px] text-slate-400 font-bold uppercase">Completed Delivery</p>
                    <p className="text-lg font-black text-purple-400 mt-1">
                      {orders.filter((o) => o.status === "Delivered").length}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider">Recent Live Orders</h4>
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800/60 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-mono text-cyan-400 font-bold">{order.id}</span>
                        <p className="text-slate-300 font-semibold">{order.shippingAddress.fullName} ({order.shippingAddress.city})</p>
                      </div>
                      <div className="text-right space-y-0.5">
                        <p className="font-extrabold text-emerald-400">₹{order.finalAmount.toLocaleString()}</p>
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300">
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Status Distribution */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
                <h3 className="text-sm font-extrabold text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>Fulfillment Status Breakdown</span>
                </h3>

                <div className="space-y-3 pt-1">
                  {(["Placed", "Processing", "Shipped", "Out for Delivery", "Delivered"] as OrderStatus[]).map((st) => {
                    const count = orders.filter((o) => o.status === st).length;
                    const percent = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
                    return (
                      <div key={st} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-300">
                          <span>{st}</span>
                          <span className="text-slate-400">{count} ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              st === "Delivered" ? "bg-emerald-400" : st === "Placed" ? "bg-cyan-400" : "bg-purple-400"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS & STOCK MANAGEMENT */}
        {activeTab === "PRODUCTS" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search products by title, category, brand..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <span className="text-xs text-slate-400 font-bold">{filteredProducts.length} Product(s)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Product Info</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock Level</th>
                    <th className="py-3 px-4 text-center">Refill Inventory</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 flex items-center space-x-3">
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-10 h-10 object-contain bg-white rounded-lg p-1 border border-slate-700 flex-shrink-0"
                        />
                        <div>
                          <p className="font-bold text-white line-clamp-1 max-w-xs">{product.title}</p>
                          <p className="text-[10px] text-slate-400">{product.brand}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-medium">{product.category}</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">₹{product.price.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold px-2.5 py-1 rounded-full text-[11px] inline-block ${
                            product.stock <= 5
                              ? "bg-rose-950 text-rose-400 border border-rose-800"
                              : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          }`}
                        >
                          {product.stock} units
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => handleRefillStock(product.id, 10)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px] font-bold rounded-lg transition"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => handleRefillStock(product.id, 50)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-bold rounded-lg transition"
                          >
                            +50
                          </button>
                          <button
                            onClick={() => setRefillModalProduct(product)}
                            className="px-2.5 py-1 bg-cyan-950 text-cyan-300 hover:bg-cyan-900 text-[11px] font-bold rounded-lg border border-cyan-800 transition"
                          >
                            Custom
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE ORDERS & FULFILLMENT */}
        {activeTab === "ORDERS" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
                <Truck className="w-4 h-4 text-cyan-400" />
                <span>Customer Orders & Live Fulfillment Tracking</span>
              </h3>
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter by Order ID, Phone, Customer..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <ShoppingBag className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-sm font-bold text-slate-400">No orders found in MongoDB</p>
                <p className="text-xs">When customers place orders, they will appear here automatically.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-lg hover:border-slate-700 transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 text-xs">
                      <div>
                        <span className="text-slate-400">Order ID: </span>
                        <span className="font-bold font-mono text-cyan-400 text-sm">{order.id}</span>
                        <span className="ml-3 text-[11px] text-slate-500">{order.createdAt}</span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-slate-400 font-bold">Status:</span>
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleUpdateOrderStatus(order.id, e.target.value as OrderStatus)
                          }
                          className="bg-slate-900 border border-slate-700 text-cyan-300 font-bold px-3 py-1 rounded-xl text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none cursor-pointer"
                        >
                          <option value="Placed">Placed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                        <p className="font-bold text-white text-sm">{order.shippingAddress.fullName}</p>
                        <p className="text-slate-300 flex items-center space-x-1.5">
                          <Phone className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{order.shippingAddress.phone}</span>
                        </p>
                        {order.shippingAddress.email && (
                          <p className="text-slate-300 flex items-center space-x-1.5">
                            <Mail className="w-3.5 h-3.5 text-purple-400" />
                            <span>{order.shippingAddress.email}</span>
                          </p>
                        )}
                        <p className="text-slate-400 text-[11px] pt-1">
                          <MapPin className="w-3 h-3 text-slate-500 inline mr-1" />
                          {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
                          {order.shippingAddress.state} - {order.shippingAddress.pincode}
                        </p>
                      </div>

                      <div className="space-y-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                        <p className="font-bold text-white text-xs uppercase tracking-wider border-b border-slate-800 pb-1">
                          Ordered Items ({order.items.length})
                        </p>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-slate-300">
                            <span>{item.product.title} (x{item.quantity})</span>
                            <span className="font-bold text-emerald-400">
                              ₹{(item.product.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-slate-800 flex justify-between font-black text-white text-xs">
                          <span>Total Amount ({order.paymentMethod}):</span>
                          <span className="text-cyan-400 text-sm">₹{order.finalAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between pt-2 text-xs border-t border-slate-900">
                      <div className="text-[11px] text-slate-400 space-x-2">
                        <span>Tracking #: <strong className="font-mono text-slate-200">{order.trackingNumber}</strong></span>
                        <span>• Payment: <strong className="text-emerald-400">{order.paymentStatus} ({order.paymentMethod})</strong></span>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1 sm:pt-0">
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, "Shipped", "Package dispatched via TECH AI Courier")}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-lg transition"
                        >
                          Mark Shipped
                        </button>
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, "Out for Delivery", "Out for delivery with local courier agent")}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold rounded-lg transition"
                        >
                          Out for Delivery
                        </button>
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, "Delivered", "Package delivered successfully")}
                          className="px-3 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 font-bold rounded-lg transition"
                        >
                          Mark Delivered
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CUSTOMER DIRECTORY */}
        {activeTab === "CUSTOMERS" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search customers by name, email, phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <span className="text-xs text-slate-400 font-bold">{filteredCustomers.length} Customer(s)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Contact Phone</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredCustomers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-white flex items-center space-x-2">
                        {user.avatar && (
                          <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700" />
                        )}
                        <span>{user.name}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-cyan-400">{user.phone || "N/A"}</td>
                      <td className="py-3 px-4 text-slate-300">{user.email || "N/A"}</td>
                      <td className="py-3 px-4 font-bold">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800">
                          {user.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
              <Plus className="w-5 h-5 text-emerald-400" />
              <span>Add New Product to Store</span>
            </h3>

            <form onSubmit={handleAddProductSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Product Title</label>
                <input
                  type="text"
                  required
                  value={newProduct.title}
                  onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                  >
                    {CATEGORIES.filter((c) => c !== "All Categories").map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Brand</label>
                  <input
                    type="text"
                    required
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Original Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newProduct.originalPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, originalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Initial Stock</label>
                  <input
                    type="number"
                    required
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold text-cyan-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Image URL</label>
                <input
                  type="text"
                  required
                  value={newProduct.image}
                  onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refill Custom Stock Modal */}
      {refillModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              <span>Refill Inventory Stock</span>
            </h3>

            <p className="text-slate-300">
              Refilling stock for: <strong className="text-white">{refillModalProduct.title}</strong>
            </p>

            <div className="space-y-1">
              <label className="text-slate-300 font-bold">Add Quantity Units</label>
              <input
                type="number"
                min={1}
                value={refillAmount}
                onChange={(e) => setRefillAmount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-cyan-400 font-bold text-base"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRefillModalProduct(null)}
                className="px-4 py-2 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRefillStock(refillModalProduct.id, refillAmount)}
                className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl"
              >
                Confirm Refill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
