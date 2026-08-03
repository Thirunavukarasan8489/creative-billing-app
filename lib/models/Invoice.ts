import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInvoiceItem {
  description: string;
  hsnSac?: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface IInvoiceCompanySnapshot {
  name: string;
  address: string;
  phone: string;
  email?: string;
  gstin?: string;
  state: string;
  stateCode: string;
}

export interface IInvoice extends Document {
  type: "tax_invoice" | "labour_bill";
  number: string;
  financialYear: string;
  sequenceNumber: number;
  date: Date;
  poNumber?: string;
  poDate?: Date;
  quoteNumber?: string;
  quoteDate?: Date;
  companyId: mongoose.Types.ObjectId;
  companySnapshot: IInvoiceCompanySnapshot;
  items: IInvoiceItem[];
  subtotal: number;
  cgstPercent: number;
  cgstAmount: number;
  sgstPercent: number;
  sgstAmount: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
  status: "draft" | "sent" | "paid" | "cancelled";
  paidAmount: number;
  balanceAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceItemSchema = new Schema({
  description: { type: String, required: true, trim: true },
  hsnSac: { type: String, trim: true, default: "" },
  quantity: { type: Number, required: true, min: 0 },
  rate: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 },
});

const CompanySnapshotSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, default: "" },
  gstin: { type: String, default: "" },
  state: { type: String, default: "Tamil Nadu" },
  stateCode: { type: String, default: "33" },
});

const InvoiceSchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: ["tax_invoice", "labour_bill"],
      required: true,
    },
    number: { type: String, required: true, unique: true, trim: true },
    financialYear: { type: String, required: true, trim: true },
    sequenceNumber: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now },
    poNumber: { type: String, trim: true, default: "" },
    poDate: { type: Date, default: null },
    quoteNumber: { type: String, trim: true, default: "" },
    quoteDate: { type: Date, default: null },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    companySnapshot: { type: CompanySnapshotSchema, required: true },
    items: { type: [InvoiceItemSchema], required: true },
    subtotal: { type: Number, required: true, default: 0 },
    cgstPercent: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstPercent: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    amountInWords: { type: String, required: true, default: "" },
    status: {
      type: String,
      enum: ["draft", "sent", "paid", "cancelled"],
      default: "draft",
    },
    paidAmount: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

InvoiceSchema.index({ type: 1, financialYear: 1, sequenceNumber: 1 }, { unique: true });

const Invoice: Model<IInvoice> =
  mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", InvoiceSchema);

export default Invoice;
