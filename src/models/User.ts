import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  phone?: string;
  verifiedPhone?: string;
  name?: string;
  email?: string;
  avatar?: string;
  googleId?: string;
  /** Firebase UID — primary stable identifier from Firebase Auth */
  firebaseUid?: string;
  provider: "phone" | "email" | "google";
  /** Deprecated: raw plaintext OTP (kept for backwards-compat until fully migrated) */
  otp?: string | null;
  otpExpiresAt?: Date | null;
  /** Secure server-side email OTP fields (HMAC-SHA256 hashed) */
  emailOtpHash?: string | null;
  emailOtpExpiresAt?: Date | null;
  emailOtpAttempts?: number;
  emailOtpLastSentAt?: Date | null;
  addresses: {
    fullName: string;
    phone: string;
    email: string;
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  }[];
  wishlist: string[];
  role: "customer" | "admin";
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema(
  {
    fullName: String,
    phone: String,
    email: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String,
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    phone: { type: String, default: "" },
    verifiedPhone: { type: String },
    name: { type: String, default: "Tech AI Customer" },
    email: { type: String, default: "", trim: true, lowercase: true },
    avatar: { type: String, default: "" },
    googleId: { type: String, default: "" },
    /** Firebase UID for stable cross-provider identity linking */
    firebaseUid: { type: String, default: "" },
    provider: { type: String, enum: ["phone", "email", "google"], default: "phone" },
    // Legacy plaintext OTP fields (still used for phone OTP stored on the document)
    otp: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    // Secure hashed email OTP fields
    emailOtpHash: { type: String, default: null },
    emailOtpExpiresAt: { type: Date, default: null },
    emailOtpAttempts: { type: Number, default: 0 },
    emailOtpLastSentAt: { type: Date, default: null },
    addresses: [AddressSchema],
    wishlist: { type: [String], default: [] },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Partial unique indexes exclude empty legacy identifiers. New Google/OTP
// sign-ins with the same verified identifier must reuse the existing account.
UserSchema.index({ firebaseUid: 1 }, { unique: true, name: "unique_firebase_identity", partialFilterExpression: { firebaseUid: { $gt: "" } } });
UserSchema.index({ email: 1 }, { unique: true, name: "unique_email_identity", partialFilterExpression: { email: { $gt: "" } } });
// Legacy phone fields also contain unverified delivery contacts and can be
// shared by different people. Enforce identity uniqueness only after OTP proof.
UserSchema.index({ phone: 1 }, { sparse: true });
UserSchema.index({ verifiedPhone: 1 }, { unique: true, name: "unique_verified_phone_identity", partialFilterExpression: { verifiedPhone: { $gt: "" } } });
UserSchema.index({ createdAt: -1 });

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
