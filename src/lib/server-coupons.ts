import Coupon from "@/models/Coupon";
import {
  calculateCouponDiscount,
  legacyCoupon,
  type CouponData,
} from "./coupons";

export async function resolveCouponDiscount(code: unknown, subtotal: number) {
  if (
    typeof code !== "string" ||
    !/^[A-Z0-9_-]{3,32}$/.test(code.trim().toUpperCase())
  )
    throw new Error("Enter a valid coupon code.");
  const normalized = code.trim().toUpperCase();
  const stored = await Coupon.findOne({ code: normalized })
    .maxTimeMS(3000)
    .lean();
  const coupon =
    stored || (normalized === legacyCoupon.code ? legacyCoupon : null);
  if (!coupon)
    throw new Error("Coupon not found. Check the code and try again.");
  return {
    code: normalized,
    discount: calculateCouponDiscount(coupon as CouponData, subtotal),
  };
}
