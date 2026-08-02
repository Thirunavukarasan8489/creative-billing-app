import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  invoiceId: mongoose.Types.ObjectId;
  amountPaid: number;
  date: Date;
  mode: "cash" | "upi" | "bank_transfer" | "cheque";
  referenceNo?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true },
    amountPaid: { type: Number, required: true, min: 0.01 },
    date: { type: Date, required: true, default: Date.now },
    mode: {
      type: String,
      enum: ["cash", "upi", "bank_transfer", "cheque"],
      default: "bank_transfer",
    },
    referenceNo: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
