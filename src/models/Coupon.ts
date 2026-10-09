import mongoose, { Schema } from "mongoose";

const CouponSchema = new Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ["percentage", "fixed"], required: true },
    value: { type: Number, required: true },
    minimumSpend: { type: Number, default: 0 },
    maximumDiscount: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);
