import { validateProductImages } from "@/lib/product-images";
import {
  hasProductImageReferences,
  resolveProductImageReferences,
} from "@/lib/admin-product-images";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import { toClientProduct } from "@/lib/serializers";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";

const buildProductQuery = (id: string) => {
  if (
    mongoose.Types.ObjectId.isValid(id) &&
    String(new mongoose.Types.ObjectId(id)) === id
  ) {
    return { $or: [{ productId: id }, { _id: id }] };
  }
  return { productId: id };
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
    if (session?.role !== "admin")
      return NextResponse.json(
        { success: false, message: "Administrator access required." },
        { status: 403 },
      );
    const { id } = await params;
    let body = await req.json();
    const imageError = validateProductImages(body);
    if (imageError)
      return NextResponse.json(
        { success: false, message: imageError },
        { status: 400 },
      );
    await connectToDatabase();

    if (hasProductImageReferences(body)) {
      const existing = await Product.findOne(buildProductQuery(id))
        .select({
          productId: 1,
          image: 1,
          originalImage: 1,
          normalizedImage: 1,
          images: 1,
        })
        .lean();
      if (!existing)
        return NextResponse.json(
          { success: false, message: "Product not found" },
          { status: 404 },
        );
      try {
        body = resolveProductImageReferences(body, existing);
      } catch (error) {
        return NextResponse.json(
          { success: false, message: (error as Error).message },
          { status: 400 },
        );
      }
    }

    const product = await Product.findOneAndUpdate(
      buildProductQuery(id),
      { $set: body },
      { new: true, runValidators: true },
    );

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      product: toClientProduct(product),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
    if (session?.role !== "admin")
      return NextResponse.json(
        { success: false, message: "Administrator access required." },
        { status: 403 },
      );
    const { id } = await params;
    await connectToDatabase();

    const product = await Product.findOneAndDelete(buildProductQuery(id));

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product deleted from MongoDB.",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 },
    );
  }
}
