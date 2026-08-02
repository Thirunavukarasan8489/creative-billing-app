import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Quotation from "@/lib/models/Quotation";
import Invoice from "@/lib/models/Invoice";
import Company from "@/lib/models/Company";
import { numberToWords } from "@/lib/numberToWords";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const quotation = await Quotation.findById(id);
    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    const company = await Company.findById(quotation.companyId).lean();
    if (!company) {
      return NextResponse.json({ error: "Client company not found" }, { status: 400 });
    }

    const isTaxInvoice = Boolean(company.gstin && company.gstin.trim().length > 0);
    const type = isTaxInvoice ? "tax_invoice" : "labour_bill";

    // Auto-generate invoice number
    const dateObj = new Date();
    const yr = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const startYear = month >= 4 ? yr : yr - 1;
    const fyStr = `${String(startYear).slice(-2)}-${String(startYear + 1).slice(-2)}`;
    const prefix = isTaxInvoice ? "TI" : "LB";

    const count = await Invoice.countDocuments({
      type,
      number: { $regex: `^${prefix}/${fyStr}/` },
    });
    const number = `${prefix}/${fyStr}/${String(count + 1).padStart(4, "0")}`;

    // Map quotation items to invoice items
    const invoiceItems = quotation.items.map((i: any) => {
      const parsedQty = parseFloat(i.quantity) || 1;
      return {
        description: i.description,
        hsnSac: isTaxInvoice ? "9988" : "",
        quantity: parsedQty,
        rate: i.rate,
        amount: i.amount,
      };
    });

    const subtotal = quotation.subtotal;
    const cgstPercent = isTaxInvoice ? 9 : 0;
    const sgstPercent = isTaxInvoice ? 9 : 0;

    const cgstAmount = isTaxInvoice ? Math.round(((subtotal * cgstPercent) / 100) * 100) / 100 : 0;
    const sgstAmount = isTaxInvoice ? Math.round(((subtotal * sgstPercent) / 100) * 100) / 100 : 0;

    const rawTotal = subtotal + cgstAmount + sgstAmount;
    const grandTotal = Math.round(rawTotal);
    const roundOff = Math.round((grandTotal - rawTotal) * 100) / 100;
    const amountInWords = numberToWords(grandTotal);

    const invoice = await Invoice.create({
      type,
      number,
      date: new Date(),
      companyId: company._id,
      companySnapshot: {
        name: company.name,
        address: company.address,
        phone: company.phone,
        gstin: company.gstin || "",
        state: company.state || "Tamil Nadu",
        stateCode: company.stateCode || "33",
      },
      items: invoiceItems,
      subtotal,
      cgstPercent,
      cgstAmount,
      sgstPercent,
      sgstAmount,
      roundOff,
      grandTotal,
      amountInWords,
      status: "sent",
      notes: `Converted from Quotation ${quotation.number}`,
    });

    // Mark quotation as converted
    quotation.status = "converted";
    await quotation.save();

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error("Error converting quotation to invoice:", error);
    return NextResponse.json(
      { error: error.message || "Failed to convert quotation to invoice" },
      { status: 500 }
    );
  }
}
