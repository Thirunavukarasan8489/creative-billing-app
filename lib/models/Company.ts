import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICompany extends Document {
  name: string;
  address: string;
  phone: string;
  email?: string;
  gstin?: string;
  state: string;
  stateCode: string;
  gstRegistered: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    gstin: { type: String, trim: true, uppercase: true, default: "" },
    state: { type: String, required: true, default: "Tamil Nadu" },
    stateCode: { type: String, required: true, default: "33" },
    gstRegistered: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Pre-save hook to set gstRegistered based on GSTIN presence if not explicitly provided
CompanySchema.pre<ICompany>("save", function (next) {
  if (this.gstin && this.gstin.trim().length > 0) {
    this.gstRegistered = true;
  }
  next();
});

const Company: Model<ICompany> =
  mongoose.models.Company || mongoose.model<ICompany>("Company", CompanySchema);

export default Company;
