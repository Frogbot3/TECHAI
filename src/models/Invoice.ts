import mongoose, { Schema } from "mongoose";
const schema = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    number: { type: String, required: true, unique: true },
    financialYear: { type: String, required: true },
    document: { type: Schema.Types.Mixed, required: true, immutable: true },
    pdf: { type: Buffer, required: true, immutable: true },
    sha256: { type: String, required: true, immutable: true },
    issuedBy: String,
  },
  { timestamps: true },
);
export default mongoose.models.Invoice || mongoose.model("Invoice", schema);
