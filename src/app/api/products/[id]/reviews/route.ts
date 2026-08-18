import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import { toClientProduct } from "@/lib/serializers";

const buildProductQuery = (id: string) => {
  if (mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id) {
    return { $or: [{ productId: id }, { _id: id }] };
  }
  return { productId: id };
};

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const product = await Product.findOne(buildProductQuery(id)).lean();
    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, reviews: product.reviews || [] });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userName, rating, comment } = await req.json();

    if (!userName?.trim() || !comment?.trim() || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, message: "Valid name, rating (1-5), and comment are required." }, { status: 400 });
    }

    await connectToDatabase();
    const product = await Product.findOne(buildProductQuery(id));
    if (!product) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 });
    }

    const newReview = {
      reviewId: `rev-${Date.now()}`,
      userName: userName.trim(),
      rating: Number(rating),
      comment: comment.trim(),
      date: new Date().toISOString().split("T")[0],
      verifiedPurchase: true,
    };

    const existingReviews = product.reviews || [];
    const newReviewCount = product.reviewCount + 1;
    const totalStars =
      existingReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, product.rating * product.reviewCount) +
      Number(rating);
    const newRating = Math.min(5, Math.max(1, Number((totalStars / newReviewCount).toFixed(1))));

    product.reviews = [newReview, ...existingReviews];
    product.reviewCount = newReviewCount;
    product.rating = newRating;
    await product.save();

    return NextResponse.json({
      success: true,
      product: toClientProduct(product),
      review: {
        id: newReview.reviewId,
        productId: product.productId,
        userName: newReview.userName,
        rating: newReview.rating,
        comment: newReview.comment,
        date: newReview.date,
        verifiedPurchase: true,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
