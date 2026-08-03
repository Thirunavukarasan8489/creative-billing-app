import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import Company from "@/lib/models/Company";
import { invoiceSchema } from "@/lib/validation/invoice";
import { numberToWords } from "@/lib/numberToWords";

function getFinancialYear(dateStr: string | Date): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1; // 1-12
  const year = d.getFullYear();
  const startYear = month >= 4 ? year : year - 1;
  const endYearShort = String(startYear + 1).slice(-2);
  const startYearShort = String(startYear).slice(-2);
  return `${startYearShort}-${endYearShort}`;
}

async function getNextInvoiceNumber(
  type: "tax_invoice" | "labour_bill",
  dateStr: string | Date
): Promise<{ number: string; financialYear: string; sequenceNumber: number }> {
  const financialYear = getFinancialYear(dateStr);
  const prefix = type === "tax_invoice" ? "TI" : "LB";

  const count = await Invoice.countDocuments({
    type,
    financialYear,
  });

  const sequenceNumber = count + 1;
  const seqStr = String(sequenceNumber).padStart(4, "0");
  const number = `${prefix}/${financialYear}/${seqStr}`;

  return { number, financialYear, sequenceNumber };
}

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const companyId = searchParams.get("companyId");
    const search = searchParams.get("search");

    const query: any = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
      query.companyId = companyId;
    }

    if (search) {
      query.$or = [
        { number: { $regex: search, $options: "i" } },
        { "companySnapshot.name": { $regex: search, $options: "i" } },
        { "items.description": { $regex: search, $options: "i" } },
      ];
    }

    const invoices = await Invoice.find(query)
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ invoices, total: invoices.length });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const validation = invoiceSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;

    let companySnapshot: any;
    let companyObjId: any = null;

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
    }

    if (!companySnapshot) {
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

    // Calculate/Verify Math
    const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const isTaxInvoice = data.type === "tax_invoice";
    
    const cgstPercent = isTaxInvoice ? (data.cgstPercent ?? 9) : 0;
    const sgstPercent = isTaxInvoice ? (data.sgstPercent ?? 9) : 0;

    const cgstAmount = isTaxInvoice ? Math.round((subtotal * cgstPercent) / 100 * 100) / 100 : 0;
    const sgstAmount = isTaxInvoice ? Math.round((subtotal * sgstPercent) / 100 * 100) / 100 : 0;

    const rawTotal = subtotal + cgstAmount + sgstAmount;
    const roundedGrandTotal = Math.round(rawTotal);
    const roundOff = Math.round((roundedGrandTotal - rawTotal) * 100) / 100;
    const amountInWords = numberToWords(roundedGrandTotal);

    // Auto Invoice Numbering if not provided
    let invoiceNumber = data.number;
    let financialYear = getFinancialYear(data.date);
    let sequenceNumber = 1;

    if (!invoiceNumber || invoiceNumber.trim() === "") {
      const nextData = await getNextInvoiceNumber(data.type, data.date);
      invoiceNumber = nextData.number;
      financialYear = nextData.financialYear;
      sequenceNumber = nextData.sequenceNumber;
    } else {
      const existingCount = await Invoice.countDocuments({
        type: data.type,
        financialYear,
      });
      sequenceNumber = existingCount + 1;
    }

    const isCashLabour = data.type === "labour_bill" && data.labourCategory === "cash";
    const status = isCashLabour ? "paid" : (data.status || "draft");

    const invoice = await Invoice.create({
      type: data.type,
      labourCategory: data.type === "labour_bill" ? data.labourCategory || "cash" : undefined,
      number: invoiceNumber,
      financialYear,
      sequenceNumber,
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
      paidAmount: status === "paid" ? roundedGrandTotal : 0,
      balanceAmount: status === "paid" ? 0 : roundedGrandTotal,
      notes: data.notes || "",
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json(
      { error: "Failed to create invoice" },
      { status: 500 }
    );
  }
}
