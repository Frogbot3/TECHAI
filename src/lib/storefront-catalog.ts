import { createHash } from "node:crypto";
import { unstable_cache } from "next/cache";
import { connectToDatabase } from "./mongodb";
import ProductModel from "@/models/Product";
import HeroCampaignModel from "@/models/HeroCampaign";
import { toClientHeroCampaign, toClientProduct } from "./serializers";
import { INITIAL_PRODUCTS } from "./data";
import type { Product } from "./types";

/** Image bytes load separately, at the size needed by next/image. */
export function storefrontProduct(product: Product): Product {
  const imageUrl = (value: string, field: string) => {
    if (!value.startsWith("data:image/")) return value;
    const version = createHash("sha256").update(value).digest("hex").slice(0, 16);
    return `/api/products/${encodeURIComponent(product.id)}/image?field=${field}&v=${version}`;
  };
  return {
    ...product,
    image: imageUrl(product.image, "image"),
    normalizedImage: imageUrl(product.normalizedImage || "", "normalizedImage"),
    originalImage: imageUrl(product.originalImage || "", "originalImage"),
    images: product.images?.map((src, index) => imageUrl(src, String(index))),
  };
}

// Public catalogue only. No account, cart, or order data enters this cache.
const readStorefrontSnapshot = unstable_cache(async () => {
    await connectToDatabase();
    const now = new Date();
    const [records, campaignRecords] = await Promise.all([
      ProductModel.find({}).sort({ createdAt: -1 }).limit(100).read("secondaryPreferred").maxTimeMS(5000).lean(),
      HeroCampaignModel.find({ isActive: true, startAt: { $lte: now }, endAt: { $gt: now } })
        .sort({ priority: -1, displayOrder: 1, startAt: 1 }).limit(100).read("primary").maxTimeMS(5000).lean(),
    ]);
    const products = records.map(toClientProduct).map(storefrontProduct);
    const campaigns = campaignRecords.flatMap(record => {
      const product = products.find(p => p.id === record.productId);
      return product ? [toClientHeroCampaign(record, product)] : [];
    });
    return { products, campaigns, isFallback: false };
}, ["storefront-home-v2"], { revalidate: 60 });

export async function getStorefrontSnapshot() {
  try { return await readStorefrontSnapshot(); }
  catch (error) {
    console.warn("Storefront snapshot unavailable:", error instanceof Error ? error.message : "unknown error");
    // Never cache a failed database read as a successful catalogue snapshot.
    return { products: INITIAL_PRODUCTS, campaigns: [], isFallback: true };
  }
}
