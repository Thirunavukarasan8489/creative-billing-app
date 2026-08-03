import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import Company from "@/lib/models/Company";
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
};

const MONTH_NAMES = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Ensure models are registered in serverless lambda context
    if (!mongoose.models.Company) {
      mongoose.model("Company", Company.schema);
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const monthParam = searchParams.get("month"); // 1 - 12
    const yearParam = searchParams.get("year"); // YYYY
    const typeParam = searchParams.get("type"); // "tax_invoice" | "labour_bill" | "all"

    const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();

    const startDate = new Date(year, month - 1, 1, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    let press = await PressProfile.findOne().lean();
    if (!press) press = DEFAULT_PRESS as any;

    const query: any = {
      date: { $gte: startDate, $lte: endDate },
      status: { $ne: "cancelled" },
    };

    if (typeParam === "tax_invoice" || typeParam === "labour_bill") {
      query.type = typeParam;
    }

    // Fetch active non-cancelled invoices in that month
    const invoices = await Invoice.find(query)
      .populate("companyId")
      .sort({ date: 1, number: 1 })
      .lean();

    const rows = invoices.map((inv: any) => {
      const companyName =
        inv.companySnapshot?.name ||
        (typeof inv.companyId === "object" ? inv.companyId?.name : "N/A") ||
        "N/A";

      const gstin =
        inv.companySnapshot?.gstin ||
        (typeof inv.companyId === "object" ? inv.companyId?.gstin : "") ||
        "—";

      return {
        _id: inv._id,
        billNo: inv.number,
        date: inv.date,
        particulars: companyName,
        gstin,
        subtotal: Number(inv.subtotal) || 0,
        cgstPercent: Number(inv.cgstPercent) || 0,
        cgstAmount: Number(inv.cgstAmount) || 0,
        sgstPercent: Number(inv.sgstPercent) || 0,
        sgstAmount: Number(inv.sgstAmount) || 0,
        grandTotal: Number(inv.grandTotal) || 0,
        type: inv.type,
      };
    });

    const totalSubtotal = rows.reduce((sum, r) => sum + r.subtotal, 0);
    const totalCGST = rows.reduce((sum, r) => sum + r.cgstAmount, 0);
    const totalSGST = rows.reduce((sum, r) => sum + r.sgstAmount, 0);
    const grandTotalSum = rows.reduce((sum, r) => sum + r.grandTotal, 0);

    const monthLabel = MONTH_NAMES[month - 1] || "JUNE";

    let statementTitle = `SALES BILL ${monthLabel} ${year}`;
    if (typeParam === "tax_invoice") {
      statementTitle = `TAX INVOICE SALES BILL ${monthLabel} ${year}`;
    } else if (typeParam === "labour_bill") {
      statementTitle = `LABOUR BILL SALES BILL ${monthLabel} ${year}`;
    }

    return NextResponse.json({
      month,
      year,
      monthLabel,
      type: typeParam || "all",
      title: statementTitle,
      press,
      startDate,
      endDate,
      rows,
      totals: {
        totalSubtotal: Math.round(totalSubtotal * 100) / 100,
        totalCGST: Math.round(totalCGST * 100) / 100,
        totalSGST: Math.round(totalSGST * 100) / 100,
        grandTotalSum: Math.round(grandTotalSum * 100) / 100,
        totalBills: rows.length,
      },
    });
  } catch (error) {
    console.error("Error generating monthly sales report:", error);
    return NextResponse.json(
      { error: "Failed to generate monthly sales report" },
      { status: 500 },
    );
  }
}
