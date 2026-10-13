import { createHash } from "node:crypto";
import { getBusinessSettings } from "./server-business-settings";
import { calculateTaxOrder, paise } from "./tax";
import type { TaxInputLine } from "./tax";
import type { BuyerTaxDetails } from "./tax-types";
import type { ShippingAddress } from "./types";
import { standardShippingFee } from "./checkout";
import { resolveCouponDiscount } from "./server-coupons";
export async function calculateTrustedCheckout(
  lines: TaxInputLine[],
  address: ShippingAddress,
  buyer: BuyerTaxDetails = { kind: "consumer" },
  coupon?: string,
) {
  const settings = await getBusinessSettings();
  const subtotal =
    lines.reduce((n, l) => n + paise(l.price) * l.quantity, 0) / 100;
  const offer = coupon
    ? await resolveCouponDiscount(coupon, subtotal)
    : { discount: 0, code: "" };
  const tax = calculateTaxOrder(
    settings,
    lines,
    address,
    buyer,
    offer.discount,
    standardShippingFee(subtotal),
  );
  const hash = createHash("sha256").update(JSON.stringify(tax)).digest("hex");
  return { tax, hash, discountCode: offer.code };
}
