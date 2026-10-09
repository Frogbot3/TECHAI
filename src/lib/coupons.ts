export interface CouponData {
  name: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minimumSpend: number;
  maximumDiscount: number;
  published: boolean;
  startsAt: string | Date | null;
  endsAt: string | Date | null;
}

// Preserve the existing storefront offer until an administrator edits or pauses it.
export const legacyCoupon: CouponData = {
  name: "TECH AI welcome offer",
  code: "TECHAI10",
  type: "percentage",
  value: 10,
  minimumSpend: 0,
  maximumDiscount: 0,
  published: true,
  startsAt: null,
  endsAt: null,
};

export function validateCoupon(input: Record<string, unknown>): CouponData {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const code =
    typeof input.code === "string" ? input.code.trim().toUpperCase() : "";
  if (!name || name.length > 100)
    throw new Error("Enter a campaign name of 1–100 characters.");
  if (!/^[A-Z0-9_-]{3,32}$/.test(code))
    throw new Error(
      "Code must contain 3–32 letters, numbers, hyphens or underscores.",
    );
  if (input.type !== "percentage" && input.type !== "fixed")
    throw new Error("Choose a discount type.");
  const value = Number(input.value);
  const minimumSpend = Number(input.minimumSpend ?? 0);
  const maximumDiscount = Number(input.maximumDiscount ?? 0);
  if (
    ![value, minimumSpend, maximumDiscount].every(
      (n) => Number.isFinite(n) && n >= 0 && n <= 1000000,
    )
  )
    throw new Error("Enter valid discount amounts.");
  if (value <= 0 || (input.type === "percentage" && value > 100))
    throw new Error(
      "Percentage must be between 0 and 100; fixed discount must be positive.",
    );
  const date = (value: unknown) => {
    if (value === null || value === "" || value === undefined) return null;
    if (typeof value !== "string" || !Number.isFinite(Date.parse(value)))
      throw new Error("Enter valid schedule dates.");
    return new Date(value).toISOString();
  };
  const startsAt = date(input.startsAt),
    endsAt = date(input.endsAt);
  if (startsAt && endsAt && startsAt >= endsAt)
    throw new Error("End date must be after the start date.");
  if (typeof input.published !== "boolean")
    throw new Error("Published must be true or false.");
  return {
    name,
    code,
    type: input.type,
    value,
    minimumSpend,
    maximumDiscount,
    published: input.published,
    startsAt,
    endsAt,
  };
}

export function couponStatus(coupon: CouponData, now = Date.now()) {
  if (!coupon.published) return "Paused";
  if (coupon.endsAt && new Date(coupon.endsAt).getTime() <= now)
    return "Expired";
  if (coupon.startsAt && new Date(coupon.startsAt).getTime() > now)
    return "Scheduled";
  return "Active";
}

export function calculateCouponDiscount(
  coupon: CouponData,
  subtotal: number,
  now = Date.now(),
) {
  if (couponStatus(coupon, now) !== "Active")
    throw new Error("This coupon is not currently active.");
  if (!Number.isFinite(subtotal) || subtotal <= 0)
    throw new Error("Add items to your cart first.");
  if (subtotal < coupon.minimumSpend)
    throw new Error(
      `Minimum spend for this coupon is ₹${coupon.minimumSpend.toLocaleString("en-IN")}.`,
    );
  let amount =
    coupon.type === "percentage"
      ? (subtotal * coupon.value) / 100
      : coupon.value;
  if (coupon.maximumDiscount > 0)
    amount = Math.min(amount, coupon.maximumDiscount);
  return Math.min(subtotal, Math.round(amount * 100) / 100);
}
