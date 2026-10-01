import mongoose, { Document, Schema } from "mongoose";

export interface IHeroCampaign extends Document {
  campaignId: string;
  name: string;
  badge: string;
  productId: string;
  titleOverride?: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  offerText: string;
  ctaText: string;
  imageOverride?: string;
  backgroundStyle: "solid" | "gradient";
  backgroundValue: string;
  verified: boolean;
  priority: number;
  displayOrder: number;
  startAt: Date;
  endAt: Date;
  isActive: boolean;
  impressions: number;
  clicks: number;
  productClicks: number;
  createdAt: Date;
  updatedAt: Date;
}

const HeroCampaignSchema = new Schema<IHeroCampaign>(
  {
    campaignId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    badge: { type: String, required: true, trim: true },
    productId: { type: String, required: true, index: true },
    titleOverride: { type: String, default: "" },
    subtitle: { type: String, required: true, default: "" },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    offerText: { type: String, required: true, trim: true },
    ctaText: { type: String, required: true, trim: true },
    imageOverride: { type: String, default: "" },
    backgroundStyle: { type: String, enum: ["solid", "gradient"], default: "solid" },
    backgroundValue: { type: String, default: "#5b2f87" },
    verified: { type: Boolean, default: false },
    priority: { type: Number, default: 0, index: true },
    displayOrder: { type: Number, default: 0, index: true },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    impressions: { type: Number, default: 0, min: 0 },
    clicks: { type: Number, default: 0, min: 0 },
    productClicks: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

HeroCampaignSchema.index({ isActive: 1, startAt: 1, endAt: 1, priority: -1, displayOrder: 1 });

export default mongoose.models.HeroCampaign || mongoose.model<IHeroCampaign>("HeroCampaign", HeroCampaignSchema);
