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
    "No. 2/412, Thirumalai Nagar, Ganapathypalayam, Veerapandi PO, TIRUPUR - 641 605.",
  phone: "8489 902 902, 93442 16902",
  email: "creativetpr@gmail.com",
  gstin: "33DDIPG2441F1Z0",
  state: "Tamil Nadu",
  stateCode: "33",
  bankName: "FEDERAL BANK, TIRUPUR",
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
      return new NextResponse("Company Not Found", { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const typeParam = searchParams.get("type");

    const now = new Date();
    const currentYear = now.getFullYear();
    const defaultStart = new Date(currentYear, 3, 1); // 1st April
    const defaultEnd = new Date(currentYear + 1, 2, 31, 23, 59, 59); // 31st March next year

    const startDate = startDateParam ? new Date(startDateParam) : defaultStart;
    const endDate = endDateParam ? new Date(endDateParam) : defaultEnd;
    endDate.setHours(23, 59, 59, 999);

    const dbPress = await PressProfile.findOne().lean();
    const press = (dbPress || DEFAULT_PRESS) as typeof DEFAULT_PRESS;

    const invoiceQuery: any = {
      companyId: id,
      date: { $gte: startDate, $lte: endDate },
      status: { $ne: "cancelled" },
    };

    if (typeParam && (typeParam === "tax_invoice" || typeParam === "labour_bill")) {
      invoiceQuery.type = typeParam;
    }

    // Fetch invoices & payments
    const invoices = await Invoice.find(invoiceQuery)
      .sort({ date: 1, createdAt: 1 })
      .lean();

    const invoiceIds = invoices.map((i) => i._id);
    const payments = await Payment.find({
      invoiceId: { $in: invoiceIds },
      date: { $gte: startDate, $lte: endDate },
    })
      .sort({ date: 1, createdAt: 1 })
      .lean();

    const statementRows: any[] = [];

    invoices.forEach((inv) => {
      const itemsDescription = inv.items
        .map((i: any) => i.description)
        .join(" / ");
      statementRows.push({
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

    payments.forEach((pmt) => {
      const parentInvoice = invoices.find(
        (i) => i._id.toString() === pmt.invoiceId.toString(),
      );
      const modeLabel = pmt.mode ? pmt.mode.toUpperCase() : "PAYMENT";
      const refText = pmt.referenceNo ? ` ${pmt.referenceNo}` : "";

      statementRows.push({
        date: pmt.date,
        billNo: "",
        particulars: `${modeLabel}${refText}`,
        subtotal: 0,
        cgstPercent: 0,
        cgstAmount: 0,
        sgstPercent: 0,
        sgstAmount: 0,
        totalAmount: 0,
        paymentReceived: pmt.amountPaid,
      });
    });

    statementRows.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const totalBilled = statementRows.reduce(
      (sum, r) => sum + r.totalAmount,
      0,
    );
    const totalReceived = statementRows.reduce(
      (sum, r) => sum + r.paymentReceived,
      0,
    );
    const balance = Math.round((totalBilled - totalReceived) * 100) / 100;

    const formatDateStr = (d: Date) => {
      const dateObj = new Date(d);
      const dd = String(dateObj.getDate()).padStart(2, "0");
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
      const yyyy = dateObj.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    };

    const tableRowsHtml = statementRows
      .map((r) => {
        const dateFormatted = formatDateStr(r.date);
        const subtotalStr = r.subtotal > 0 ? r.subtotal.toFixed(2) : "";
        const cgstPctStr = r.cgstPercent > 0 ? r.cgstPercent : "";
        const cgstAmtStr = r.cgstAmount > 0 ? r.cgstAmount.toFixed(2) : "";
        const sgstPctStr = r.sgstPercent > 0 ? r.sgstPercent : "";
        const sgstAmtStr = r.sgstAmount > 0 ? r.sgstAmount.toFixed(2) : "";
        const totalAmtStr = r.totalAmount > 0 ? r.totalAmount.toFixed(2) : "";
        const pmtRecStr =
          r.paymentReceived > 0 ? r.paymentReceived.toFixed(2) : "";

        return `
        <tr>
          <td style="border: 1px solid #000; padding: 5px; text-align: center;">${dateFormatted}</td>
          <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">${r.billNo}</td>
          <td style="border: 1px solid #000; padding: 5px; text-transform: uppercase;">${r.particulars}</td>
          <td style="border: 1px solid #000; padding: 5px; text-align: right; font-family: monospace;">${subtotalStr}</td>
          <td style="border: 1px solid #000; padding: 5px; text-align: center;">${cgstPctStr}</td>
          <td style="border: 1px solid #000; padding: 5px; text-align: right; font-family: monospace;">${cgstAmtStr}</td>
          <td style="border: 1px solid #000; padding: 5px; text-align: center;">${sgstPctStr}</td>
          <td style="border: 1px solid #000; padding: 5px; text-align: right; font-family: monospace;">${sgstAmtStr}</td>
          <td style="border: 1px solid #000; padding: 5px; text-align: right; font-family: monospace; font-weight: bold;">${totalAmtStr}</td>
          <td style="border: 1px solid #000; padding: 5px; text-align: right; font-family: monospace; font-weight: bold; color: #15803D;">${pmtRecStr}</td>
        </tr>
      `;
      })
      .join("");

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Account Statement - ${company.name}</title>
  <style>
    @font-face {
      font-family: 'ParkAvenue';
      src: url('/fonts/PARKANA_.TTF') format('truetype');
    }
    @page { size: A4 landscape; margin: 10mm; }
    body { font-family: Arial, sans-serif; color: #000; background: #FFF; margin: 0; padding: 10px; font-size: 11px; }
    .header-banner { text-align: center; margin-bottom: 10px; }
    .press-title { font-family: 'ParkAvenue', 'Brush Script MT', cursive, Georgia, serif; font-size: 40px; color: #E11D48; margin: 0; font-weight: normal; line-height: 1.1; }
    .press-details { font-size: 11px; color: #1E3A8A; font-weight: bold; margin: 3px 0; }
    .press-gst { font-size: 13px; font-weight: bold; color: #B91C1C; margin-top: 3px; font-family: monospace; }
    .statement-table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 2px solid #000; }
    .statement-table thead { display: table-header-group; }
    .statement-table tr { break-inside: avoid; page-break-inside: avoid; }
    .statement-table th { border: 1px solid #000; padding: 6px 4px; font-size: 10px; font-weight: bold; text-align: center; background: #FFF; text-transform: uppercase; }
    .bank-box { border: 1px solid #94A3B8; padding: 15px; margin-top: 25px; border-radius: 4px; width: 80%; margin-left: auto; margin-right: auto; text-align: left; break-inside: avoid; page-break-inside: avoid; }
    @media print {
      .no-print { display: none; }
      .bank-box { break-inside: avoid; page-break-inside: avoid; }
      tr { break-inside: avoid; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background: #0F172A; color: white; padding: 12px; text-align: center; font-weight: bold; margin-bottom: 15px;">
    <button onclick="window.print()" style="background: #E11D48; color: white; border: none; padding: 8px 18px; font-weight: bold; border-radius: 6px; cursor: pointer;">Print Account Statement</button>
  </div>

  <!-- Header Banner -->
  <div class="header-banner">
    <h1 class="press-title">Creative Line Graphics</h1>
    <p class="press-details">${press.address}</p>
    <p class="press-details">Cell : ${press.phone}</p>
    <p class="press-gst">GSTIN : ${press.gstin}</p>
    <hr style="border: 1px solid #000; margin-top: 8px;" />
  </div>

  <div style="display:flex; justify-content: space-between;">
  <div style="text-align: left; font-weight: bold; margin-bottom: 8px; font-size: 12px;">
    ${company.name.toUpperCase()}
  </div>
  <div style="text-align: center; font-weight: bold; margin-bottom: 8px; font-size: 12px;">
    GSTIN : ${company.gstin || "N/A"}
  </div>
  <div style="text-align: right; font-weight: bold; margin-bottom: 8px; font-size: 12px;">
    Date : ${formatDateStr(new Date())}
  </div>
  </div>

  <!-- Account Statement Table -->
  <table class="statement-table">
    <thead>
      <tr>
        <th colSpan="10" style="text-align: center;">${typeParam === "tax_invoice" ? "TAX INVOICE ACCOUNT STATEMENT" : typeParam === "labour_bill" ? "LABOUR BILL ACCOUNT STATEMENT" : "ACCOUNT STATEMENT"} - ${formatDateStr(startDate)} TO ${formatDateStr(endDate)}</th>
      </tr>
      <tr>
        <th style="width: 10%;">Date</th>
        <th style="width: 8%;">BILL No.</th>
        <th style="width: 32%;">Particulars</th>
        <th style="width: 10%;">TOTAL</th>
        <th style="width: 4%;">%</th>
        <th style="width: 8%;">CGST</th>
        <th style="width: 4%;">%</th>
        <th style="width: 8%;">SGST</th>
        <th style="width: 11%;">TOTAL AMOUNT</th>
        <th style="width: 13%;">Payment Received Details</th>
      </tr>
    </thead>
    <tbody>
      ${tableRowsHtml}
      <!-- Totals Row -->
      <tr style="font-weight: bold; background: #F8FAFC;">
        <td colSpan="3" style="border: 1px solid #000; padding: 6px; text-align: right; color: #B91C1C; font-size: 12px;">TOTAL</td>
        <td colSpan="5" style="border: 1px solid #000;"></td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right; font-family: monospace; font-size: 12px; color: #B91C1C;">${totalBilled.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: right; font-family: monospace; font-size: 12px; color: #B91C1C;">${totalReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      </tr>
      <!-- Balance Row -->
      <tr style="font-weight: bold; background: #FFF;">
        <td colSpan="3" style="border: 1px solid #000; padding: 6px; text-align: right; color: #B91C1C; font-size: 12px;">BALANCE</td>
        <td colSpan="5" style="border: 1px solid #000;"></td>
        <td colSpan="2" style="border: 1px solid #000; padding: 6px; text-align: right; font-family: monospace; font-size: 13px; color: #B91C1C;">₹${balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
      </tr>
    </tbody>
  </table>

  <!-- Bank Account Details Box (Bottom) -->
  <div class="bank-box">
  <h2 style="text-align: center; margin: 0 0 10px 0; font-size: 20px; font-weight: bold; color: #0F172A;">${press.name}</h2>
  <table style="margin: auto;">
  <tbody>
  <tr style="margin: 4px 0; font-size: 12px; font-weight: bold;">
  <th>NAME OF BANK :</th>
  <td>${press.bankName}</td>
  </tr>
  <tr style="margin: 4px 0; font-size: 12px; font-weight: bold;">
  <th>NATURE OF ACCOUNT :</th>
  <td>CURRENT ACCOUNT</td>
  </tr>
  <tr style="margin: 4px 0; font-size: 12px; font-weight: bold;">
  <th>ACCOUNT NO. :</th>
  <td>${press.accountNo}</td>
  </tr>
  <tr style="margin: 4px 0; font-size: 12px; font-weight: bold;">
  <th>IFSC :</th>
  <td>${press.ifscCode}</td>
  </tr>
  </tbody>
  </table>
  </div>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Error generating printable statement route:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}
