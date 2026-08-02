import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Company from "@/lib/models/Company";
import Invoice from "@/lib/models/Invoice";
import Payment from "@/lib/models/Payment";
import PressProfile from "@/lib/models/PressProfile";

const DEFAULT_PRESS = {
  name: "Creative Line Graphics",
  tagline: "OFFSET PRINTING PRESS",
  address:
    "2/412 72, Thirumalai Nagar, Ganapathypalayam, Veerapandi (P.O), Palladam (T.K), Tiruppur - 641 605, Tamil Nadu.",
  phone: "+91 90479 02902",
  email: "creativetpr@gmail.com",
  gstin: "33DDIPG2441F1Z0",
  state: "Tamil Nadu",
  stateCode: "33",
  bankName: "Federal Bank",
  accountNo: "13590200065469",
  ifscCode: "FDRL0001359",
  branchName: "Industrial Branch, Tiruppur",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;

    const company = await Company.findById(id).lean();
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    // Default financial year bounds if not specified
    const now = new Date();
    const currentYear = now.getFullYear();
    const defaultStart = new Date(currentYear, 3, 1); // 1st April
    const defaultEnd = new Date(currentYear + 1, 2, 31, 23, 59, 59); // 31st March next year

    const startDate = startDateParam ? new Date(startDateParam) : defaultStart;
    const endDate = endDateParam ? new Date(endDateParam) : defaultEnd;
    endDate.setHours(23, 59, 59, 999);

    // Fetch press profile details
    let press = await PressProfile.findOne().lean();
    if (!press) press = DEFAULT_PRESS as any;

    // Fetch all invoices for company
    const invoices = await Invoice.find({
      companyId: id,
      date: { $gte: startDate, $lte: endDate },
      status: { $ne: "cancelled" },
    })
      .sort({ date: 1, createdAt: 1 })
      .lean();

    const invoiceIds = invoices.map((i) => i._id);

    // Fetch all payments for these invoices
    const payments = await Payment.find({
      invoiceId: { $in: invoiceIds },
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ date: 1, createdAt: 1 })
      .lean();

    // Map invoices to rows
    const statementRows: any[] = [];

    invoices.forEach((inv) => {
      // Create a statement line for each invoice
      const itemsDescription = inv.items
        .map((i: any) => i.description)
        .join(" / ");

      statementRows.push({
        type: "invoice",
        date: inv.date,
        billNo: inv.number,
        particulars:
          itemsDescription ||
          (inv.type === "tax_invoice" ? "Tax Invoice" : "Labour Bill"),
        subtotal: inv.subtotal,
        cgstPercent: inv.cgstPercent || 0,
        cgstAmount: inv.cgstAmount || 0,
        sgstPercent: inv.sgstPercent || 0,
        sgstAmount: inv.sgstAmount || 0,
        totalAmount: inv.grandTotal,
        paymentReceived: 0,
      });
    });

    // Map payments to rows
    payments.forEach((pmt) => {
      const parentInvoice = invoices.find(
        (i) => i._id.toString() === pmt.invoiceId.toString(),
      );
      const modeLabel = pmt.mode ? pmt.mode.toUpperCase() : "PAYMENT";
      const refText = pmt.referenceNo ? ` (${pmt.referenceNo})` : "";
      const billRef = parentInvoice ? ` [Bill #${parentInvoice.number}]` : "";

      statementRows.push({
        type: "payment",
        date: pmt.date,
        billNo: parentInvoice ? parentInvoice.number : "",
        particulars: `${modeLabel}${refText}${billRef}`,
        subtotal: 0,
        cgstPercent: 0,
        cgstAmount: 0,
        sgstPercent: 0,
        sgstAmount: 0,
        totalAmount: 0,
        paymentReceived: pmt.amountPaid,
      });
    });

    // Sort combined rows chronologically by date
    statementRows.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Calculate totals
    const totalBilled = statementRows.reduce(
      (sum, r) => sum + r.totalAmount,
      0,
    );
    const totalReceived = statementRows.reduce(
      (sum, r) => sum + r.paymentReceived,
      0,
    );
    const balance = Math.round((totalBilled - totalReceived) * 100) / 100;

    return NextResponse.json({
      company,
      press,
      startDate,
      endDate,
      rows: statementRows,
      summary: {
        totalBilled,
        totalReceived,
        balance,
      },
    });
  } catch (error) {
    console.error("Error fetching company statement:", error);
    return NextResponse.json(
      { error: "Failed to generate company account statement" },
      { status: 500 },
    );
  }
}
