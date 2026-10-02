import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import { toClientProduct } from "@/lib/serializers";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";

const buildProductQuery = (id: string) => {
  if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id) {
    return { $or: [{ productId: id }, { _id: id }] };
  }
  return { productId: id };
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
    if (session?.role !== "admin") return NextResponse.json({ success: false, message: "Administrator access required." }, { status: 403 });
    const { id } = await params;
    const { amount } = await req.json();

    await connectToDatabase();
    const product = await Product.findOne(buildProductQuery(id));

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
