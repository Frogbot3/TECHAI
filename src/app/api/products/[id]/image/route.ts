import { connectToDatabase } from "@/lib/mongodb";
import Product from "@/models/Product";
import { toClientProduct } from "@/lib/serializers";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const field = new URL(request.url).searchParams.get("field") || "image";
  if (!["image", "originalImage", "normalizedImage"].includes(field) && !/^\d{1,2}$/.test(field)) {
    return new Response("Invalid image field", { status: 400 });
  }
  try {
    await connectToDatabase();
    const record = await Product.findOne({ productId: id }).maxTimeMS(3000).lean();
    if (!record) return new Response("Not found", { status: 404 });
    const product = toClientProduct(record);
    const value = /^\d+$/.test(field) ? product.images?.[Number(field)]
      : product[field as "image" | "originalImage" | "normalizedImage"];
    const match = value?.match(/^data:(image\/(?:png|jpeg|webp|gif|avif));base64,([A-Za-z0-9+/=\s]+)$/);
    if (!match) return new Response("Image unavailable", { status: 404 });
    return new Response(new Uint8Array(Buffer.from(match[2], "base64")), {
      headers: { "Content-Type": match[1], "Cache-Control": "public, max-age=60, stale-while-revalidate=300", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return new Response("Image temporarily unavailable", { status: 503 });
  }
}
