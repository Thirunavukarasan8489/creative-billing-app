import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuotationItem {
  description: string;
  quantity: string; // e.g. "5 PAD", "10 PAD", "8 NOS.", "100"
  rate: number;
  amount: number;
}

export interface IQuotationCompanySnapshot {
  name: string;
  address: string;
  phone: string;
  gstin?: string;
  recipientTitle?: string;
}

export interface IQuotation extends Document {
  number: string;
  date: Date;
  companyId: mongoose.Types.ObjectId;
  companySnapshot: IQuotationCompanySnapshot;
  recipientTitle: string;
  subject: string;
  items: IQuotationItem[];
  subtotal: number;
  taxNote: string; // e.g. "GST TAX 18% EXTRA"
  grandTotal: number;
  status: "draft" | "sent" | "converted";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QuotationItemSchema = new Schema({
  description: { type: String, required: true },
  quantity: { type: String, required: true, default: "1" },
  rate: { type: Number, required: true, default: 0 },
  amount: { type: Number, required: true, default: 0 },
});

const QuotationSchema: Schema = new Schema(
  {
    number: { type: String, required: true, unique: true },
    date: { type: Date, required: true, default: Date.now },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    companySnapshot: {
      name: { type: String, required: true },
      address: { type: String, required: true },
      phone: { type: String, required: true },
      gstin: { type: String, default: "" },
      recipientTitle: { type: String, default: "The Purchase Manager" },
    },
    recipientTitle: { type: String, default: "The Purchase Manager" },
    subject: { type: String, default: "Sub : Rate Quotation Reg." },
    items: [QuotationItemSchema],
    subtotal: { type: Number, required: true, default: 0 },
    taxNote: { type: String, default: "GST TAX 18% EXTRA" },
    grandTotal: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["draft", "sent", "converted"],
      default: "draft",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

const Quotation: Model<IQuotation> =
  mongoose.models.Quotation ||
  mongoose.model<IQuotation>("Quotation", QuotationSchema);

export default Quotation;
