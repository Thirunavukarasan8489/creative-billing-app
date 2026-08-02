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

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    if (!mongoose.models.Company) {
      mongoose.model("Company", Company.schema);
    }

    const { searchParams } = new URL(req.url);
    const fyParam = searchParams.get("fy"); // e.g. "2026-2027"
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let startDate: Date;
    let endDate: Date;
    let periodLabel: string;

    if (fyParam) {
      const startYear = parseInt(fyParam.split("-")[0], 10) || 2026;
      startDate = new Date(startYear, 3, 1, 0, 0, 0); // 1st April
      endDate = new Date(startYear + 1, 2, 31, 23, 59, 59, 999); // 31st March next year
      periodLabel = `ASSESSMENT YEAR ${fyParam} (01/04/${startYear} TO 31/03/${startYear + 1})`;
    } else if (startDateParam || endDateParam) {
      const now = new Date();
      startDate = startDateParam ? new Date(startDateParam) : new Date(now.getFullYear(), 0, 1);
      endDate = endDateParam ? new Date(endDateParam) : new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      endDate.setHours(23, 59, 59, 999);

      const startStr = startDate.toLocaleDateString("en-GB").replace(/\//g, ".");
      const endStr = endDate.toLocaleDateString("en-GB").replace(/\//g, ".");
      periodLabel = `STATEMENT PERIOD: ${startStr} TO ${endStr}`;
    } else {
      // Default to current financial year
      const now = new Date();
      const currentYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      startDate = new Date(currentYear, 3, 1, 0, 0, 0);
      endDate = new Date(currentYear + 1, 2, 31, 23, 59, 59, 999);
      periodLabel = `ASSESSMENT YEAR ${currentYear}-${currentYear + 1}`;
    }

    let press = await PressProfile.findOne().lean();
    if (!press) press = DEFAULT_PRESS as any;

    const invoices = await Invoice.find({
      date: { $gte: startDate, $lte: endDate },
      status: { $ne: "cancelled" },
    })
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
        cgstPercent: inv.type === "tax_invoice" ? Number(inv.cgstPercent || 9) : 0,
        cgstAmount: Number(inv.cgstAmount) || 0,
        sgstPercent: inv.type === "tax_invoice" ? Number(inv.sgstPercent || 9) : 0,
        sgstAmount: Number(inv.sgstAmount) || 0,
        grandTotal: Number(inv.grandTotal) || 0,
        type: inv.type,
      };
    });

    const totalSubtotal = rows.reduce((sum, r) => sum + r.subtotal, 0);
    const totalCGST = rows.reduce((sum, r) => sum + r.cgstAmount, 0);
    const totalSGST = rows.reduce((sum, r) => sum + r.sgstAmount, 0);
    const grandTotalSum = rows.reduce((sum, r) => sum + r.grandTotal, 0);

    return NextResponse.json({
      periodLabel,
      fyParam,
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
    console.error("Error generating annual statement report:", error);
    return NextResponse.json(
      { error: "Failed to generate annual statement report" },
      { status: 500 }
    );
  }
}
