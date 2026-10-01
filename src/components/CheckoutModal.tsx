"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { CartItem, ShippingAddress, Order, OrderStatus } from "@/lib/types";
import { loadRazorpayScript } from "@/lib/razorpay-client";
import { generateOrderInvoice } from "@/lib/generateInvoice";
import TechAiLogo from "@/components/TechAiLogo";
import {
  X,
  MapPin,
  CreditCard,
  QrCode,
  Building2,
  Banknote,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Package,
  ArrowRight,
  Sparkles,
  User as UserIcon,
  Phone as PhoneIcon,
  Mail as MailIcon,
  Check,
  ChevronRight,
  Truck,
  FileText,
  Lock,
  Smartphone,
  Info,
  BadgePercent,
  Copy,
  Download,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  Clock,
  ArrowLeft,
  Navigation
} from "lucide-react";
import AddressAutocomplete, { AddressPayload } from "./AddressAutocomplete";

interface CheckoutModalProps {
  isOpen: boolean;
  cart: CartItem[];
  appliedCoupon?: string;
  user: any;
  onClose: () => void;
  onCreateOrder: (
    shippingAddress: ShippingAddress,
    paymentMethod: Order["paymentMethod"],
    discountCode?: string,
    paymentDetails?: any,
    checkoutId?: string,
    deliveryType?: "standard" | "express"
  ) => Promise<Order> | Order;
  onPaymentSuccess: () => Promise<void> | void;
  onOpenOrderTracking: (orderId: string) => void;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Delhi NCR", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab", "Rajasthan",
  "Tamil Nadu", "Telangana", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const ORDER_STAGES: { status: OrderStatus; label: string; icon: any }[] = [
  { status: "Placed", label: "Order Placed", icon: CheckCircle2 },
  { status: "Processing", label: "Confirmed", icon: Package },
  { status: "Shipped", label: "Shipped", icon: Truck },
  { status: "Out for Delivery", label: "Out for Delivery", icon: Clock },
  { status: "Delivered", label: "Delivered", icon: Check },
];

export default function CheckoutModal({
  isOpen,
  cart,
  appliedCoupon,
  user,
  onClose,
  onCreateOrder,
  onPaymentSuccess,
  onOpenOrderTracking
}: CheckoutModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<"ADDRESS" | "PAYMENT" | "PROCESSING" | "SUCCESS">("ADDRESS");
  const [paymentMethod, setPaymentMethod] = useState<Order["paymentMethod"]>("UPI");
  const [deliveryType, setDeliveryType] = useState<"standard" | "express">("standard");
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Address State
  const [address, setAddress] = useState<ShippingAddress>({
    fullName: "",
    phone: "",
    email: "",
    houseNumber: "",
    street: "",
    city: "",
    state: "Karnataka",
    pincode: "",
    landmark: "",
    deliveryInstructions: "",
    coordinates: undefined,
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(true);
  const [validationError, setValidationError] = useState("");
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [pendingPaymentResponse, setPendingPaymentResponse] = useState<RazorpaySuccessResponse | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  const checkoutIdRef = useRef("");
  const cartSignature = cart.map((item) => `${item.product.id}:${item.quantity}`).sort().join("|");
  const checkoutStorageKey = `techai-checkout-id:${cartSignature}`;

  // Sync real user profile details dynamically
  useEffect(() => {
    if (user) {
      const existingAddr = user.addresses && user.addresses.length > 0 ? user.addresses[0] : null;
      setAddress({
        fullName: user.name || existingAddr?.fullName || "",
        phone: user.phone || existingAddr?.phone || "",
        email: user.email || existingAddr?.email || "",
        houseNumber: existingAddr?.houseNumber || "",
        street: existingAddr?.street || "",
        city: existingAddr?.city || "",
        state: existingAddr?.state || "Karnataka",
        pincode: existingAddr?.pincode || "",
        landmark: existingAddr?.landmark || "",
        deliveryInstructions: existingAddr?.deliveryInstructions || "",
        coordinates: existingAddr?.coordinates,
      });
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen || !cartSignature || typeof window === "undefined") return;
    const existingCheckoutId = window.sessionStorage.getItem(checkoutStorageKey);
    const checkoutId = existingCheckoutId || (window.crypto?.randomUUID?.() || `checkout-${Date.now()}`);
    if (!existingCheckoutId) window.sessionStorage.setItem(checkoutStorageKey, checkoutId);
    checkoutIdRef.current = checkoutId;
  }, [isOpen, cartSignature, checkoutStorageKey]);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const discount = appliedCoupon === "TECHAI10" ? Math.round(subtotal * 0.1) : 0;
  const shippingFee = deliveryType === "express" ? 99 : (subtotal > 499 ? 0 : 49);
  const finalTotal = Math.max(0, subtotal - discount + shippingFee);

  const handleAutocompleteSelect = (data: AddressPayload) => {
    setAddress((prev) => ({
      ...prev,
      houseNumber: data.houseNumber || prev.houseNumber,
      street: [data.houseNumber, data.street || data.area].filter(Boolean).join(", ") || data.street || data.area || prev.street,
      city: data.city || prev.city,
      state: data.state || prev.state,
      pincode: data.pincode || prev.pincode,
      coordinates: data.lat && data.lng ? { lat: data.lat, lng: data.lng } : prev.coordinates,
    }));

    setFieldErrors((prev) => {
      const updated = { ...prev };
      if (data.street) delete updated.street;
      if (data.city) delete updated.city;
      if (data.state) delete updated.state;
      if (data.pincode) delete updated.pincode;
      return updated;
    });
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    const errors: Record<string, string> = {};

    if (!address.fullName.trim()) {
      errors.fullName = "Please enter recipient's full name";
    }
    const cleanPhone = address.phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      errors.phone = "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)";
    }
    if (!address.houseNumber?.trim() && !address.street.trim()) {
      errors.houseNumber = "House / Flat / Building number is required";
    }
    if (!address.street.trim()) {
      errors.street = "Street and locality are required";
    }
    if (!address.city.trim()) {
      errors.city = "City is required";
    }
    if (!address.state.trim()) {
      errors.state = "State is required";
    }
    const cleanPin = address.pincode.replace(/\D/g, "");
    if (cleanPin.length !== 6) {
      errors.pincode = "Please enter a valid 6-digit postal PIN code";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setValidationError("Please fix the required address fields highlighted in red below.");
      return;
    }

    setFieldErrors({});
    setStep("PAYMENT");
  };

  const showSuccess = (order: Order) => {
    setPlacedOrder(order);
    setPendingOrder(null);
    setPendingPaymentResponse(null);
    setStep("SUCCESS");
    try {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    } catch {
      // Confetti feedback is optional
    }
  };

  const verifyPayment = async (order: Order, response: RazorpaySuccessResponse) => {
    const verifyResponse = await fetch("/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpayOrderId: response.razorpay_order_id,
        razorpaySignature: response.razorpay_signature,
      }),
    });
    const verifyData = await verifyResponse.json().catch(() => null);
    if (!verifyResponse.ok || !verifyData?.success) {
      throw new Error(verifyData?.message || "Payment could not be verified.");
    }

