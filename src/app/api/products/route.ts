import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import { INITIAL_PRODUCTS } from "@/lib/data";

export async function GET() {
  try {
    await connectToDatabase();
    let products = await Product.find({}).sort({ createdAt: -1 });

    if (products.length === 0) {
      // Seed products to MongoDB on first run
      const formattedInitial = INITIAL_PRODUCTS.map((p) => ({
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
      }));

      await Product.insertMany(formattedInitial);
      products = await Product.find({}).sort({ createdAt: -1 });
    }

    const clientProducts = products.map((p) => ({
      id: p.productId || p._id.toString(),
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
      isAiProduct: p.isAiProduct,
      isTrending: p.isTrending,
      isBestSeller: p.isBestSeller,
      description: p.description,
      features: p.features,
      specs: p.specs,
    }));

    return NextResponse.json({ success: true, count: clientProducts.length, products: clientProducts });
  } catch (error) {
    // Fallback to static seed data if database is offline
    return NextResponse.json({ success: true, count: INITIAL_PRODUCTS.length, products: INITIAL_PRODUCTS, isFallback: true });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();

    const newProduct = new Product({
      productId: body.id || `prod-ai-${Date.now()}`,
      title: body.title,
      brand: body.brand || "TECH AI",
      category: body.category || "AI Electronics",
      price: Number(body.price),
      originalPrice: Number(body.originalPrice || body.price * 1.2),
      discountPercent: Number(body.discountPercent || 15),
      image: body.image || "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800",
      stock: Number(body.stock || 20),
      isAiProduct: !!body.isAiProduct,
      description: body.description || "Next-generation AI product designed for maximum performance.",
      features: body.features || ["AI Motion Sensor", "Wireless Sync", "High Precision"],
      specs: body.specs || { Brand: "TECH AI", Warranty: "1 Year International" },
    });

    await newProduct.save();

    return NextResponse.json({ success: true, message: "Product created in Database successfully", product: newProduct });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
