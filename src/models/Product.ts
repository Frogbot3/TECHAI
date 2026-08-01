import mongoose, { Schema, Document } from "mongoose";

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
  stock: number;
  isAiProduct: boolean;
  isTrending: boolean;
  isBestSeller: boolean;
  description: string;
  features: string[];
  specs: Record<string, string>;
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
    stock: { type: Number, required: true, default: 10 },
    isAiProduct: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    description: { type: String, default: "" },
    features: [{ type: String }],
    specs: { type: Map, of: String, default: {} },
  },
  { timestamps: true }
);

export default mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);
