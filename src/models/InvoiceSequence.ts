import mongoose, { Schema } from "mongoose";
const schema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Number, required: true },
  },
  { timestamps: true },
);
export default mongoose.models.InvoiceSequence ||
  mongoose.model("InvoiceSequence", schema);
