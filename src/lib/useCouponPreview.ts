"use client";
import { useEffect, useState } from "react";

export function useCouponPreview(
  code: string | null | undefined,
  subtotal: number,
  enabled = true,
) {
  const [attempt, setAttempt] = useState(0);
  const key = `${code || ""}:${subtotal}:${enabled}:${attempt}`;
  const [result, setResult] = useState({ key: "", discount: 0, error: "" });
  useEffect(() => {
    if (!enabled || !code) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    let disposed = false;
    fetch("/api/coupons/validate", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, subtotal }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success)
          throw new Error(data.message || "Unable to check coupon.");
        return data;
      })
      .then((data) => {
        if (!disposed) setResult({ key, discount: data.discount, error: "" });
      })
      .catch((error) => {
        if (!disposed)
          setResult({
            key,
            discount: 0,
            error: controller.signal.aborted
              ? "Coupon check timed out. Remove it and try again."
              : error.message,
          });
      })
      .finally(() => clearTimeout(timer));
    return () => {
      disposed = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [code, subtotal, enabled, key]);
  return {
    retry: () => setAttempt((value) => value + 1),
    discount: code && result.key === key ? result.discount : 0,
    error: code && result.key === key ? result.error : "",
    busy: !!code && enabled && result.key !== key,
  };
}
