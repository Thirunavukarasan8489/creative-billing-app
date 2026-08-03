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

    if (!mongoose.models.Company) {
      mongoose.model("Company", Company.schema);
    }

    const invoice = await Invoice.findById(id)
      .populate("companyId")
      .lean();

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const payments = await Payment.find({ invoiceId: id })
      .sort({ date: -1 })
      .lean();

    return NextResponse.json({ invoice, payments });
  } catch (error) {
    console.error("Error fetching invoice details:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice details" },
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

    const existing = await Invoice.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const body = await req.json();

    // Support quick status update (e.g. Cancel bill action from ledger)
    if (body.status && !body.items) {
      existing.status = body.status;
      if (body.status === "cancelled") {
        existing.balanceAmount = 0;
      }
      await existing.save();
      return NextResponse.json({ invoice: existing, message: "Status updated" });
    }

    const validation = invoiceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    let companySnapshot = existing.companySnapshot;
    let companyObjId = existing.companyId;

    if (data.companyId && mongoose.Types.ObjectId.isValid(data.companyId)) {
      const company = await Company.findById(data.companyId);
      if (company) {
        companyObjId = company._id;
        companySnapshot = {
          name: company.name,
          address: company.address,
          phone: company.phone,
          email: company.email || "",
          gstin: company.gstin || "",
          state: company.state || "Tamil Nadu",
          stateCode: company.stateCode || "33",
        };
      }
    } else if (data.type === "labour_bill" && data.labourCategory === "cash") {
      companyObjId = null as any;
      companySnapshot = {
        name: data.customCustomerName?.trim() || body.companySnapshot?.name || "CASH SALE",
        address: data.customCustomerAddress?.trim() || body.companySnapshot?.address || "",
        phone: data.customCustomerPhone?.trim() || body.companySnapshot?.phone || "",
        email: "",
        gstin: "",
        state: "Tamil Nadu",
        stateCode: "33",
      };
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

    const isCashLabour = data.type === "labour_bill" && data.labourCategory === "cash";
    const status = isCashLabour ? "paid" : (data.status || existing.status);

    const paidAmount = status === "paid" ? roundedGrandTotal : existing.paidAmount || 0;
    const balanceAmount = Math.max(0, roundedGrandTotal - paidAmount);

    const updated = await Invoice.findByIdAndUpdate(
      id,
      {
        type: data.type,
        labourCategory: data.type === "labour_bill" ? data.labourCategory || "cash" : undefined,
        date: new Date(data.date),
        poNumber: data.poNumber || "",
        poDate: data.poDate ? new Date(data.poDate) : null,
        quoteNumber: data.quoteNumber || "",
        quoteDate: data.quoteDate ? new Date(data.quoteDate) : null,
        companyId: companyObjId ? companyObjId : undefined,
        companySnapshot,
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
        paidAmount,
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

    const existing = await Invoice.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    await Invoice.findByIdAndDelete(id);

    return NextResponse.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice" },
      { status: 500 }
    );
  }
}
