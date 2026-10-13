import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { getBusinessSettings } from "@/lib/server-business-settings";
import { validateBusinessSettings } from "@/lib/business-settings";
import { validateProductTax } from "@/lib/tax";
import BusinessSettings from "@/models/BusinessSettings";
import Product from "@/models/Product";
export async function GET() {
  if ((await getSessionFromCookie(ADMIN_SESSION_COOKIE))?.role !== "admin")
    return NextResponse.json(
      { message: "Administrator access required." },
      { status: 403 },
    );
  try {
    await connectToDatabase();
    const settings = await getBusinessSettings();
    const products = await Product.find({})
      .select({ productId: 1, title: 1, price: 1, tax: 1 })
      .lean();
    const review = products.flatMap((p) => {
      try {
        const tax = validateProductTax(p.tax, settings);
        if (tax.cess !== "none" || tax.reverseCharge)
          throw Error("Special tax treatment needs review.");
        return [];
      } catch (e) {
        return [
          {
            id: p.productId,
            title: p.title,
            price: p.price,
            reason: (e as Error).message,
          },
        ];
      }
    });
    return NextResponse.json(
      { settings, review },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return NextResponse.json(
      { message: (e as Error).message },
      { status: 503 },
    );
  }
}
export async function PUT(req: Request) {
  const admin = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
  if (admin?.role !== "admin")
    return NextResponse.json(
      { message: "Administrator access required." },
      { status: 403 },
    );
  try {
    const settings = validateBusinessSettings(await req.json());
    await connectToDatabase();
    await BusinessSettings.findOneAndUpdate(
      { key: "invoice" },
      { $set: { settings, updatedBy: admin.id } },
      { upsert: true, runValidators: true },
    );
    return NextResponse.json({ settings });
  } catch (e) {
    return NextResponse.json(
      { message: (e as Error).message },
      { status: 400 },
    );
  }
}
