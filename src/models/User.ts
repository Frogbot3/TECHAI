import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  phone?: string;
  name?: string;
  email?: string;
  avatar?: string;
  googleId?: string;
  provider: "phone" | "email" | "google";
  otp?: string | null;
  otpExpiresAt?: Date | null;
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
    provider: { type: String, enum: ["phone", "email", "google"], default: "phone" },
    otp: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    addresses: [AddressSchema],
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
