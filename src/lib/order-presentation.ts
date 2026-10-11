import type { CartItem } from "./types";
export const orderMoney = (value: number) =>
  `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
export const orderDate = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
export const itemVariants = (item: CartItem) =>
  [item.selectedColor, item.selectedSize].filter(Boolean).join(" · ");
export const paymentTone = (status: string) =>
  status === "Paid" ? "success" : status === "Failed" ? "danger" : "warning";
export const fulfilmentTone = (status: string) =>
  status === "Delivered" ? "success" : status === "Placed" ? "warning" : "info";
