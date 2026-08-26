import mongoose, { Schema, Document } from "mongoose";

export interface IProductReview {
  reviewId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  verifiedPurchase?: boolean;
}

export interface IProduct extends Document {
  productId: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  image: string;
  images?: string[];
  stock: number;
  isAiProduct: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  isHeroFeatured?: boolean;
  heroBannerHeadline?: string;
  heroBannerSubtitle?: string;
  heroBadge?: string;
  heroOfferText?: string;
  description: string;
  features: string[];
  specs: Record<string, string>;
  reviews: IProductReview[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    productId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    brand: { type: String, required: true },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    discountPercent: { type: Number, default: 0 },
    rating: { type: Number, default: 4.5 },
    reviewCount: { type: Number, default: 120 },
    image: { type: String, required: true },
    images: [{ type: String }],
    stock: { type: Number, required: true, default: 10 },
    isAiProduct: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isHeroFeatured: { type: Boolean, default: false },
    heroBannerHeadline: { type: String, default: "" },
    heroBannerSubtitle: { type: String, default: "" },
    heroBadge: { type: String, default: "" },
    heroOfferText: { type: String, default: "" },
    description: { type: String, default: "" },
    features: [{ type: String }],
    specs: { type: Map, of: String, default: {} },
    reviews: [
      {
        reviewId: { type: String, required: true },
        userName: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, required: true },
        date: { type: String, default: "" },
        verifiedPurchase: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
