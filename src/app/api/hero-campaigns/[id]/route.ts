import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { ADMIN_SESSION_COOKIE, getSessionFromCookie } from "@/lib/auth";
import HeroCampaign from "@/models/HeroCampaign";
import Product from "@/models/Product";
import { toClientHeroCampaign, toClientProduct } from "@/lib/serializers";

const buildQuery = (id: string) =>
  mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id
    ? { $or: [{ campaignId: id }, { _id: id }] }
    : { campaignId: id };

const parseDate = (value: unknown) => {
  const date = new Date(String(value || ""));
  return Number.isNaN(date.getTime()) ? null : date;
};

const getPayload = (body: Record<string, unknown>, existing: any) => {
  const merged = { ...existing.toObject(), ...body };
  const name = String(merged.name || "").trim();
  const badge = String(merged.badge || "").trim();
  const productId = String(merged.productId || "").trim();
  const subtitle = String(merged.subtitle || "").trim();
  const offerText = String(merged.offerText || "").trim();
  const ctaText = String(merged.ctaText || "").trim();
  const startAt = parseDate(merged.startAt);
  const endAt = parseDate(merged.endAt);
  const price = Number(merged.price);
  const originalPrice = Number(merged.originalPrice);

  if (!name || !badge || !productId || !subtitle || !offerText || !ctaText) return { error: "Name, badge, product, subtitle, offer text, and CTA are required." };
  if (!startAt || !endAt) return { error: "Start and end dates must be valid." };
  if (endAt <= startAt) return { error: "End date must be after the start date." };
  if (!Number.isFinite(price) || price < 0) return { error: "Selling price cannot be negative." };
  if (!Number.isFinite(originalPrice) || originalPrice < price) return { error: "MRP cannot be lower than the selling price." };

  return {
    value: {
      name,
      badge,
      productId,
      titleOverride: String(merged.titleOverride || "").trim(),
      subtitle,
      price,
      originalPrice,
      discountPercent: originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
      offerText,
      ctaText,
      imageOverride: String(merged.imageOverride || "").trim(),
      backgroundStyle: merged.backgroundStyle === "gradient" ? "gradient" : "solid",
      backgroundValue: String(merged.backgroundValue || "#5b2f87").trim(),
      verified: Boolean(merged.verified),
      priority: Number(merged.priority || 0),
      displayOrder: Number(merged.displayOrder || 0),
      startAt,
      endAt,
      isActive: merged.isActive !== false,
    },
  };
};

const adminOnly = async () => {
  const session = await getSessionFromCookie(ADMIN_SESSION_COOKIE);
  return !!session && session.role === "admin";
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await adminOnly())) return NextResponse.json({ success: false, message: "Admin access required." }, { status: 401 });
  try {
    const { id } = await params;
    const body = await req.json() as Record<string, unknown>;
    await connectToDatabase();
    const existing = await HeroCampaign.findOne(buildQuery(id));
    if (!existing) return NextResponse.json({ success: false, message: "Campaign not found." }, { status: 404 });
    const parsed = getPayload(body, existing);
    if (parsed.error) return NextResponse.json({ success: false, message: parsed.error }, { status: 400 });
    const value = parsed.value;
    if (!value) return NextResponse.json({ success: false, message: "Invalid campaign payload." }, { status: 400 });
    const product = await Product.findOne({ productId: value.productId });
    if (!product) return NextResponse.json({ success: false, message: "Selected product does not exist." }, { status: 400 });
    const campaign = await HeroCampaign.findOneAndUpdate(buildQuery(id), { $set: value }, { new: true });
    return NextResponse.json({ success: true, campaign: toClientHeroCampaign(campaign, toClientProduct(product)) });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await adminOnly())) return NextResponse.json({ success: false, message: "Admin access required." }, { status: 401 });
  try {
    const { id } = await params;
    await connectToDatabase();
    const campaign = await HeroCampaign.findOneAndDelete(buildQuery(id));
    if (!campaign) return NextResponse.json({ success: false, message: "Campaign not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: (error as Error).message }, { status: 500 });
  }
}
