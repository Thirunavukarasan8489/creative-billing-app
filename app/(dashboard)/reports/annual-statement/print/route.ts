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
    "No. 2/412, Thirumalai Nagar, Ganapathypalayam, Veerapandi PO, TIRUPUR - 641 605.",
  phone: "8489 902 902, 93442 16902",
  email: "creativetpr@gmail.com",
  gstin: "33DDIPG2441F1Z0",
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
    const autoPrint = searchParams.get("autoPrint") !== "false";

    let startDate: Date;
    let endDate: Date;
    let periodTitle: string;
    let fileTitle: string;

    if (fyParam) {
      const startYear = parseInt(fyParam.split("-")[0], 10) || 2026;
      startDate = new Date(startYear, 3, 1, 0, 0, 0);
      endDate = new Date(startYear + 1, 2, 31, 23, 59, 59, 999);
      periodTitle = `FINANCIAL YEAR ${fyParam} (01/04/${startYear} TO 31/03/${startYear + 1})`;
      fileTitle = `ANNUAL_STATEMENT_AY_${fyParam.replace(/-/g, "_")}`;
    } else if (startDateParam || endDateParam) {
      const now = new Date();
      startDate = startDateParam ? new Date(startDateParam) : new Date(now.getFullYear(), 0, 1);
      endDate = endDateParam ? new Date(endDateParam) : new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      endDate.setHours(23, 59, 59, 999);

      const startStr = startDate.toLocaleDateString("en-GB").replace(/\//g, ".");
      const endStr = endDate.toLocaleDateString("en-GB").replace(/\//g, ".");
      periodTitle = `PERIOD STATEMENT: ${startStr} TO ${endStr}`;
      fileTitle = `STATEMENT_${startStr}_TO_${endStr}`;
    } else {
      const now = new Date();
      const currentYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      startDate = new Date(currentYear, 3, 1, 0, 0, 0);
      endDate = new Date(currentYear + 1, 2, 31, 23, 59, 59, 999);
      periodTitle = `FINANCIAL YEAR ${currentYear}-${currentYear + 1}`;
      fileTitle = `ANNUAL_STATEMENT_AY_${currentYear}_${currentYear + 1}`;
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
        billNo: inv.number,
        date: new Date(inv.date).toLocaleDateString("en-GB").replace(/\//g, "."),
        particulars: companyName,
        gstin,
        subtotal: Number(inv.subtotal) || 0,
        cgstPercent: inv.type === "tax_invoice" ? Number(inv.cgstPercent || 9) : 0,
        cgstAmount: Number(inv.cgstAmount) || 0,
        sgstPercent: inv.type === "tax_invoice" ? Number(inv.sgstPercent || 9) : 0,
        sgstAmount: Number(inv.sgstAmount) || 0,
        grandTotal: Number(inv.grandTotal) || 0,
      };
    });

    const totalSubtotal = rows.reduce((sum, r) => sum + r.subtotal, 0);
    const totalCGST = rows.reduce((sum, r) => sum + r.cgstAmount, 0);
    const totalSGST = rows.reduce((sum, r) => sum + r.sgstAmount, 0);
    const grandTotalSum = rows.reduce((sum, r) => sum + r.grandTotal, 0);

    const reportDateStr = new Date().toLocaleDateString("en-GB").replace(/\//g, " - ");

    const MIN_ROWS = 16;
    const emptyRowsCount = Math.max(0, MIN_ROWS - rows.length);
    const emptyRows = Array.from({ length: emptyRowsCount });

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${fileTitle}</title>
  <style>
    @font-face {
      font-family: 'ParkAvenue';
      src: url('/fonts/PARKANA_.TTF') format('truetype');
    }
    @page {
      size: A4 landscape;
      margin: 6mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
      font-size: 11px;
      color: #000;
      background: #fff;
      padding: 6px;
    }
    .paper-container {
      border: 2px solid #000;
      padding: 6px;
      width: 100%;
      margin: 0 auto;
    }
    .inner-border {
      border: 1px solid #000;
      padding: 8px;
    }
    .header-title {
      font-family: 'ParkAvenue', cursive;
      font-size: 36px;
      color: #E11D48;
      text-align: center;
      line-height: 1.1;
    }
    .sub-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1.5px solid #000;
      border-bottom: 2px solid #000;
      padding: 4px 10px;
      margin-top: 6px;
      margin-bottom: 6px;
      font-weight: bold;
      font-size: 14px;
    }
    .sub-header .title-text {
      color: #BE123C;
      letter-spacing: 0.5px;
    }
    .sub-header .date-text {
      color: #BE123C;
      font-family: monospace;
      font-size: 15px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    th, td {
      border: 1px solid #000;
      padding: 4px 6px;
      font-size: 11px;
      word-wrap: break-word;
    }
    th {
      background-color: #fff;
      font-weight: bold;
      text-transform: uppercase;
      text-align: center;
    }
    .col-bill { width: 7%; text-align: center; font-family: monospace; font-weight: bold; }
    .col-date { width: 9%; text-align: center; font-family: monospace; }
    .col-part { width: 32%; text-align: left; font-weight: 500; }
    .col-gst { width: 17%; text-align: center; font-family: monospace; font-size: 10px; }
    .col-num { width: 8.5%; text-align: right; font-family: monospace; }
    .col-rate { width: 3.5%; text-align: center; font-family: monospace; }

    .summary-row td {
      font-weight: bold;
      font-size: 12px;
    }
    .summary-label {
      text-align: right;
      color: #BE123C;
      padding-right: 8px;
    }
    .summary-val {
      text-align: right;
      color: #BE123C;
      font-family: monospace;
      font-weight: bold;
    }

    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
  ${
    autoPrint
      ? `<script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 400);
    });
  </script>`
      : ""
  }
</head>
<body>
  <div class="no-print" style="margin-bottom: 12px; display: flex; justify-content: flex-end; gap: 8px;">
    <button onclick="window.print()" style="padding: 8px 18px; background-color: #E11D48; color: #fff; border: none; border-radius: 6px; font-weight: bold; font-size: 12px; cursor: pointer; display: flex; items-center: center; gap: 6px;">
      📄 Save / Download PDF (Landscape)
    </button>
  </div>

  <div class="paper-container">
    <div class="inner-border">
      <div class="header-title">Creative Line Graphics</div>
      
      <div class="sub-header">
        <div style="flex: 1;"></div>
        <div class="title-text" style="flex: 3; text-align: center;">SALES STATEMENT — ${periodTitle}</div>
        <div class="date-text" style="flex: 1; text-align: right;">${reportDateStr}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="col-bill">BILL No.</th>
            <th class="col-date">Date</th>
            <th class="col-part">Particulars</th>
            <th class="col-gst">GST NO.</th>
            <th class="col-num">TOTAL</th>
            <th class="col-rate">%</th>
            <th class="col-num">CGST</th>
            <th class="col-rate">%</th>
            <th class="col-num">SGST</th>
            <th class="col-num">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) => `
          <tr>
            <td class="col-bill">${r.billNo}</td>
            <td class="col-date">${r.date}</td>
            <td class="col-part">${r.particulars}</td>
            <td class="col-gst">${r.gstin}</td>
            <td class="col-num">${r.subtotal > 0 ? r.subtotal.toFixed(2) : ""}</td>
            <td class="col-rate">${r.cgstPercent > 0 ? r.cgstPercent : ""}</td>
            <td class="col-num">${r.cgstAmount > 0 ? r.cgstAmount.toFixed(2) : ""}</td>
            <td class="col-rate">${r.sgstPercent > 0 ? r.sgstPercent : ""}</td>
            <td class="col-num">${r.sgstAmount > 0 ? r.sgstAmount.toFixed(2) : ""}</td>
            <td class="col-num" style="font-weight: bold;">${r.grandTotal.toFixed(2)}</td>
          </tr>
          `
            )
            .join("")}

          ${emptyRows
            .map(
              () => `
          <tr style="height: 24px;">
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          `
            )
            .join("")}

          <tr class="summary-row">
            <td colspan="4" class="summary-label">TOTAL (${rows.length} BILLS)</td>
            <td class="summary-val">${totalSubtotal.toFixed(2)}</td>
            <td></td>
            <td class="summary-val">${totalCGST.toFixed(2)}</td>
            <td></td>
            <td class="summary-val">${totalSGST.toFixed(2)}</td>
            <td class="summary-val" style="font-size: 13px; font-weight: 800;">${grandTotalSum.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error rendering printable annual statement:", error);
    return NextResponse.json(
      { error: "Failed to generate printable annual statement" },
      { status: 500 }
    );
  }
}
