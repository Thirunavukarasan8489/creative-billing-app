import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import PressProfile from "@/lib/models/PressProfile";

const DEFAULT_PROFILE = {
  name: "CREATIVE LINE GRAPHICS",
  tagline: "OFFSET & DIGITAL PRINTING PRESS",
  address: "12, Printing Press Colony, Main Road, Tiruppur - 641601, Tamil Nadu.",
  phone: "+91 98421 00000",
  email: "creativeline.tpr@gmail.com",
  gstin: "33AAAAA0000A1Z5",
  state: "Tamil Nadu",
  stateCode: "33",
  bankName: "Union Bank of India",
  accountNo: "510101001234567",
  ifscCode: "UBIN0551015",
  branchName: "Main Branch, Tiruppur",
  terms: "Labour bill for printing work rendered. Payment due within 15 days of invoice date.",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return new NextResponse("Invoice Not Found", { status: 404 });
    }

    const dbPress = await PressProfile.findOne().lean();
    const press = (dbPress || DEFAULT_PROFILE) as typeof DEFAULT_PROFILE;

    const isTaxInvoice = invoice.type === "tax_invoice";

    const itemsHtml = invoice.items
      .map(
        (item: any, idx: number) => `
        <tr>
          <td style="padding: 8px; text-align: center; border-bottom: 1px solid #E2E8F0; font-family: monospace;">${idx + 1}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E2E8F0; font-weight: 500;">${item.description}</td>
          ${isTaxInvoice ? `<td style="padding: 8px; text-align: center; border-bottom: 1px solid #E2E8F0; font-family: monospace;">${item.hsnSac || "9988"}</td>` : ""}
          <td style="padding: 8px; text-align: right; border-bottom: 1px solid #E2E8F0; font-family: monospace;">${item.quantity}</td>
          <td style="padding: 8px; text-align: right; border-bottom: 1px solid #E2E8F0; font-family: monospace;">${item.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          <td style="padding: 8px; text-align: right; border-bottom: 1px solid #E2E8F0; font-family: monospace; font-weight: bold; color: #0F172A;">${item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        </tr>
      `
      )
      .join("");

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${isTaxInvoice ? "Tax Invoice" : "Labour Bill"} - ${invoice.number}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #FFF; color: #0F172A; margin: 0; padding: 0; font-size: 12px; }
    .bill-card { border: 2px solid ${isTaxInvoice ? "#0F172A" : "#E11D48"}; padding: 24px; box-sizing: border-box; }
    .bill-header { background-color: ${isTaxInvoice ? "#0F172A" : "#E11D48"}; color: #FFFFFF; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
    .bill-title { font-family: Georgia, serif; font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; }
    .letterhead-title { font-family: Georgia, serif; font-size: 22px; font-weight: 900; color: #E11D48; margin: 0; }
    .table-header { background-color: ${isTaxInvoice ? "#0F172A" : "#E11D48"}; color: #FFFFFF; text-transform: uppercase; font-size: 10px; font-weight: bold; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background: #0F172A; color: white; padding: 12px; text-align: center; font-weight: bold;">
    <button onclick="window.print()" style="background: #E11D48; color: white; border: none; padding: 8px 16px; font-weight: bold; border-radius: 6px; cursor: pointer;">Print / Save PDF</button>
  </div>

  <div style="max-w: 800px; margin: 20px auto;" class="bill-card">
    <!-- Header -->
    <div class="bill-header">
      <div>
        <h1 class="bill-title">${isTaxInvoice ? "TAX INVOICE" : "LABOUR BILL"}</h1>
        <p style="margin: 4px 0 0 0; font-family: monospace; font-size: 13px;">BILL NO: ${invoice.number}</p>
      </div>
      <div style="text-align: right;">
        <p style="margin: 0; font-size: 10px; text-transform: uppercase;">Date</p>
        <p style="margin: 4px 0 0 0; font-family: monospace; font-weight: bold; font-size: 14px;">${new Date(invoice.date).toLocaleDateString("en-IN")}</p>
      </div>
    </div>

    <!-- Letterhead -->
    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding: 16px 0;">
      <div>
        <h2 class="letterhead-title">${press.name}</h2>
        <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: bold; color: #0F172A; text-transform: uppercase;">${press.tagline}</p>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #475569;">${press.address}</p>
        <p style="margin: 2px 0 0 0; font-size: 11px; font-family: monospace; color: #475569;">Ph: ${press.phone} | Email: ${press.email}</p>
      </div>
      ${
        isTaxInvoice
          ? `<div style="background-color: #F1F5F9; padding: 10px; border-radius: 6px; text-align: right; border: 1px solid #CBD5E1;">
              <p style="margin: 0; font-size: 10px; font-weight: bold; color: #0F172A;">GSTIN: <span style="font-family: monospace; font-size: 12px; color: #0F172A;">${press.gstin}</span></p>
              <p style="margin: 4px 0 0 0; font-size: 10px; font-weight: bold; color: #0F172A;">State Code: <span style="font-family: monospace; font-size: 12px; color: #0F172A;">${press.stateCode} (${press.state})</span></p>
            </div>`
          : ""
      }
    </div>

    <!-- Party Details -->
    <div style="background: #F8FAFC; padding: 12px; margin: 16px 0; border: 1px solid #E2E8F0; border-radius: 6px;">
      <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748B; display: block; margin-bottom: 4px;">BILLED TO:</span>
      <h3 style="margin: 0; font-size: 15px; font-weight: bold; color: #0F172A;">${invoice.companySnapshot.name}</h3>
      <p style="margin: 4px 0 0 0; font-size: 11px; color: #475569; white-space: pre-line;">${invoice.companySnapshot.address}</p>
      <p style="margin: 4px 0 0 0; font-size: 11px; font-family: monospace; color: #475569;">Ph: ${invoice.companySnapshot.phone}</p>
      ${isTaxInvoice && invoice.companySnapshot.gstin ? `<p style="margin: 4px 0 0 0; font-size: 11px; font-family: monospace; font-weight: bold; color: #E11D48;">Party GSTIN: ${invoice.companySnapshot.gstin}</p>` : ""}
    </div>

    <!-- Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr class="table-header">
          <th style="padding: 8px; text-align: center; width: 40px;">S.No</th>
          <th style="padding: 8px; text-align: left;">Particulars / Job Description</th>
          ${isTaxInvoice ? `<th style="padding: 8px; text-align: center;">HSN/SAC</th>` : ""}
          <th style="padding: 8px; text-align: right;">Qty</th>
          <th style="padding: 8px; text-align: right;">Rate (₹)</th>
          <th style="padding: 8px; text-align: right;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Totals & Words -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
      <div style="width: 50%;">
        <div style="background: #F8FAFC; padding: 10px; border: 1px solid #E2E8F0; border-radius: 6px;">
          <span style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748B;">Amount in Words:</span>
          <p style="font-family: Georgia, serif; font-weight: bold; font-size: 12px; color: #0F172A; margin: 4px 0 0 0;">${invoice.amountInWords}</p>
        </div>
      </div>

      <div style="width: 40%; border: 1px solid #E2E8F0; padding: 12px; border-radius: 6px; background: #FFF;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <span>Subtotal:</span>
          <span style="font-family: monospace; font-weight: bold;">₹${invoice.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
        ${
          isTaxInvoice
            ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #475569;">
            <span>CGST (${invoice.cgstPercent}%):</span>
            <span style="font-family: monospace;">₹${invoice.cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #475569;">
            <span>SGST (${invoice.sgstPercent}%):</span>
            <span style="font-family: monospace;">₹${invoice.sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        `
            : ""
        }
        ${
          invoice.roundOff !== 0
            ? `<div style="display: flex; justify-content: space-between; font-style: italic; color: #64748B;">
                <span>Round Off:</span>
                <span style="font-family: monospace;">₹${invoice.roundOff.toFixed(2)}</span>
              </div>`
            : ""
        }
        <div style="border-top: 2px dashed #CBD5E1; margin-top: 8px; padding-top: 8px; display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; color: #0F172A;">
          <span>GRAND TOTAL:</span>
          <span style="font-family: monospace;">₹${invoice.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="border-top: 2px solid #E2E8F0; padding-top: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
      ${
        isTaxInvoice
          ? `<div style="background-color: #F1F5F9; padding: 10px; border-radius: 6px; width: 50%;">
              <h4 style="margin: 0 0 4px 0; font-size: 11px; font-weight: bold; color: #0F172A; text-transform: uppercase;">Bank Details for Payment:</h4>
              <p style="margin: 0; font-weight: bold;">${press.bankName}</p>
              <p style="margin: 2px 0 0 0; font-family: monospace;">A/C No: ${press.accountNo}</p>
              <p style="margin: 2px 0 0 0; font-family: monospace;">IFSC Code: ${press.ifscCode}</p>
              <p style="margin: 2px 0 0 0;">Branch: ${press.branchName}</p>
            </div>`
          : `<div style="width: 50%; font-size: 11px; color: #64748B;">
              <p>${press.terms}</p>
            </div>`
      }

      <div style="text-align: right;">
        <p style="font-family: Georgia, serif; font-weight: bold; font-size: 12px; color: #0F172A; margin: 0;">For ${press.name}</p>
        <div style="height: 40px;"></div>
        <p style="margin: 0; font-size: 10px; color: #64748B; text-transform: uppercase; font-weight: bold;">Authorized Signatory</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    console.error("Error generating printable PDF route:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}