    const verifiedOrder = verifyData?.order || {
      ...order,
      paymentStatus: "Paid",
      paymentDetails: {
        ...(order.paymentDetails || {}),
        provider: "Razorpay",
        gatewayStatus: "Payment verified",
        transactionId: response.razorpay_payment_id,
      },
    };

    showSuccess(verifiedOrder);
    if (typeof window !== "undefined") window.sessionStorage.removeItem(checkoutStorageKey);
    try {
      await onPaymentSuccess();
    } catch {
      // Payment is verified
    }
  };

  const handlePaymentSubmit = async () => {
    if (step === "PROCESSING" || isSubmittingPayment) return;
    setValidationError("");
    setIsSubmittingPayment(true);
    setStep("PROCESSING");

    try {
      const order = pendingOrder || await Promise.resolve(
        onCreateOrder(
          address,
          paymentMethod,
          appliedCoupon || undefined,
          { provider: paymentMethod === "COD" ? "COD" : "Razorpay" },
          checkoutIdRef.current,
          deliveryType
        )
      );
      if (!pendingOrder) setPendingOrder(order);

      if (paymentMethod === "COD") {
        showSuccess(order);
        if (typeof window !== "undefined") window.sessionStorage.removeItem(checkoutStorageKey);
        setIsSubmittingPayment(false);
        return;
      }

      if (pendingPaymentResponse) {
        await verifyPayment(order, pendingPaymentResponse);
        setIsSubmittingPayment(false);
        return;
      }

      const createPaymentResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const paymentData = await createPaymentResponse.json().catch(() => null);
      if (!createPaymentResponse.ok || !paymentData?.success) {
        throw new Error(paymentData?.message || "Unable to start Razorpay checkout.");
      }

      if (!(await loadRazorpayScript()) || !window.Razorpay) {
        throw new Error("Razorpay Checkout could not be loaded. Check your connection and try again.");
      }

      let paymentFlowFinished = false;
      const razorpay = new window.Razorpay({
        key: paymentData.keyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: "TECH AI",
        description: `Payment for ${order.id}`,
        order_id: paymentData.razorpayOrderId,
        handler: async (response) => {
          paymentFlowFinished = true;
          setPendingPaymentResponse(response);
          try {
            await verifyPayment(order, response);
          } catch (error) {
            setValidationError((error as Error).message || "Payment was received but could not be verified. Retry confirmation.");
            setStep("PAYMENT");
          } finally {
            setIsSubmittingPayment(false);
          }
        },
        prefill: {
          name: address.fullName || user?.name || "",
          email: address.email || user?.email || "",
          contact: address.phone || user?.phone || "",
        },
        notes: { orderId: order.id },
        theme: { color: "#0891b2" },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            setIsSubmittingPayment(false);
            if (paymentFlowFinished) return;
            setValidationError("Payment was cancelled. Your order is pending and you can retry securely.");
            setStep("PAYMENT");
          },
        },
      });

      razorpay.on("payment.failed", async (response) => {
        setIsSubmittingPayment(false);
        if (paymentFlowFinished) return;
        paymentFlowFinished = true;
        await fetch("/api/payment/failed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            reason: response.error?.description || response.error?.reason || "Razorpay payment failed",
          }),
        }).catch(() => null);
        setPendingPaymentResponse(null);
        setValidationError("Payment failed. Your cart is unchanged; you can retry securely.");
        setStep("PAYMENT");
      });

      razorpay.open();
    } catch (error) {
      setIsSubmittingPayment(false);
      setValidationError((error as Error).message || "Unable to start payment. Please try again.");
      setStep("PAYMENT");
    }
  };

  const handleDownloadInvoice = async () => {
    if (!placedOrder) return;
    try {
      setIsGeneratingInvoice(true);
      await generateOrderInvoice(placedOrder);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleCopyText = (text: string, type: "id" | "tracking") => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      if (type === "id") {
        setCopiedOrderId(true);
        setTimeout(() => setCopiedOrderId(false), 2000);
      } else {
        setCopiedTracking(true);
        setTimeout(() => setCopiedTracking(false), 2000);
      }
    }
  };

  const maskPhone = (phone?: string) => {
    if (!phone) return "Not provided";
    const digits = phone.replace(/\D/g, "");
    if (digits.length >= 10) {
      return `+91 ••••• •${digits.slice(-4)}`;
    }
    return phone;
  };

  const formatOrderDate = (isoString?: string) => {
    if (!isoString) {
      return new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const getPaymentMethodLabel = (method?: Order["paymentMethod"]) => {
    switch (method) {
      case "UPI":
        return "UPI Instant";
      case "Card":
        return "Credit / Debit Cards";
      case "NetBanking":
        return "Net Banking";
      case "COD":
        return "Pay on Delivery (COD)";
      default:
        return method || "Online Payment";
    }
  };

  const currentStageIndex = placedOrder ? ORDER_STAGES.findIndex((s) => s.status === placedOrder.status) : 0;
  const activeStage = currentStageIndex === -1 ? 0 : currentStageIndex;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto selection:bg-cyan-500 selection:text-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.2 }}
          className="bg-white w-full max-w-3xl rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden relative my-auto flex flex-col max-h-[92vh]"
        >
          {/* Header: Clean, modern white header with subtle border & TECH AI branding */}
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <TechAiLogo size="sm" />
              <span className="h-4 w-px bg-slate-200" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {step === "SUCCESS"
                  ? "Order Confirmation"
                  : step === "PAYMENT"
                  ? "Secure Payment"
                  : "Checkout"}
              </span>
            </div>

            {step !== "PROCESSING" && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Stepper Progress Bar (Only during checkout steps) */}
          {step !== "SUCCESS" && step !== "PROCESSING" && (
            <div className="bg-slate-50/70 border-b border-slate-100 px-6 py-3 flex items-center justify-center gap-3 sm:gap-6 flex-shrink-0 text-xs">
              <button
                type="button"
                onClick={() => setStep("ADDRESS")}
                className={`flex items-center gap-2 font-bold transition-colors cursor-pointer ${
                  step === "ADDRESS" ? "text-cyan-700" : "text-emerald-700"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    step === "ADDRESS"
                      ? "bg-cyan-600 text-white shadow-xs"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {step === "PAYMENT" ? <Check className="w-3.5 h-3.5" /> : "1"}
                </span>
                <span>Delivery Address</span>
              </button>

              <div className={`w-8 sm:w-16 h-0.5 rounded-full transition-colors ${step === "PAYMENT" ? "bg-cyan-600" : "bg-slate-200"}`} />

              <div
                className={`flex items-center gap-2 font-bold transition-colors ${
                  step === "PAYMENT" ? "text-cyan-700" : "text-slate-400"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    step === "PAYMENT"
                      ? "bg-cyan-600 text-white ring-4 ring-cyan-100 shadow-xs"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  2
                </span>
                <span>Payment Option</span>
              </div>
            </div>
          )}

          {/* Main Scrollable Content */}
          <div className="p-5 sm:p-7 overflow-y-auto flex-1 text-xs">
            {/* ================= STEP 1: DELIVERY ADDRESS ================= */}
            {step === "ADDRESS" && (
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                {user ? (
                  <div className="bg-cyan-50/60 border border-cyan-100 rounded-2xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-cyan-600 text-white font-black flex items-center justify-center text-xs shadow-xs">
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 text-xs">Delivering for {user.name || "Customer"}</p>
                        <p className="text-[11px] text-slate-500">{user.email || user.phone}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-cyan-800 bg-white px-2.5 py-1 rounded-full border border-cyan-200">
                      Auto-Filled
                    </span>
                  </div>
                ) : null}

                {/* Items Summary Strip */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Items in Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)})</span>
                    </span>
                    <span className="text-slate-900 font-extrabold">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 flex-shrink-0"
                      >
                        <img
                          src={item.product.normalizedImage || item.product.image}
                          alt={item.product.title}
                          className="w-7 h-7 object-contain rounded bg-slate-50"
                        />
                        <div className="text-[10px] max-w-[130px] truncate">
                          <p className="font-bold text-slate-800 truncate">{item.product.title}</p>
                          <p className="text-slate-500">Qty: {item.quantity} × ₹{item.product.price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {validationError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-2">
                    <Info className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* 1. Address Autocomplete & GPS Detection */}
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
                  <AddressAutocomplete
                    onAddressSelect={handleAutocompleteSelect}
                    currentAddressString={address.street}
                    selectedCoordinates={address.coordinates}
                  />
                </div>

                <div className="flex items-center gap-2 pt-1 pb-0.5">
                  <div className="h-px bg-slate-200 flex-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Delivery Address Details
                  </span>
                  <div className="h-px bg-slate-200 flex-1" />
                </div>

                {/* Form fields with clear inline validation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 flex items-center space-x-1">
                      <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Recipient Full Name *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={address.fullName}
                      onChange={(e) => {
                        setAddress({ ...address, fullName: e.target.value });
                        if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: "" });
                      }}
                      placeholder="e.g. Rahul Sharma"
                      className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:outline-none transition font-medium ${
                        fieldErrors.fullName ? "border-rose-400 focus:ring-rose-500 bg-rose-50/30" : "border-slate-200 focus:ring-cyan-500"
                      }`}
                    />
                    {fieldErrors.fullName && (
                      <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3" />
                        <span>{fieldErrors.fullName}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700 flex items-center space-x-1">
                      <PhoneIcon className="w-3.5 h-3.5 text-slate-400" />
                      <span>Mobile Phone Number *</span>
                    </label>
                    <div className="flex">
                      <span className="flex items-center px-3 bg-slate-100 border border-r-0 border-slate-200 text-slate-700 text-xs font-bold rounded-l-xl">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={address.phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setAddress({ ...address, phone: val });
                          if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: "" });
                        }}
                        placeholder="10-digit mobile number"
                        className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border rounded-r-xl focus:bg-white focus:ring-2 focus:outline-none transition font-medium font-mono ${
                          fieldErrors.phone ? "border-rose-400 focus:ring-rose-500 bg-rose-50/30" : "border-slate-200 focus:ring-cyan-500"
                        }`}
                      />
                    </div>
                    {fieldErrors.phone && (
                      <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3" />
                        <span>{fieldErrors.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 flex items-center space-x-1">
                    <MailIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email Address (Optional — for order updates & PDF invoice)</span>
                  </label>
                  <input
                    type="email"
                    value={address.email}
                    onChange={(e) => setAddress({ ...address, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none transition font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">
                      House / Flat / Building No. *
                    </label>
                    <input
                      type="text"
                      required
                      value={address.houseNumber || ""}
                      onChange={(e) => {
                        setAddress({ ...address, houseNumber: e.target.value });
                        if (fieldErrors.houseNumber) setFieldErrors({ ...fieldErrors, houseNumber: "" });
                      }}
                      placeholder="e.g. Flat 402, Sunshine Heights"
                      className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:outline-none transition font-medium ${
                        fieldErrors.houseNumber ? "border-rose-400 focus:ring-rose-500 bg-rose-50/30" : "border-slate-200 focus:ring-cyan-500"
                      }`}
                    />
                    {fieldErrors.houseNumber && (
                      <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3" />
                        <span>{fieldErrors.houseNumber}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">
                      Street & Area / Locality *
                    </label>
                    <input
                      type="text"
                      required
                      value={address.street}
                      onChange={(e) => {
                        setAddress({ ...address, street: e.target.value });
                        if (fieldErrors.street) setFieldErrors({ ...fieldErrors, street: "" });
                      }}
                      placeholder="e.g. 100 Feet Road, Indiranagar"
                      className={`w-full px-3.5 py-2.5 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:outline-none transition font-medium ${
                        fieldErrors.street ? "border-rose-400 focus:ring-rose-500 bg-rose-50/30" : "border-slate-200 focus:ring-cyan-500"
                      }`}
                    />
                    {fieldErrors.street && (
                      <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3" />
                        <span>{fieldErrors.street}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">City *</label>
                    <input
                      type="text"
                      required
                      value={address.city}
                      onChange={(e) => {
                        setAddress({ ...address, city: e.target.value });
                        if (fieldErrors.city) setFieldErrors({ ...fieldErrors, city: "" });
                      }}
                      placeholder="e.g. Bengaluru"
                      className={`w-full px-3 py-2.5 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 focus:outline-none transition font-medium ${
                        fieldErrors.city ? "border-rose-400 focus:ring-rose-500 bg-rose-50/30" : "border-slate-200 focus:ring-cyan-500"
                      }`}
                    />
                    {fieldErrors.city && (
                      <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3" />
                        <span>{fieldErrors.city}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">State *</label>
                    <select
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">PIN Code *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={address.pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setAddress({ ...address, pincode: val });
                        if (fieldErrors.pincode) setFieldErrors({ ...fieldErrors, pincode: "" });
                      }}
                      placeholder="6-digit PIN"
                      className={`w-full px-3 py-2.5 text-xs bg-slate-50 border rounded-xl font-mono font-bold focus:bg-white focus:ring-2 focus:outline-none transition ${
                        fieldErrors.pincode ? "border-rose-400 focus:ring-rose-500 bg-rose-50/30" : "border-slate-200 focus:ring-cyan-500"
                      }`}
                    />
                    {fieldErrors.pincode && (
                      <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3" />
                        <span>{fieldErrors.pincode}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">Landmark (Optional)</label>
                    <input
                      type="text"
                      value={address.landmark || ""}
                      onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
                      placeholder="Near Metro Station, prominent park, etc."
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none transition font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-700">Delivery Instructions (Optional)</label>
                    <input
                      type="text"
                      value={address.deliveryInstructions || ""}
                      onChange={(e) => setAddress({ ...address, deliveryInstructions: e.target.value })}
                      placeholder="e.g. Leave with security / Ring bell twice"
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-cyan-500 focus:outline-none transition font-medium"
                    />
                  </div>
                </div>

                {/* Save Address Option Checkbox */}
                <div className="pt-1 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="saveAddressCheckbox"
                    checked={saveAddressForFuture}
                    onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-600 border-slate-300 focus:ring-cyan-500 cursor-pointer"
                  />
                  <label htmlFor="saveAddressCheckbox" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                    Save this delivery address for my future purchases
                  </label>
                </div>

                {/* Delivery Option Selector */}
                <div className="pt-2">
                  <label className="text-xs font-extrabold text-slate-800 block mb-2">Select Delivery Speed</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDeliveryType("standard")}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        deliveryType === "standard"
                          ? "border-cyan-600 bg-cyan-50/60 ring-2 ring-cyan-500/20"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-xs">Standard Delivery</span>
                        <span className="text-[10px] font-bold text-emerald-600">
                          {subtotal > 499 ? "FREE" : "₹49"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Delivery in 2-4 business days</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType("express")}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        deliveryType === "express"
                          ? "border-cyan-600 bg-cyan-50/60 ring-2 ring-cyan-500/20"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>Priority Rocket</span>
                        </span>
                        <span className="text-[10px] font-bold text-slate-900">₹99</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">Guaranteed next-day delivery</p>
                    </button>
                  </div>
                </div>

                {/* Footer Bar & Submit */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <span className="text-slate-500 text-xs">Total Amount: </span>
                    <span className="font-black text-slate-950 text-base sm:text-lg">₹{finalTotal.toLocaleString("en-IN")}</span>
                    {discount > 0 && (
                      <span className="ml-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        -₹{discount} Saved
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-7 py-3 bg-slate-900 hover:bg-cyan-600 active:scale-[0.99] text-white text-xs font-black rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-cyan-500/20 cursor-pointer"
                  >
                    <span>Proceed to Payment</span>
                    <ArrowRight className="w-4 h-4 text-cyan-400" />
                  </button>
                </div>
              </form>
            )}

            {/* ================= STEP 2: REDESIGNED PREMIUM PAYMENT SELECTION ================= */}
            {step === "PAYMENT" && (
              <div className="space-y-5">
                {/* Delivery Address Summary Bar */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-slate-800 truncate">
                        Delivering to: <span className="text-slate-950 font-black">{address.fullName}</span> ({address.city}, {address.pincode})
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {deliveryType === "express" ? "Priority Rocket Delivery (Next Day)" : "Standard Express Delivery (2-4 Days)"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep("ADDRESS")}
                    className="text-xs font-bold text-cyan-700 hover:text-cyan-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:border-cyan-300 transition-colors flex-shrink-0 cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {/* Error Banner with Instant Retry Option */}
                {validationError && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-extrabold text-amber-950">Payment Attention</p>
                        <p className="text-amber-800 text-[11px] mt-0.5">{validationError}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handlePaymentSubmit}
                      disabled={isSubmittingPayment}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 self-start sm:self-auto flex-shrink-0 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSubmittingPayment ? "animate-spin" : ""}`} />
                      <span>Retry Payment</span>
                    </button>
                  </div>
                )}

                {/* Heading */}
                <div>
                  <h4 className="text-sm font-black text-slate-900">Select Payment Method</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Choose your preferred secure payment method below to complete your order.
                  </p>
                </div>

                {/* Payment Method Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Payment Methods">
                  {/* 1. UPI Instant */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === "UPI"}
                    onClick={() => setPaymentMethod("UPI")}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative flex items-start gap-3 cursor-pointer ${
                      paymentMethod === "UPI"
                        ? "border-cyan-600 bg-cyan-50/50 ring-2 ring-cyan-500/20 shadow-xs"
                        : "border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60 bg-white"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      paymentMethod === "UPI" ? "bg-cyan-600 text-white shadow-xs" : "bg-cyan-50 text-cyan-700"
                    }`}>
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">UPI Instant</span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-cyan-800 bg-cyan-100/80 px-2 py-0.5 rounded-full">
                          Fastest
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Google Pay, PhonePe, Paytm, BHIM & all UPI apps</p>
                    </div>
                    <div className="absolute right-3.5 top-4">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        paymentMethod === "UPI" ? "border-cyan-600 bg-cyan-600" : "border-slate-300"
                      }`}>
                        {paymentMethod === "UPI" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  </button>

                  {/* 2. Credit / Debit Cards */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === "Card"}
                    onClick={() => setPaymentMethod("Card")}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative flex items-start gap-3 cursor-pointer ${
                      paymentMethod === "Card"
                        ? "border-cyan-600 bg-cyan-50/50 ring-2 ring-cyan-500/20 shadow-xs"
                        : "border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60 bg-white"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      paymentMethod === "Card" ? "bg-cyan-600 text-white shadow-xs" : "bg-purple-50 text-purple-700"
                    }`}>
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">Cards</span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-purple-800 bg-purple-100/80 px-2 py-0.5 rounded-full">
                          All Major
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Visa, Mastercard, RuPay, Maestro & Diners</p>
                    </div>
                    <div className="absolute right-3.5 top-4">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        paymentMethod === "Card" ? "border-cyan-600 bg-cyan-600" : "border-slate-300"
                      }`}>
                        {paymentMethod === "Card" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  </button>

                  {/* 3. Net Banking */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === "NetBanking"}
                    onClick={() => setPaymentMethod("NetBanking")}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative flex items-start gap-3 cursor-pointer ${
                      paymentMethod === "NetBanking"
                        ? "border-cyan-600 bg-cyan-50/50 ring-2 ring-cyan-500/20 shadow-xs"
                        : "border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60 bg-white"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      paymentMethod === "NetBanking" ? "bg-cyan-600 text-white shadow-xs" : "bg-blue-50 text-blue-700"
                    }`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">Net Banking</span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-full">
                          50+ Banks
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">HDFC, ICICI, SBI, Axis, Kotak & all major banks</p>
                    </div>
                    <div className="absolute right-3.5 top-4">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        paymentMethod === "NetBanking" ? "border-cyan-600 bg-cyan-600" : "border-slate-300"
                      }`}>
                        {paymentMethod === "NetBanking" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  </button>

                  {/* 4. Pay on Delivery */}
                  <button
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === "COD"}
                    onClick={() => setPaymentMethod("COD")}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative flex items-start gap-3 cursor-pointer ${
                      paymentMethod === "COD"
                        ? "border-cyan-600 bg-cyan-50/50 ring-2 ring-cyan-500/20 shadow-xs"
                        : "border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/60 bg-white"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      paymentMethod === "COD" ? "bg-cyan-600 text-white shadow-xs" : "bg-emerald-50 text-emerald-700"
                    }`}>
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 text-xs sm:text-sm">Pay on Delivery</span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                          COD
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">Pay with Cash or UPI QR scan on delivery</p>
                    </div>
                    <div className="absolute right-3.5 top-4">
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        paymentMethod === "COD" ? "border-cyan-600 bg-cyan-600" : "border-slate-300"
                      }`}>
                        {paymentMethod === "COD" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  </button>
                </div>

                {/* Selected Method Dynamic Details Panel */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-2 text-xs">
                  {paymentMethod === "UPI" && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-extrabold text-slate-900 text-xs">Instant Razorpay UPI Gateway</p>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          Clicking Pay will launch Razorpay. You can authorize instantly via your UPI app (GPay, PhonePe, Paytm) or enter any UPI ID.
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "Card" && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-extrabold text-slate-900 text-xs">Secure Card Checkout</p>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          Supports all Visa, Mastercard, RuPay, Maestro and Amex cards with RBI-compliant 3D Secure bank OTP verification.
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "NetBanking" && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-extrabold text-slate-900 text-xs">Direct Indian Bank Transfer</p>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          All top retail and corporate banks supported including HDFC, ICICI, SBI, Axis, Kotak Mahindra and 50+ other banks.
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "COD" && (
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-extrabold text-slate-900 text-xs">Zero Advance Payment</p>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          Your order will be confirmed immediately. You can pay ₹{finalTotal.toLocaleString("en-IN")} via cash or scan courier's UPI QR upon parcel arrival.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Compact Payment Summary */}
                <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Product Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span className="font-semibold text-slate-800">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex items-center justify-between text-emerald-700">
                      <span className="flex items-center gap-1 font-medium">
                        <BadgePercent className="w-3.5 h-3.5" />
                        <span>Discount {appliedCoupon ? `(${appliedCoupon})` : ""}</span>
                      </span>
                      <span className="font-bold">-₹{discount.toLocaleString("en-IN")}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Delivery Charges ({deliveryType === "express" ? "Priority Rocket" : "Standard"})</span>
                    <span className="font-semibold text-slate-800">
                      {shippingFee === 0 ? (
                        <span className="text-emerald-700 font-extrabold uppercase text-[10px]">Free</span>
                      ) : (
                        `₹${shippingFee}`
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>Applicable Taxes (GST 18%)</span>
                    <span className="font-medium text-slate-600">Included in total</span>
                  </div>

                  <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                        Final Payable Amount
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        ₹{finalTotal.toLocaleString("en-IN")}
                      </span>
                    </div>

                    {discount > 0 && (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200">
                        Saved ₹{discount.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Payment Button & Back Link */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("ADDRESS")}
                    className="text-xs text-slate-500 hover:text-slate-900 font-bold transition-colors order-2 sm:order-1 flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Address</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePaymentSubmit}
                    disabled={isSubmittingPayment}
                    className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-cyan-600 active:scale-[0.99] text-white text-xs font-black rounded-2xl shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed order-1 sm:order-2 cursor-pointer"
                  >
                    {isSubmittingPayment ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
                        <span>Initiating Secure Checkout...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>
                          {paymentMethod === "COD"
                            ? `Confirm Order (₹${finalTotal.toLocaleString("en-IN")})`
                            : `Pay ₹${finalTotal.toLocaleString("en-IN")}`}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Secured by Razorpay • 100% Purchase Protection • Instant Refunds</span>
                </div>
              </div>
            )}

            {/* ================= STEP 3: PROCESSING STATE ================= */}
            {step === "PROCESSING" && (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-cyan-600 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center text-cyan-600">
                    <Lock className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900">Processing Your Payment...</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Connecting to the secure gateway. Please complete the prompt in the checkout modal.
                  </p>
                </div>
              </div>
            )}

            {/* ================= STEP 4: REDESIGNED PREMIUM ORDER CONFIRMATION ================= */}
            {step === "SUCCESS" && placedOrder && (
              <div className="space-y-6 py-2">
                {/* 1. Header with Success Animation */}
                <div className="text-center space-y-3">
                  <div className="relative inline-flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-md ring-8 ring-emerald-50/50"
                    >
                      <motion.svg
                        className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <motion.path
                          d="M20 6L9 17L4 12"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ pathLength: 1, opacity: 1 }}
                          transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
                        />
                      </motion.svg>
                    </motion.div>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                      Order Placed Successfully! 🎉
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Thank you for choosing TECH AI! We have confirmed your order and started preparing it for delivery.
                    </p>
                  </div>

                  {/* Order ID & Payment Status Badges */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-700">
                      <span className="text-slate-400">Order ID:</span>
                      <span className="font-mono text-slate-900 font-black">{placedOrder.id}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(placedOrder.id, "id")}
                        className="p-1 rounded-md text-slate-400 hover:text-cyan-700 transition cursor-pointer"
                        title="Copy Order ID"
                      >
                        {copiedOrderId ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {copiedOrderId && (
                        <span className="text-[10px] text-emerald-600 font-extrabold animate-fade-in">
                          Copied!
                        </span>
                      )}
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border ${
                        placedOrder.paymentStatus === "Paid"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{placedOrder.paymentStatus === "Paid" ? "Payment Verified (Paid)" : "Cash on Delivery (Pending)"}</span>
                    </span>
                  </div>
                </div>

                {/* 2. Order Progress Tracker */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-3xl p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                      Order Journey
                    </span>
                    <span className="text-[11px] font-bold text-cyan-700">
                      {placedOrder.estimatedDelivery ? `Est. ${placedOrder.estimatedDelivery}` : "Delivery in 2-4 business days"}
                    </span>
                  </div>

                  <div className="relative">
                    {/* Connecting Bar */}
                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-slate-200 -z-0 hidden sm:block" />
                    <div
                      className="absolute top-4 left-4 h-0.5 bg-emerald-500 -z-0 transition-all hidden sm:block"
                      style={{
                        width: `${(activeStage / (ORDER_STAGES.length - 1)) * 92}%`,
                      }}
                    />

                    {/* Step Indicators */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-2">
                      {ORDER_STAGES.map((stage, idx) => {
                        const Icon = stage.icon;
                        const isCompleted = idx < activeStage;
                        const isCurrent = idx === activeStage;

                        return (
                          <div key={stage.status} className="flex sm:flex-col items-center sm:text-center gap-2 sm:gap-1.5 relative z-10">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all flex-shrink-0 ${
                                isCompleted
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : isCurrent
                                  ? "bg-cyan-600 text-white ring-4 ring-cyan-100 shadow-xs"
                                  : "bg-white text-slate-400 border border-slate-200"
                              }`}
                            >
                              {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <p
                                className={`text-[11px] font-extrabold truncate ${
                                  isCurrent ? "text-cyan-800" : isCompleted ? "text-slate-800" : "text-slate-400"
                                }`}
                              >
                                {stage.label}
                              </p>
                              {isCurrent && (
                                <span className="inline-block text-[9px] font-black text-cyan-600 uppercase tracking-wider">
                                  Current Status
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Order Details & Delivery Information (2 Columns on Tablet/Desktop) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Order Details Card */}
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Order Details</span>
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        {cart.reduce((sum, i) => sum + i.quantity, 0)} Item(s)
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Placed Date:</span>
                        <span className="font-semibold text-slate-800">{formatOrderDate(placedOrder.createdAt)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Payment Method:</span>
                        <span className="font-bold text-slate-900">{getPaymentMethodLabel(placedOrder.paymentMethod)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Payment Status:</span>
                        <span className={`font-bold ${placedOrder.paymentStatus === "Paid" ? "text-emerald-700" : "text-amber-700"}`}>
                          {placedOrder.paymentStatus}
                        </span>
                      </div>

                      {placedOrder.paymentDetails?.transactionId && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Transaction ID:</span>
                          <span className="font-mono text-slate-800 font-bold truncate max-w-[150px]">
                            {placedOrder.paymentDetails.transactionId}
                          </span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-slate-600 font-bold">Total Paid:</span>
                        <span className="text-base font-black text-slate-950">₹{placedOrder.finalAmount.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Information Card */}
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-cyan-600" />
                        <span>Delivery Details</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {placedOrder.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{placedOrder.shippingAddress.fullName}</p>
                        <p className="text-[11px] text-slate-500">{maskPhone(placedOrder.shippingAddress.phone)}</p>
                        {placedOrder.shippingAddress.email && (
                          <p className="text-[11px] text-slate-500 truncate">{placedOrder.shippingAddress.email}</p>
                        )}
                      </div>

                      <div className="pt-1 text-slate-600 text-[11px] leading-relaxed">
                        <p>{placedOrder.shippingAddress.street}</p>
                        {placedOrder.shippingAddress.landmark && <p>Near: {placedOrder.shippingAddress.landmark}</p>}
                        <p className="font-semibold text-slate-800">
                          {placedOrder.shippingAddress.city}, {placedOrder.shippingAddress.state} - {placedOrder.shippingAddress.pincode}
                        </p>
                      </div>

                      {placedOrder.trackingNumber && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">AWB Tracking:</span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-bold text-slate-800">{placedOrder.trackingNumber}</span>
                            <button
                              type="button"
                              onClick={() => handleCopyText(placedOrder.trackingNumber, "tracking")}
                              className="text-slate-400 hover:text-cyan-700 p-0.5 transition cursor-pointer"
                              title="Copy Tracking Number"
                            >
                              {copiedTracking ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Purchased Products List */}
                <div className="bg-white border border-slate-200/80 rounded-3xl p-4 sm:p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Purchased Products ({placedOrder.items.length})</span>
                    </span>
                    <span className="text-[11px] text-slate-500">Click product to view details</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {placedOrder.items.map((item) => (
                      <div
                        key={item.product.id}
                        className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 group"
                      >
                        <div
                          onClick={() => {
                            onClose();
                            router.push(`/product/${encodeURIComponent(item.product.id)}`);
                          }}
                          className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                        >
                          <img
                            src={item.product.normalizedImage || item.product.image}
                            alt={item.product.title}
                            className="w-12 h-12 object-contain rounded-xl bg-slate-50 border border-slate-200 p-1 flex-shrink-0 group-hover:border-cyan-400 transition-colors"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs truncate group-hover:text-cyan-700 transition-colors flex items-center gap-1">
                              <span>{item.product.title}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              <span>Qty: {item.quantity}</span>
                              <span>•</span>
                              <span>₹{item.product.price.toLocaleString("en-IN")} each</span>
                              {item.selectedColor && (
                                <>
                                  <span>•</span>
                                  <span>Color: {item.selectedColor}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="font-black text-slate-950 text-xs sm:text-sm">
                            ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Confirmation Action Buttons Bar */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenOrderTracking(placedOrder.id);
                    }}
                    className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-cyan-600 active:scale-[0.99] text-white font-black rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all shadow-md hover:shadow-cyan-500/20 cursor-pointer"
                  >
                    <Truck className="w-4 h-4 text-cyan-400" />
                    <span>Track My Order</span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={handleDownloadInvoice}
                      disabled={isGeneratingInvoice}
                      className="flex-1 sm:flex-initial px-4 py-3 bg-white hover:bg-slate-50 active:scale-[0.99] border border-slate-200 text-slate-800 font-bold rounded-2xl text-xs flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      {isGeneratingInvoice ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-600" />
                          <span>Generating PDF...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 text-slate-500" />
                          <span>Download Invoice</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        router.push("/orders");
                      }}
                      className="flex-1 sm:flex-initial px-4 py-3 bg-white hover:bg-slate-50 active:scale-[0.99] border border-slate-200 text-slate-800 font-bold rounded-2xl text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span>View Orders</span>
                    </button>

                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
