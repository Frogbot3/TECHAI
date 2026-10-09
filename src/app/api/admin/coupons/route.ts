import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { legacyCoupon, validateCoupon } from "@/lib/coupons";
import Coupon from "@/models/Coupon";

async function authorized() {
  return (await getSessionFromCookie(ADMIN_SESSION_COOKIE))?.role === "admin";
}
const denied = () =>
  NextResponse.json(
    { success: false, message: "Admin access required." },
    { status: 403 },
  );
export async function GET() {
  if (!(await authorized())) return denied();
  try {
    await connectToDatabase();
    const coupons = await Coupon.find({})
      .sort({ createdAt: -1 })
      .maxTimeMS(3000)
      .lean();
    if (!coupons.some((c) => c.code === legacyCoupon.code))
      coupons.push(legacyCoupon as never);
    return NextResponse.json(
      { success: true, coupons },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to load coupons. Please retry." },
      { status: 503 },
    );
  }
}

async function save(req: Request, create: boolean) {
  if (!(await authorized())) return denied();
  let coupon;
  try {
    coupon = validateCoupon(await req.json());
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Invalid coupon.",
      },
      { status: 400 },
    );
  }
  try {
    await connectToDatabase();
    if (create && coupon.code === legacyCoupon.code)
      return NextResponse.json(
        {
          success: false,
          message: "This code already exists. Edit the welcome offer instead.",
        },
        { status: 409 },
      );
    const saved = create
      ? await Coupon.create(coupon)
      : await Coupon.findOneAndUpdate(
          { code: coupon.code },
          { $set: coupon },
          {
            new: true,
            upsert: coupon.code === legacyCoupon.code,
            runValidators: true,
          },
        );
    if (!saved)
      return NextResponse.json(
        { success: false, message: "Coupon not found." },
        { status: 404 },
      );
    return NextResponse.json({ success: true, coupon: saved });
  } catch (error) {
    const duplicate = (error as { code?: number }).code === 11000;
    return NextResponse.json(
      {
        success: false,
        message: duplicate
          ? "This coupon code already exists."
          : "Unable to save coupon. Please retry.",
      },
      { status: duplicate ? 409 : 503 },
    );
  }
}
export const POST = (req: Request) => save(req, true);
export const PATCH = (req: Request) => save(req, false);
