import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  phone?: string;
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
    name: { type: String, default: "Tech AI Customer" },
    email: { type: String, default: "" },
    avatar: { type: String, default: "" },
    googleId: { type: String, default: "" },
    /** Firebase UID for stable cross-provider identity linking */
    firebaseUid: { type: String, default: "", index: true },
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
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound sparse index: do not enforce uniqueness on empty strings (legacy docs)
UserSchema.index({ firebaseUid: 1 }, { sparse: true });
UserSchema.index({ email: 1 }, { sparse: true });
UserSchema.index({ phone: 1 }, { sparse: true });

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
