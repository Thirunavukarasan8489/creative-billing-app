import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import Company from "@/lib/models/Company";
import { invoiceSchema } from "@/lib/validation/invoice";
import { getNextInvoiceNumber, getFinancialYear } from "./next-number/route";
import { numberToWords } from "@/lib/numberToWords";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const companyId = searchParams.get("companyId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (companyId) query.companyId = companyId;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) (query.date as Record<string, unknown>).$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        (query.date as Record<string, unknown>).$lte = end;
      }
    }

    if (search) {
      query.$or = [
        { number: { $regex: search, $options: "i" } },
        { "companySnapshot.name": { $regex: search, $options: "i" } },
        { "items.description": { $regex: search, $options: "i" } },
      ];
    }

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("companyId", "name phone gstin");

    return NextResponse.json({
      invoices,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
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

    // Fetch company to form historic snapshot
    const company = await Company.findById(data.companyId);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 400 });
    }

    const companySnapshot = {
      name: company.name,
      address: company.address,
      phone: company.phone,
      email: company.email || "",
      gstin: company.gstin || "",
      state: company.state || "Tamil Nadu",
      stateCode: company.stateCode || "33",
    };

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
      // Extract sequence if custom number provided
      const existingCount = await Invoice.countDocuments({
        type: data.type,
        financialYear,
      });
      sequenceNumber = existingCount + 1;
    }

    const invoice = await Invoice.create({
      type: data.type,
      number: invoiceNumber,
      financialYear,
      sequenceNumber,
      date: new Date(data.date),
      companyId: company._id,
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
      status: data.status || "draft",
      paidAmount: data.status === "paid" ? roundedGrandTotal : 0,
      balanceAmount: data.status === "paid" ? 0 : roundedGrandTotal,
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
