import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import { INITIAL_PRODUCTS } from "@/lib/data";
import { toClientProduct } from "@/lib/serializers";

const seedOperations = () =>
  INITIAL_PRODUCTS.map((p) => ({
    updateOne: {
      filter: { productId: p.id },
      update: {
        $set: {
          productId: p.id,
          title: p.title,
          brand: p.brand,
          category: p.category,
          price: p.price,
          originalPrice: p.originalPrice,
          discountPercent: p.discountPercent,
          rating: p.rating,
          reviewCount: p.reviewCount,
          image: p.image,
          stock: p.stock,
          isAiProduct: !!p.isAiProduct,
          isTrending: !!p.isTrending,
          isBestSeller: !!p.isBestSeller,
          description: p.description,
          features: p.features,
          specs: p.specs,
        },
      },
      upsert: true,
    },
  }));

export async function GET() {
  try {
    await connectToDatabase();

    if (process.env.SYNC_SEED_PRODUCTS !== "false") {
      await Product.bulkWrite(seedOperations(), { ordered: false });
    }

    const products = await Product.find({}).sort({ createdAt: -1 });
    const clientProducts = products.map(toClientProduct);

    return NextResponse.json({ success: true, count: clientProducts.length, products: clientProducts });
  } catch (error) {
    return NextResponse.json({
      success: true,
      count: INITIAL_PRODUCTS.length,
      products: INITIAL_PRODUCTS,
      isFallback: true,
      message: "Using local catalog because MongoDB is not reachable.",
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();

    const product = await Product.create({
      productId: body.id || `prod-${Date.now()}`,
      title: body.title,
      brand: body.brand || "TECH AI",
      category: body.category || "Electronics",
      price: Number(body.price),
      originalPrice: Number(body.originalPrice || body.price),
      discountPercent: Number(body.discountPercent || 0),
      rating: Number(body.rating || 4.2),
      reviewCount: Number(body.reviewCount || 0),
      image: body.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&auto=format&fit=crop&q=80",
      stock: Number(body.stock || 0),
      isAiProduct: !!body.isAiProduct,
      isTrending: !!body.isTrending,
      isBestSeller: !!body.isBestSeller,
      description: body.description || "Reliable product with fast delivery and customer support.",
      features: Array.isArray(body.features) ? body.features : [],
      specs: body.specs || {},
    });

    return NextResponse.json({
      success: true,
      message: "Product saved to MongoDB.",
      product: toClientProduct(product),
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
