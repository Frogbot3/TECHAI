import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import { toClientProduct } from "@/lib/serializers";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { amount } = await req.json();

    await connectToDatabase();
    const product = await Product.findOne({ $or: [{ productId: id }, { _id: id }] });

    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    product.stock = Math.max(0, Number(product.stock || 0) + Number(amount || 0));
    await product.save();

    return NextResponse.json({
      success: true,
      message: "Stock updated.",
      stock: product.stock,
      product: toClientProduct(product),
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
