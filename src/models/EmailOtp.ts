import mongoose, { Schema } from "mongoose";

// Separate from customer records: requesting a code never creates or edits a user.
// The key is a server HMAC of the normalized email; no email/OTP plaintext is stored.
const schema = new Schema({
  _id: String,
  challengeId: { type: String, required: true },
  hash: { type: String, default: null },
  status: {
    type: String,
    enum: ["pending", "sent", "failed", "consumed"],
    required: true,
  },
  attempts: { type: Number, default: 0 },
  lastRequestedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
});
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.EmailOtp || mongoose.model("EmailOtp", schema);
