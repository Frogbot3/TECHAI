"use client";
import { useEffect, useState } from "react";
import type { CartItem, ShippingAddress } from "./types";
import type { BuyerTaxDetails, TaxSnapshot } from "./tax-types";
export function useCheckoutTaxQuote(
  cart: CartItem[],
  address: ShippingAddress,
  buyer: BuyerTaxDetails,
  coupon: string | undefined,
  enabled: boolean,
) {
  const [state, setState] = useState<{
    key: string;
    quote?: { tax: TaxSnapshot; hash: string };
    error: string;
    busy: boolean;
  }>({ key: "", error: "", busy: false });
  const key = JSON.stringify({
    items: cart.map((i) => ({
      productId: i.product.id,
      quantity: i.quantity,
      selectedColor: i.selectedColor,
      selectedSize: i.selectedSize,
    })),
    shippingAddress: address,
    buyerTax: buyer,
    discountCode: coupon,
  });
  const ready =
    enabled &&
    !!address.state &&
    /^[1-9]\d{5}$/.test(address.pincode) &&
    cart.length > 0;
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    setState({ key, error: "", busy: true });
    const timeout = setTimeout(() => {
      fetch("/api/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: key,
        signal: controller.signal,
        cache: "no-store",
      })
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) throw Error(data.message);
          return data;
        })
        .then((quote) => {
          if (!controller.signal.aborted)
            setState({ key, quote, error: "", busy: false });
        })
        .catch((e) => {
          if (!controller.signal.aborted)
            setState({
              key,
              error: e.message || "Unable to calculate taxes. Retry checkout.",
              busy: false,
            });
        });
    }, 200);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [key, ready]);
  return ready && state.key === key
    ? state
    : { quote: undefined, error: "", busy: ready };
}
