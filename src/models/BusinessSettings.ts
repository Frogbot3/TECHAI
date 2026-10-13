import mongoose, { Schema } from "mongoose";
const schema = new Schema(
  {
    key: { type: String, unique: true, required: true },
    settings: { type: Schema.Types.Mixed, required: true },
    updatedBy: String,
  },
  { timestamps: true },
);
export default mongoose.models.BusinessSettings ||
  mongoose.model("BusinessSettings", schema);
