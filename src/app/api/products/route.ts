import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import { INITIAL_PRODUCTS } from "@/lib/data";
import { toClientProduct } from "@/lib/serializers";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";

const seedOperations = () =>
  INITIAL_PRODUCTS.map((p) => ({
    updateOne: {
      filter: { productId: p.id },
      update: {
        // Add newly introduced catalog items without overwriting admin edits.
        $setOnInsert: {
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
          images: p.images || [p.image],
          originalImage: p.originalImage || p.image,
          normalizedImage: p.normalizedImage || "",
          imageFit: p.imageFit || "auto",
          imageScale: p.imageScale || "medium",
          imagePosition: p.imagePosition || "center",
          stock: p.stock,
          isAiProduct: !!p.isAiProduct,
          isTrending: !!p.isTrending,
          isBestSeller: !!p.isBestSeller,
          isHeroFeatured: !!p.isHeroFeatured,
          heroBannerHeadline: p.heroBannerHeadline || "",
          heroBannerSubtitle: p.heroBannerSubtitle || "",
          heroBadge: p.heroBadge || "",
          heroOfferText: p.heroOfferText || "",
          description: p.description,
          features: p.features,
          specs: p.specs,
        },
      },
      upsert: true,
    },
  }));

export async function GET(req: Request) {
  try {
    await connectToDatabase();

    // Keep the database additive so new AI catalog products appear for existing stores.
    await Product.bulkWrite(seedOperations(), { ordered: false });

    const searchParams = new URL(req.url).searchParams;
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 100)));
    const [total, products] = await Promise.all([
      Product.countDocuments({}),
      Product.find({}).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ]);
    const clientProducts = products.map(toClientProduct);

    return NextResponse.json({ success: true, count: clientProducts.length, total, page, limit, totalPages: Math.ceil(total / limit), products: clientProducts });
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
    const session = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
    if (session?.role !== "admin") return NextResponse.json({ success: false, message: "Administrator access required." }, { status: 403 });
    const body = await req.json();
    await connectToDatabase();

    const images = Array.isArray(body.images) && body.images.length > 0
      ? body.images
      : [body.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&auto=format&fit=crop&q=80"];

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
      image: images[0],
      images: images,
      originalImage: body.originalImage || images[0],
      normalizedImage: body.normalizedImage || "",
      imageFit: body.imageFit || "auto",
      imageScale: body.imageScale || "medium",
      imagePosition: body.imagePosition || "center",
      stock: Number(body.stock || 0),
      isAiProduct: !!body.isAiProduct,
      isTrending: !!body.isTrending,
      isBestSeller: !!body.isBestSeller,
      isHeroFeatured: !!body.isHeroFeatured,
      heroBannerHeadline: body.heroBannerHeadline || "",
      heroBannerSubtitle: body.heroBannerSubtitle || "",
      heroBadge: body.heroBadge || "",
      heroOfferText: body.heroOfferText || "",
      description: body.description || "Reliable product with fast delivery and customer support.",
      features: Array.isArray(body.features) ? body.features : [],
      specs: body.specs || {},
      reviews: Array.isArray(body.reviews) ? body.reviews : [],
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
