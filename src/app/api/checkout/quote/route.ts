import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { calculateTrustedCheckout } from "@/lib/server-checkout-tax";
import Product from "@/models/Product";
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (
      !Array.isArray(body.items) ||
      !body.items.length ||
      body.items.length > 100
    )
      throw Error("A valid cart is required.");
    await connectToDatabase();
    const grouped = new Map<string, any>();
    for (const item of body.items) {
      const id = String(item?.productId || item?.product?.id || "");
      if (
        !Number.isInteger(item?.quantity) ||
        item.quantity < 1 ||
        item.quantity > 99
      )
        throw Error("Invalid quantity.");
      for (const value of [item.selectedColor, item.selectedSize])
        if (
          value !== undefined &&
          (typeof value !== "string" || value.length > 100)
        )
          throw Error("Invalid variant.");
      const key = JSON.stringify([
        id,
        item.selectedColor || "",
        item.selectedSize || "",
      ]);
      grouped.set(key, {
        ...item,
        productId: id,
        quantity: item.quantity + (grouped.get(key)?.quantity || 0),
      });
    }
    const lines = await Promise.all(
      [...grouped.values()].map(async (item: any) => {
        const id = String(item.productId || item.product?.id || "");
        const product: any = await Product.findOne({ productId: id }).lean();
        if (!product) throw Error("An item is no longer available.");
        return {
          productId: product.productId,
          sku: product.sku,
          description: product.title,
          variant: [item.selectedColor, item.selectedSize]
            .filter(Boolean)
            .join(" / "),
          quantity: item.quantity,
          price: product.price,
          tax: product.tax,
        };
      }),
    );
    const quote = await calculateTrustedCheckout(
      lines,
      body.shippingAddress,
      body.buyerTax || { kind: "consumer" },
      body.discountCode,
    );
    return NextResponse.json(quote, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      { message: (e as Error).message },
      { status: 422 },
    );
  }
}
