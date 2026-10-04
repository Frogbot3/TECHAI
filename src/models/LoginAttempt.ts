import mongoose, { Schema } from "mongoose";

const schema = new Schema({ _id: String, count: { type: Number, default: 0 }, expiresAt: Date });
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export default mongoose.models.LoginAttempt || mongoose.model("LoginAttempt", schema);
