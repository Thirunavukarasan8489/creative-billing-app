import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import Company from "@/lib/models/Company";
import Payment from "@/lib/models/Payment";
import { invoiceSchema } from "@/lib/validation/invoice";
import { numberToWords } from "@/lib/numberToWords";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }

    // Ensure Company model schema is registered in serverless context
    if (!mongoose.models.Company) {
      mongoose.model("Company", Company.schema);
    }

    const invoice = await Invoice.findById(id).populate("companyId").lean();

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const payments = await Payment.find({ invoiceId: id }).sort({ date: -1 }).lean();

    return NextResponse.json({
      invoice,
      payments,
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }

    const body = await req.json();

    if (body.status === "cancelled" && Object.keys(body).length === 1) {
      const updated = await Invoice.findByIdAndUpdate(
        id,
        { status: "cancelled", balanceAmount: 0 },
        { new: true }
      );
      return NextResponse.json(updated);
    }

    const validation = invoiceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;
    const existing = await Invoice.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const isTaxInvoice = data.type === "tax_invoice";

    const cgstPercent = isTaxInvoice ? (data.cgstPercent ?? 9) : 0;
    const sgstPercent = isTaxInvoice ? (data.sgstPercent ?? 9) : 0;

    const cgstAmount = isTaxInvoice ? Math.round(((subtotal * cgstPercent) / 100) * 100) / 100 : 0;
    const sgstAmount = isTaxInvoice ? Math.round(((subtotal * sgstPercent) / 100) * 100) / 100 : 0;

    const rawTotal = subtotal + cgstAmount + sgstAmount;
    const roundedGrandTotal = Math.round(rawTotal);
    const roundOff = Math.round((roundedGrandTotal - rawTotal) * 100) / 100;
    const amountInWords = numberToWords(roundedGrandTotal);

    const paidAmount = existing.paidAmount || 0;
    const balanceAmount = Math.max(0, roundedGrandTotal - paidAmount);
    const status = balanceAmount === 0 && roundedGrandTotal > 0 ? "paid" : data.status;

    const updated = await Invoice.findByIdAndUpdate(
      id,
      {
        type: data.type,
        date: new Date(data.date),
        items: data.items,
        subtotal,
        cgstPercent,
        cgstAmount,
        sgstPercent,
        sgstAmount,
        roundOff,
        grandTotal: roundedGrandTotal,
        amountInWords,
        status,
        balanceAmount,
        notes: data.notes || "",
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid invoice ID" }, { status: 400 });
    }

    const invoice = await Invoice.findByIdAndDelete(id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Delete associated payments
    await Payment.deleteMany({ invoiceId: id });

    return NextResponse.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
