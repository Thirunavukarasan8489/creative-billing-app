import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import PressProfile from "@/lib/models/PressProfile";

const DEFAULT_PRESS = {
  name: "Creative Line Graphics",
  tagline: "OFFSET & DIGITAL PRINTING PRESS",
  address: "No. 2/412, Thirumalai Nagar, Ganapathypalayam, Veerapandi PO, TIRUPUR - 641 605.",
  phone: "8489 902 902, 93442 16902",
  email: "creativetpr@gmail.com",
  gstin: "33DDIPG2441F1Z0",
  state: "Tamil Nadu",
  stateCode: "33",
  bankName: "FEDERAL BANK, TIRUPUR",
  accountNo: "13590200065469",
  ifscCode: "FDRL0001359",
  branchName: "Main Branch, Tiruppur",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const invoice = await Invoice.findById(id).lean();

    if (!invoice) {
      return new NextResponse("Invoice Not Found", { status: 404 });
    }

    const dbPress = await PressProfile.findOne().lean();
    const press = (dbPress || DEFAULT_PRESS) as any;

    const isTaxInvoice = invoice.type === "tax_invoice";

    const itemsHtml = invoice.items
      .map((item: any, idx: number) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #E2E8F0; text-align: center;">${idx + 1}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E2E8F0; font-weight: 500;">${item.description}</td>
          ${isTaxInvoice ? `<td style="padding: 8px; border-bottom: 1px solid #E2E8F0; font-family: monospace; text-align: center;">${item.hsnSac || "9988"}</td>` : ""}
          <td style="padding: 8px; text-align: center; border-bottom: 1px solid #E2E8F0; font-family: monospace;">${item.quantity}</td>
          <td style="padding: 8px; text-align: right; border-bottom: 1px solid #E2E8F0; font-family: monospace;">${item.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          <td style="padding: 8px; text-align: right; border-bottom: 1px solid #E2E8F0; font-family: monospace; font-weight: bold; color: #0F172A;">${item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        </tr>
      `)
      .join("");

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${isTaxInvoice ? "Tax Invoice" : "Labour Bill"} - ${invoice.number}</title>
  <style>
    @font-face {
      font-family: 'ParkAvenue';
      src: url('/fonts/PARKANA_.TTF') format('truetype');
    }
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #FFF; color: #0F172A; margin: 0; padding: 0; font-size: 12px; }
    .bill-card { border: 2px solid ${isTaxInvoice ? "#0F172A" : "#E11D48"}; padding: 24px; box-sizing: border-box; }
    .bill-header { background-color: ${isTaxInvoice ? "#0F172A" : "#E11D48"}; color: #FFFFFF; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; }
    .bill-title { font-family: Georgia, serif; font-size: 24px; font-weight: bold; margin: 0; text-transform: uppercase; }
    .letterhead-title { font-family: 'ParkAvenue', 'Brush Script MT', cursive, Georgia, serif; font-size: 38px; font-weight: normal; color: #E11D48; margin: 0; line-height: 1.1; }
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
        <h2 class="letterhead-title">Creative Line Graphics</h2>
        <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: bold; color: #0F172A; text-transform: uppercase;">${press.tagline || DEFAULT_PRESS.tagline}</p>
        <p style="margin: 4px 0 0 0; font-size: 11px; color: #475569;">${press.address || DEFAULT_PRESS.address}</p>
        <p style="margin: 2px 0 0 0; font-size: 11px; color: #475569;">Phone: ${press.phone || DEFAULT_PRESS.phone} | Email: ${press.email || DEFAULT_PRESS.email}</p>
      </div>
      <div style="text-align: right;">
        ${isTaxInvoice ? `<p style="font-family: monospace; font-weight: bold; color: #0F172A; font-size: 13px; margin: 0;">GSTIN: ${press.gstin || DEFAULT_PRESS.gstin}</p>` : ""}
        <p style="font-size: 11px; color: #64748B; margin: 4px 0 0 0;">State: ${press.state || DEFAULT_PRESS.state} (${press.stateCode || DEFAULT_PRESS.stateCode})</p>
      </div>
    </div>

    <!-- Client Info -->
    <div style="padding: 16px 0; border-bottom: 1px solid #E2E8F0;">
      <p style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748B; margin: 0;">Billed To</p>
      <h3 style="font-size: 16px; font-weight: bold; color: #0F172A; margin: 4px 0;">${invoice.companySnapshot.name}</h3>
      <p style="margin: 2px 0; color: #475569; white-space: pre-line;">${invoice.companySnapshot.address}</p>
      <p style="margin: 2px 0; color: #475569;">Phone: ${invoice.companySnapshot.phone}</p>
      ${invoice.companySnapshot.gstin ? `<p style="font-family: monospace; font-weight: bold; color: #0F172A; margin: 4px 0 0 0;">GSTIN: ${invoice.companySnapshot.gstin}</p>` : ""}
    </div>

    <!-- Items Table -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
      <thead>
        <tr class="table-header">
          <th style="padding: 8px; text-align: center; width: 40px;">#</th>
          <th style="padding: 8px; text-align: left;">Particulars / Description</th>
          ${isTaxInvoice ? `<th style="padding: 8px; text-align: center; width: 80px;">HSN/SAC</th>` : ""}
          <th style="padding: 8px; text-align: center; width: 60px;">Qty</th>
          <th style="padding: 8px; text-align: right; width: 90px;">Rate (₹)</th>
          <th style="padding: 8px; text-align: right; width: 100px;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Math Calculations -->
    <div style="display: flex; justify-content: space-between; margin-top: 16px; padding-top: 16px; border-top: 2px solid #0F172A;">
      <div style="width: 55%;">
        ${isTaxInvoice ? `
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 12px; border-radius: 6px;">
            <p style="font-[10px] font-bold text-transform: uppercase; color: #64748B; margin: 0 0 4px 0;">Bank Account Details</p>
            <p style="margin: 2px 0; font-weight: bold; color: #0F172A;">Bank: ${press.bankName || DEFAULT_PRESS.bankName}</p>
            <p style="margin: 2px 0; font-family: monospace; font-weight: bold; color: #0F172A;">A/C No: ${press.accountNo || DEFAULT_PRESS.accountNo}</p>
            <p style="margin: 2px 0; font-family: monospace; font-weight: bold; color: #0F172A;">IFSC: ${press.ifscCode || DEFAULT_PRESS.ifscCode}</p>
          </div>
        ` : ""}
        <div style="margin-top: 12px;">
          <p style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748B; margin: 0;">Amount in Words</p>
          <p style="font-family: Georgia, serif; font-weight: bold; color: #0F172A; margin: 2px 0;">Rupees ${invoice.amountInWords} Only</p>
        </div>
      </div>

      <div style="width: 40%;">
        <div style="display: flex; justify-content: space-between; padding: 4px 0;">
          <span>Subtotal:</span>
          <span style="font-family: monospace; font-weight: bold;">₹${invoice.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
        ${isTaxInvoice ? `
          <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #475569;">
            <span>CGST (${invoice.cgstPercent}%):</span>
            <span style="font-family: monospace;">₹${invoice.cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #475569;">
            <span>SGST (${invoice.sgstPercent}%):</span>
            <span style="font-family: monospace;">₹${invoice.sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
          ${invoice.roundOff !== 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #64748B;">
              <span>Round Off:</span>
              <span style="font-family: monospace;">₹${invoice.roundOff.toFixed(2)}</span>
            </div>
          ` : ""}
        ` : ""}
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #0F172A; font-size: 16px; font-weight: bold; color: ${isTaxInvoice ? "#0F172A" : "#E11D48"};">
          <span>Grand Total:</span>
          <span style="font-family: monospace;">₹${invoice.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>

    <!-- Footer Signature -->
    <div style="margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end;">
      <div>
        <p style="font-size: 10px; color: #64748B; margin: 0;">Terms: Subject to Tiruppur Jurisdiction.</p>
      </div>
      <div style="text-align: right;">
        <p style="font-family: Georgia, serif; font-weight: bold; margin: 0;">For Creative Line Graphics</p>
        <div style="height: 40px;"></div>
        <p style="font-size: 10px; text-transform: uppercase; font-weight: bold; color: #64748B; margin: 0;">Authorized Signatory</p>
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
    console.error("Error generating printable invoice route:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}
