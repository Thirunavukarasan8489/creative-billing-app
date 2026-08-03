import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      default: "Creative Admin",
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: { type: String, required: true, default: "admin" },
  },
  { timestamps: true },
);

const User: Model<IUser> =
  (mongoose.models && mongoose.models.User) ||
  mongoose.model<IUser>("User", UserSchema);

export default User;
