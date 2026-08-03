"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import TechAiLogo from "@/components/TechAiLogo";
import { useTechAiStore } from "@/lib/store";
import { Product, Order, OrderStatus } from "@/lib/types";
import { CATEGORIES } from "@/lib/data";
import * as XLSX from "xlsx";
import {
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Truck,
  PhoneCall,
  Search,
  LogOut,
  ShieldCheck,
  MapPin,
  ExternalLink,
  Sparkles,
  AlertCircle
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const store = useTechAiStore();

  const [activeTab, setActiveTab] = useState<"PRODUCTS" | "ORDERS">("PRODUCTS");
  const [productSearch, setProductSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const session = localStorage.getItem("techai_admin_session");
      if (!session) {
        router.push("/admin/login");
      }
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("techai_admin_session");
    }
    router.push("/admin/login");
  };

  const exportOrdersToExcel = () => {
    const data = store.orders.map((order) => ({
      "Order ID": order.id,
      "Customer Name": order.shippingAddress.fullName,
      "Phone": order.shippingAddress.phone,
      "Email": order.shippingAddress.email,
      "City": order.shippingAddress.city,
      "State": order.shippingAddress.state,
      "Pincode": order.shippingAddress.pincode,
      "Payment Method": order.paymentMethod,
      "Payment Status": order.paymentStatus,
      "Order Status": order.status,
      "Tracking Number": order.trackingNumber,
      "Final Amount": order.finalAmount,
      "Created At": order.createdAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, `techai-orders-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const totalRevenue = store.orders.reduce((sum, o) => sum + o.finalAmount, 0);
  const totalOrdersCount = store.orders.length;
  const totalProductsCount = store.products.length;
  const lowStockCount = store.products.filter((p) => p.stock <= 5).length;

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const discount = Math.round(((newProduct.originalPrice - newProduct.price) / newProduct.originalPrice) * 100);
    store.addProduct({
      ...newProduct,
      discountPercent: discount > 0 ? discount : 0,
      rating: 4.9,
      reviewCount: 1,
      specs: { "Warranty": "1 Year Official TECH AI Guarantee" }
    });
    setIsAddModalOpen(false);
    alert("New product added to catalog successfully!");
  };

  const handleExecuteRefill = (productId: string, qty: number) => {
    store.refillStock(productId, qty);
    setRefillModalProduct(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TechAiLogo size="md" />
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
              ADMIN CONTROL PANEL
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <a
              href="/"
              target="_blank"
              className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors"
            >
              <span>Customer Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-1.5 bg-red-950/80 hover:bg-red-900 text-red-300 rounded-lg font-bold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Sales</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-white">₹{totalRevenue.toLocaleString()}</p>
            <p className="text-[11px] text-emerald-400">Across {totalOrdersCount} completed order(s)</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-white">{totalOrdersCount}</p>
            <p className="text-[11px] text-cyan-400">Live order tracking active</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Catalog Items</span>
              <Package className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-white">{totalProductsCount}</p>
            <p className="text-[11px] text-purple-400">Products in database</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Low Stock Alert</span>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-amber-400">{lowStockCount}</p>
            <p className="text-[11px] text-slate-400">Products with ≤ 5 units left</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex space-x-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab("PRODUCTS")}
              className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
                activeTab === "PRODUCTS"
                  ? "bg-cyan-500 text-slate-950 font-extrabold shadow-lg shadow-cyan-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Products & Stock Management</span>
            </button>

            <button
              onClick={() => setActiveTab("ORDERS")}
              className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-2 ${
                activeTab === "ORDERS"
                  ? "bg-cyan-500 text-slate-950 font-extrabold shadow-lg shadow-cyan-500/20"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Orders & Live Tracking Updates</span>
              {store.orders.length > 0 && (
                <span className="bg-slate-950 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {store.orders.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === "PRODUCTS" && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          )}

          <button
            onClick={exportOrdersToExcel}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-md"
          >
            <Sparkles className="w-4 h-4" />
            <span>Export Orders</span>
          </button>
        </div>

        {activeTab === "PRODUCTS" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price</th>
                    <th className="py-3 px-4">Stock Level</th>
                    <th className="py-3 px-4 text-center">Refill Actions</th>
                    <th className="py-3 px-4 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {store.products
                    .filter((p) => p.title.toLowerCase().includes(productSearch.toLowerCase()))
                    .map((product) => (
                      <tr key={product.id} className="hover:bg-slate-800/50 transition-colors">
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
                            className={`font-bold px-2.5 py-1 rounded-full text-[11px] ${
                              product.stock <= 5
                                ? "bg-red-950 text-red-400 border border-red-800"
                                : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            }`}
                          >
                            {product.stock} units
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => store.refillStock(product.id, 10)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[11px] font-bold rounded-lg transition-colors"
                            >
                              +10 Stock
                            </button>
                            <button
                              onClick={() => store.refillStock(product.id, 50)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-bold rounded-lg transition-colors"
                            >
                              +50 Stock
                            </button>
                            <button
                              onClick={() => setRefillModalProduct(product)}
                              className="px-2.5 py-1 bg-cyan-950 text-cyan-300 hover:bg-cyan-900 text-[11px] font-bold rounded-lg border border-cyan-800"
                            >
                              Custom Refill
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => store.deleteProduct(product.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                            title="Delete product"
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

        {activeTab === "ORDERS" && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-4 sm:p-6">
            <h3 className="text-sm font-extrabold text-white flex items-center space-x-2">
              <Truck className="w-4 h-4 text-cyan-400" />
              <span>Customer Orders & Live Tracking Control</span>
            </h3>

            <div className="space-y-4">
              {store.orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 text-xs">
                    <div>
                      <span className="text-slate-400">Order ID: </span>
                      <span className="font-bold font-mono text-cyan-400">{order.id}</span>
                      <span className="ml-3 text-[11px] text-slate-500">{order.createdAt}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">Current Status:</span>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          store.updateOrderStatus(order.id, e.target.value as OrderStatus)
                        }
                        className="bg-slate-900 border border-slate-700 text-cyan-300 font-bold px-3 py-1 rounded-xl text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
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
                    <div className="space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                      <p className="font-bold text-white">{order.shippingAddress.fullName}</p>
                      <p className="text-slate-400">Phone: {order.shippingAddress.phone}</p>
                      <p className="text-slate-400">
                        {order.shippingAddress.street}, {order.shippingAddress.city},{" "}
                        {order.shippingAddress.state} - {order.shippingAddress.pincode}
                      </p>
                    </div>

                    <div className="space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                      <p className="font-bold text-white mb-1">Ordered Products</p>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] text-slate-300">
                          <span>{item.product.title} (x{item.quantity})</span>
                          <span className="font-bold text-emerald-400">
                            ₹{(item.product.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-slate-800 flex justify-between font-extrabold text-white text-xs">
                        <span>Total Paid ({order.paymentMethod}):</span>
                        <span className="text-cyan-400">₹{order.finalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between pt-2 text-xs">
                    <div className="text-[11px] text-slate-400">
                      <span>Tracking #: </span>
                      <span className="font-mono text-slate-200">{order.trackingNumber}</span>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          store.updateOrderStatus(
                            order.id,
                            "Shipped",
                            "Package shipped via TechAI Express Courier"
                          )
                        }
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold rounded-lg"
                      >
                        Mark Shipped
                      </button>
                      <button
                        onClick={() =>
                          store.updateOrderStatus(
                            order.id,
                            "Out for Delivery",
                            "Out for delivery with courier agent Rahul"
                          )
                        }
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold rounded-lg"
                      >
                        Mark Out for Delivery
                      </button>
                      <button
                        onClick={() =>
                          store.updateOrderStatus(
                            order.id,
                            "Delivered",
                            "Order delivered successfully to customer"
                          )
                        }
                        className="px-3 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 font-bold rounded-lg"
                      >
                        Mark Delivered
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

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
                  <label className="text-slate-300 font-bold">Selling Price (₹)</label>
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

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Description</label>
                <textarea
                  rows={2}
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                ></textarea>
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
                onClick={() => handleExecuteRefill(refillModalProduct.id, refillAmount)}
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
