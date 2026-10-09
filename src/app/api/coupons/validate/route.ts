import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { resolveCouponDiscount } from "@/lib/server-coupons";

// Preview only. Order creation recalculates using database prices before reserving stock.
export async function POST(req: Request) {
  try {
    const { code, subtotal } = await req.json();
    if (
      typeof subtotal !== "number" ||
      !Number.isFinite(subtotal) ||
      subtotal <= 0 ||
      subtotal > 100000000
    )
      return NextResponse.json(
        { success: false, message: "Invalid cart subtotal." },
        { status: 400 },
      );
    await connectToDatabase();
    const result = await resolveCouponDiscount(code, subtotal);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const databaseError = /Mongo|Timeout|Network|Mongoose/.test(
      (error as Error)?.name || "",
    );
    return NextResponse.json(
      {
        success: false,
        message: databaseError
          ? "Unable to check coupon. Please retry."
          : error instanceof Error
            ? error.message
            : "Unable to check coupon.",
      },
      { status: databaseError ? 503 : 400 },
    );
  }
}
