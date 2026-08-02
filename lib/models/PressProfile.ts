import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPressProfile extends Document {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  state: string;
  stateCode: string;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  branchName: string;
  terms: string;
  createdAt: Date;
  updatedAt: Date;
}

const PressProfileSchema: Schema = new Schema(
  {
    name: { type: String, required: true, default: "CREATIVE LINE GRAPHICS" },
    tagline: { type: String, default: "OFFSET & DIGITAL PRINTING PRESS" },
    address: {
      type: String,
      required: true,
      default: "12, Printing Press Colony, Main Road, Tiruppur - 641601, Tamil Nadu.",
    },
    phone: { type: String, required: true, default: "+91 98421 00000" },
    email: { type: String, default: "creativeline.tpr@gmail.com" },
    gstin: { type: String, default: "33AAAAA0000A1Z5" },
    state: { type: String, default: "Tamil Nadu" },
    stateCode: { type: String, default: "33" },
    bankName: { type: String, default: "Union Bank of India" },
    accountNo: { type: String, default: "510101001234567" },
    ifscCode: { type: String, default: "UBIN0551015" },
    branchName: { type: String, default: "Main Branch, Tiruppur" },
    terms: {
      type: String,
      default: "Labour bill for printing work rendered. Payment due within 15 days of invoice date.",
    },
  },
  { timestamps: true }
);

const PressProfile: Model<IPressProfile> =
  mongoose.models.PressProfile ||
  mongoose.model<IPressProfile>("PressProfile", PressProfileSchema);

export default PressProfile;
