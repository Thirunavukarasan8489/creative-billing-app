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
    name: { type: String, required: true, default: "Creative Line Graphics" },
    tagline: { type: String, default: "OFFSET PRINTING PRESS" },
    address: {
      type: String,
      required: true,
      default:
        "2/412 72, Thirumalai Nagar, Ganapathypalayam, Veerapandi (P.O), Palladam (T.K), Tiruppur - 641 605, Tamil Nadu.",
    },
    phone: { type: String, required: true, default: "+91 90479 02902" },
    email: { type: String, default: "creativetpr@gmail.com" },
    gstin: { type: String, default: "33DDIPG2441F1Z0" },
    state: { type: String, default: "Tamil Nadu" },
    stateCode: { type: String, default: "33" },
    bankName: { type: String, default: "Federal Bank" },
    accountNo: { type: String, default: "13590200065469" },
    ifscCode: { type: String, default: "FDRL0001359" },
    branchName: { type: String, default: "Industrial Branch, Tiruppur" },
    terms: {
      type: String,
      default:
        "Labour bill for printing work rendered. Payment due within 15 days of invoice date.",
    },
  },
  { timestamps: true },
);

const PressProfile: Model<IPressProfile> =
  mongoose.models.PressProfile ||
  mongoose.model<IPressProfile>("PressProfile", PressProfileSchema);

export default PressProfile;
