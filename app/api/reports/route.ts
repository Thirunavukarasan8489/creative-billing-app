import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import Company from "@/lib/models/Company";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const query: Record<string, unknown> = {
      type: "tax_invoice",
      status: { $ne: "cancelled" },
    };

    if (startDateParam || endDateParam) {
      query.date = {};
      if (startDateParam) (query.date as Record<string, unknown>).$gte = new Date(startDateParam);
      if (endDateParam) {
        const end = new Date(endDateParam);
        end.setHours(23, 59, 59, 999);
        (query.date as Record<string, unknown>).$lte = end;
      }
    }

    // GST Tax Summary for Tax Invoices
    const taxInvoices = await Invoice.find(query);

    const totalSubtotal = taxInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
    const totalCGST = taxInvoices.reduce((sum, inv) => sum + inv.cgstAmount, 0);
    const totalSGST = taxInvoices.reduce((sum, inv) => sum + inv.sgstAmount, 0);
    const totalTaxableGrandTotal = taxInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    // Also get Labour Bill totals
    const labourQuery: Record<string, unknown> = {
      type: "labour_bill",
      status: { $ne: "cancelled" },
    };
    if (query.date) labourQuery.date = query.date;

    const labourInvoices = await Invoice.find(labourQuery);
    const totalLabourBilled = labourInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

    // Company Ledger Summaries
    const companies = await Company.find().sort({ name: 1 });
    const companyLedgers = await Promise.all(
      companies.map(async (company) => {
        const invs = await Invoice.find({
          companyId: company._id,
          status: { $ne: "cancelled" },
        });
        const totalBilled = invs.reduce((sum, inv) => sum + inv.grandTotal, 0);
        const totalPaid = invs.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
        const outstanding = totalBilled - totalPaid;
        return {
          companyId: company._id,
          name: company.name,
          gstin: company.gstin || "N/A",
          totalInvoices: invs.length,
          totalBilled,
          totalPaid,
          outstanding,
        };
      })
    );

    return NextResponse.json({
      gstSummary: {
        taxInvoiceCount: taxInvoices.length,
        totalSubtotal,
        totalCGST,
        totalSGST,
        totalGST: totalCGST + totalSGST,
        totalTaxableGrandTotal,
      },
      labourSummary: {
        labourInvoiceCount: labourInvoices.length,
        totalLabourBilled,
      },
      companyLedgers,
    });
  } catch (error) {
    console.error("Error generating reports:", error);
    return NextResponse.json(
      { error: "Failed to generate reports" },
      { status: 500 }
    );
  }
}
