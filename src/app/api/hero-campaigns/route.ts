import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";
import HeroCampaign from "@/models/HeroCampaign";
import Product from "@/models/Product";
import { toClientHeroCampaign, toClientProduct } from "@/lib/serializers";

const parseDate = (value: unknown) => {
  const date = new Date(String(value || ""));
  return Number.isNaN(date.getTime()) ? null : date;
};

const validateCampaign = (body: Record<string, unknown>) => {
  const name = String(body.name || "").trim();
  const badge = String(body.badge || "").trim();
  const productId = String(body.productId || "").trim();
  const subtitle = String(body.subtitle || "").trim();
  const offerText = String(body.offerText || "").trim();
  const ctaText = String(body.ctaText || "").trim();
  const startAt = parseDate(body.startAt);
  const endAt = parseDate(body.endAt);
  if (!name || !badge || !productId || !subtitle || !offerText || !ctaText) return "Name, badge, product, subtitle, offer text, and CTA are required.";
  if (!startAt || !endAt) return "Start and end dates must be valid.";
  if (endAt <= startAt) return "End date must be after the start date.";
  if (!["solid", "gradient"].includes(String(body.backgroundStyle || "solid"))) return "Background style is invalid.";

  return null;
};

const getCampaignsWithProducts = async (filter: Record<string, unknown>, includeMissing = false) => {
  const campaigns = await HeroCampaign.find(filter).sort({ priority: -1, displayOrder: 1, startAt: 1 }).limit(100).read("primary").lean();
  const productIds = campaigns.map((campaign) => campaign.productId);
  const products = await Product.find({ productId: { $in: productIds } }).read("secondaryPreferred").lean();
  const productsById = new Map(products.map((product) => [product.productId, toClientProduct(product)]));
  return campaigns.filter(campaign => includeMissing || productsById.has(campaign.productId)).map((campaign) => toClientHeroCampaign(campaign, productsById.get(campaign.productId)));
};

export async function GET(req: Request) {
  const includeInactive = new URL(req.url).searchParams.get("includeInactive") === "1";
  if (includeInactive) {
    const session = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
    if (!session || session.role !== "admin") return NextResponse.json({ success: false, message: "Admin access required." }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const now = new Date();
    const filter = includeInactive
      ? {}
      : { isActive: true, startAt: { $lte: now }, endAt: { $gte: now } };
    const campaigns = await getCampaignsWithProducts(filter, includeInactive);
    return NextResponse.json({ success: true, campaigns });
  } catch (error) {
    console.error("Hero campaigns GET error:", error);
    if (includeInactive) {
      return NextResponse.json({ success: false, message: "Campaign data is temporarily unavailable. Please retry in a moment." }, { status: 503 });
    }
    return NextResponse.json({ success: true, campaigns: [], isFallback: true });
  }
}

export async function POST(req: Request) {
  const session = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
  if (!session || session.role !== "admin") return NextResponse.json({ success: false, message: "Admin access required." }, { status: 401 });

  try {
    const body = await req.json() as Record<string, unknown>;
    const validationMessage = validateCampaign(body);
    if (validationMessage) return NextResponse.json({ success: false, message: validationMessage }, { status: 400 });

    await connectToDatabase();
    const productId = String(body.productId).trim();
    const product = await Product.findOne({ productId });
    if (!product) return NextResponse.json({ success: false, message: "Selected product does not exist." }, { status: 400 });

    const price = Number(product.price);
    const originalPrice = Number(product.originalPrice || product.price);
    const campaign = await HeroCampaign.create({
      campaignId: String(body.id || `campaign-${Date.now()}`),
      name: String(body.name).trim(),
      badge: String(body.badge).trim(),
      productId,
      titleOverride: String(body.titleOverride || "").trim(),
      subtitle: product.description,
      price,
      originalPrice,
      discountPercent: originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
      offerText: String(body.offerText).trim(),
      ctaText: String(body.ctaText).trim(),
      imageOverride: String(body.imageOverride || "").trim(),
      backgroundStyle: body.backgroundStyle === "gradient" ? "gradient" : "solid",
      backgroundValue: String(body.backgroundValue || "#5b2f87").trim(),
      verified: Boolean(body.verified),
      priority: Number(body.priority || 0),
      displayOrder: Number(body.displayOrder || 0),
      startAt: new Date(String(body.startAt)),
      endAt: new Date(String(body.endAt)),
      isActive: body.isActive !== false,
    });

    return NextResponse.json({ success: true, campaign: toClientHeroCampaign(campaign, toClientProduct(product)) });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
