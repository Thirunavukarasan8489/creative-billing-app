import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Company from "@/lib/models/Company";
import Invoice from "@/lib/models/Invoice";
import { companySchema } from "@/lib/validation/company";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const company = await Company.findById(id);

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Get company ledger stats
    const invoices = await Invoice.find({ companyId: id });
    const totalBilled = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const outstanding = totalBilled - totalPaid;

    return NextResponse.json({
      company,
      stats: {
        totalInvoices: invoices.length,
        totalBilled,
        totalPaid,
        outstanding,
      },
    });
  } catch (error) {
    console.error("Error fetching company details:", error);
    return NextResponse.json(
      { error: "Failed to fetch company details" },
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
    const body = await req.json();

    const validation = companySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const data = validation.data;
    const gstRegistered = Boolean(data.gstin && data.gstin.trim().length > 0);

    const company = await Company.findByIdAndUpdate(
      id,
      { ...data, gstRegistered },
      { new: true, runValidators: true }
    );

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { error: "Failed to update company" },
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

    // Check if company has invoices
    const count = await Invoice.countDocuments({ companyId: id });
    if (count > 0) {
      return NextResponse.json(
        { error: "Cannot delete company with associated invoices" },
        { status: 400 }
      );
    }

    const company = await Company.findByIdAndDelete(id);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Company deleted successfully" });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { error: "Failed to delete company" },
      { status: 500 }
    );
  }
}
