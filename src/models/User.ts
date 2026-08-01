import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  phone: string;
  name?: string;
  email?: string;
  avatar?: string;
  otp?: string;
  otpExpiresAt?: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    phone: { type: String, required: true, unique: true, index: true },
    name: { type: String, default: "Tech AI Customer" },
    email: { type: String, default: "" },
    avatar: { type: String, default: "" },
    otp: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    addresses: [
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
    ],
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
