import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import PressProfile from "@/lib/models/PressProfile";

const DEFAULT_PRESS = {
  name: "Creative Line Graphics",
  tagline: "OFFSET PRINTING PRESS",
  address:
    "No. 2/412, Thirumalai Nagar, Ganapathypalayam,\n Veerapandi (PO), Palladam (T.K), Tiruppur - 641 605",
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

    const invoice = await Invoice.findById(id).lean();

    if (!invoice) {
      return new NextResponse("Invoice Not Found", { status: 404 });
    }

    const dbPress = await PressProfile.findOne().lean();
    const press = (dbPress || DEFAULT_PRESS) as any;

    const isTaxInvoice = invoice.type === "tax_invoice";

    const itemsHtml = invoice.items
      .map(
        (item: any, idx: number) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #000; text-align: center;">${idx + 1}</td>
          <td style="padding: 8px; border: 1px solid #000; font-weight: 500;">${item.description}</td>
          ${isTaxInvoice ? `<td style="padding: 8px; border: 1px solid #000; font-family: monospace; text-align: center;">${item.hsnSac || "9988"}</td>` : ""}
          <td style="padding: 8px; border: 1px solid #000; text-align: center; font-family: monospace;">${item.quantity}</td>
          <td style="padding: 8px; border: 1px solid #000; text-align: right; font-family: monospace;">${item.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          <td style="padding: 8px; border: 1px solid #000; text-align: right; font-family: monospace; font-weight: bold; color: #000;">${item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        </tr>
      `,
      )
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
    @page { size: A4; margin: 12mm; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #FFF; color: #0F172A; margin: 0; padding: 0; font-size: 12px; }
    .bill-card { border: 2px solid #000; padding: 20px; box-sizing: border-box; }
    .letterhead-title { font-family: 'ParkAvenue', 'Brush Script MT', cursive, Georgia, serif; font-size: 38px; font-weight: normal; color: #E11D48; margin: 0; line-height: 1.1; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background: #0F172A; color: white; padding: 12px; text-align: center; font-weight: bold;">
    <button onclick="window.print()" style="background: #E11D48; color: white; border: none; padding: 8px 18px; font-weight: bold; border-radius: 6px; cursor: pointer;">Print / Save PDF</button>
  </div>

  <div style="max-width: 800px; margin: 20px auto;" class="bill-card">
    <!-- Header: Centered Title, Right-Aligned Bill Details -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 12px;">
      <div style="flex: 1;"></div>
      <div style="flex: 2; text-align: center;">
        <h1 style="font-family: Georgia, serif; font-size: 18px; font-weight: bold; margin: 0; text-transform: uppercase; letter-spacing: 1px; color: #000;">
          ${isTaxInvoice ? "TAX INVOICE" : "LABOUR BILL"}
        </h1>
      </div>
      <div style="flex: 1;"></div>
    </div>

    <!-- Letterhead -->
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #000; padding-bottom: 10px; margin-bottom: 12px;">
    <div>
      <h2 class="letterhead-title">Creative Line Graphics</h2>
      <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: bold; color: #0F172A; text-transform: uppercase;">${press.tagline || DEFAULT_PRESS.tagline}</p>
      <p style="margin: 4px 0 0 0; font-size: 11px; color: #334155; white-space: pre-line;">${press.address || DEFAULT_PRESS.address}</p>
      <p style="margin: 2px 0 0 0; font-size: 11px; color: #334155;">Phone: ${press.phone || DEFAULT_PRESS.phone} | Email: ${press.email || DEFAULT_PRESS.email}</p>
      ${isTaxInvoice ? `<p style="margin: 2px 0 0 0; font-size: 11px; font-weight: bold; color: #0F172A; font-family: monospace;">GSTIN: ${press.gstin || DEFAULT_PRESS.gstin}</p>` : ""}
      ${isTaxInvoice ? `<p style="margin: 2px 0 0 0; font-size: 11px; font-weight: bold; color: #0F172A; font-family: monospace;">State: ${press.state || DEFAULT_PRESS.state} (${press.stateCode || DEFAULT_PRESS.stateCode})</p>` : ""}
      </div>
      <div>
        <table style="border-collapse: collapse; border: 1px solid #000; font-family: monospace; font-size: 11px; font-weight: bold; margin-left: auto;">
          <tbody>
            <tr>
              <th style="border: 1px solid #000; padding: 3px 8px; text-align: left; background: #fff; width: 85px;">BILL NO</th>
              <td style="border: 1px solid #000; padding: 3px 8px; text-align: left;">${invoice.number}</td>
            </tr>
            <tr>
              <th style="border: 1px solid #000; padding: 3px 8px; text-align: left; background: #fff;">DATE</th>
              <td style="border: 1px solid #000; padding: 3px 8px; text-align: left;">${new Date(invoice.date).toLocaleDateString("en-GB").replace(/\//g, ".")}</td>
            </tr>
            ${
              invoice.quoteNumber
                ? `
            <tr>
              <th style="border: 1px solid #000; padding: 3px 8px; text-align: left; background: #fff;">QUOTE NO</th>
              <td style="border: 1px solid #000; padding: 3px 8px; text-align: left;">${invoice.quoteNumber}</td>
            </tr>`
                : ""
            }
            ${
              invoice.quoteDate
                ? `
            <tr>
              <th style="border: 1px solid #000; padding: 3px 8px; text-align: left; background: #fff;">QUOTE DATE</th>
              <td style="border: 1px solid #000; padding: 3px 8px; text-align: left;">${new Date(invoice.quoteDate).toLocaleDateString("en-GB").replace(/\//g, ".")}</td>
            </tr>`
                : ""
            }
            ${
              invoice.poNumber
                ? `
            <tr>
              <th style="border: 1px solid #000; padding: 3px 8px; text-align: left; background: #fff;">P.O. NO</th>
              <td style="border: 1px solid #000; padding: 3px 8px; text-align: left;">${invoice.poNumber}</td>
            </tr>`
                : ""
            }
            ${
              invoice.poDate
                ? `
            <tr>
              <th style="border: 1px solid #000; padding: 3px 8px; text-align: left; background: #fff;">P.O. DATE</th>
              <td style="border: 1px solid #000; padding: 3px 8px; text-align: left;">${new Date(invoice.poDate).toLocaleDateString("en-GB").replace(/\//g, ".")}</td>
            </tr>`
                : ""
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Client Info (Optimized without empty whitespace) -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 12px; border: 1px solid #000; margin-bottom: 14px; background: #fff;">
      <div>
        <p style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #475569; margin: 0;">Billed To</p>
        <h3 style="font-size: 15px; font-weight: bold; color: #0F172A; margin: 2px 0;">${invoice.companySnapshot.name}</h3>
        <p style="margin: 2px 0; color: #334155; white-space: pre-line;">${invoice.companySnapshot.address}</p>
        <p style="margin: 2px 0; color: #334155;">Phone: ${invoice.companySnapshot.phone}</p>
        ${
          invoice.companySnapshot.gstin
            ? `
          <p style="margin: 2px 0 0 0; font-size: 12px; font-weight: bold; color: #0F172A; font-family: monospace;">Party GSTIN: ${invoice.companySnapshot.gstin}</p>
        <p style="margin: 2px 0 0 0; font-size: 12px; font-weight: bold; color: #0F172A; font-family: monospace;">State: ${invoice.companySnapshot.state || "Tamil Nadu"} (${invoice.companySnapshot.stateCode || "33"})</p>`
            : `
            <div style="text-align: right; font-family: monospace; font-size: 11px; color: #475569;">
          <p style="margin: 0;">State: ${invoice.companySnapshot.state || "Tamil Nadu"} (${invoice.companySnapshot.stateCode || "33"})</p>
        </div>`
        }
        
      </div>
    </div>

    <!-- Items Table with Black Borders -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
      <thead>
        <tr style="border: 1px solid #000; background: #fff; color: #000; text-transform: uppercase; font-size: 10px; font-weight: bold;">
          <th style="padding: 8px; border: 1px solid #000; text-align: center; width: 40px;">S.No</th>
          <th style="padding: 8px; border: 1px solid #000; text-align: left;">Particulars / Description</th>
          ${isTaxInvoice ? `<th style="padding: 8px; border: 1px solid #000; text-align: center; width: 80px;">HSN/SAC</th>` : ""}
          <th style="padding: 8px; border: 1px solid #000; text-align: center; width: 60px;">Qty</th>
          <th style="padding: 8px; border: 1px solid #000; text-align: right; width: 90px;">Rate (₹)</th>
          <th style="padding: 8px; border: 1px solid #000; text-align: right; width: 100px;">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Math Calculations -->
    <div style="display: flex; justify-content: space-between; margin-top: 16px; padding-top: 12px; border-top: 2px solid #000;">
      <div style="width: 55%;">
        ${
          isTaxInvoice
            ? `
          <div style="margin-bottom: 10px;">
            <p style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #000; margin: 0 0 4px 0;">BANK ACCOUNT DETAILS:</p>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 11px;">
              <tbody>
                <tr>
                  <th style="border: 1px solid #000; padding: 4px 8px; text-align: left; font-weight: bold; width: 110px; background: #fff;">Bank Name:</th>
                  <td style="border: 1px solid #000; padding: 4px 8px; font-weight: 500;">${press.bankName || DEFAULT_PRESS.bankName}</td>
                </tr>
                <tr>
                  <th style="border: 1px solid #000; padding: 4px 8px; text-align: left; font-weight: bold; background: #fff;">Account No:</th>
                  <td style="border: 1px solid #000; padding: 4px 8px; font-family: monospace; font-weight: bold;">${press.accountNo || DEFAULT_PRESS.accountNo}</td>
                </tr>
                <tr>
                  <th style="border: 1px solid #000; padding: 4px 8px; text-align: left; font-weight: bold; background: #fff;">IFSC Code:</th>
                  <td style="border: 1px solid #000; padding: 4px 8px; font-family: monospace; font-weight: bold;">${press.ifscCode || DEFAULT_PRESS.ifscCode}</td>
                </tr>
                <tr>
                  <th style="border: 1px solid #000; padding: 4px 8px; text-align: left; font-weight: bold; background: #fff;">Branch:</th>
                  <td style="border: 1px solid #000; padding: 4px 8px; font-weight: 500;">${press.branchName || DEFAULT_PRESS.branchName}</td>
                </tr>
              </tbody>
            </table>
          </div>
        `
            : ""
        }
        <div style="margin-top: 12px;">
          <p style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #475569; margin: 0;">Amount in Words</p>
          <p style="font-family: Georgia, serif; font-weight: bold; color: #0F172A; margin: 2px 0;">${invoice.amountInWords}</p>
        </div>
      </div>

      <div style="width: 40%;">
        <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #E2E8F0;">
          <span>Subtotal:</span>
          <span style="font-family: monospace; font-weight: bold;">₹${invoice.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
        ${
          isTaxInvoice
            ? `
          <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #475569;">
            <span>CGST (${invoice.cgstPercent}%):</span>
            <span style="font-family: monospace;">₹${invoice.cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #475569;">
            <span>SGST (${invoice.sgstPercent}%):</span>
            <span style="font-family: monospace;">₹${invoice.sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        `
            : ""
        }
        ${
          invoice.roundOff !== 0
            ? `
          <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #64748B;">
            <span>Round Off:</span>
            <span style="font-family: monospace;">${invoice.roundOff > 0 ? "+" : ""}${invoice.roundOff.toFixed(2)}</span>
          </div>
        `
            : ""
        }
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #000; border-bottom: 2px solid #000; margin-top: 6px; font-weight: bold; font-size: 15px;">
          <span>Grand Total:</span>
          <span style="font-family: monospace; color: #0F172A;">₹${invoice.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>

    <!-- Sign-off & Footer -->
    <div style="margin-top: 40px; display: flex; justify-content: flex-end; text-align: right;">
      <div>
        <p style="font-weight: bold; margin: 0 0 45px 0;">For Creative Line Graphics</p>
        <p style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748B; margin: 0; border-top: 1px solid #000; padding-top: 4px; display: inline-block; min-width: 140px; text-align: center;">AUTHORIZED SIGNATORY</p>
      </div>
    </div>

    <div style="margin-top: 20px; text-align: center; border-top: 1px solid #E2E8F0; padding-top: 8px;">
      <p style="font-size: 9px; color: #94A3B8; margin: 0;">Terms: Subject to Tiruppur Jurisdiction.</p>
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
    console.error("Error rendering printable PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate printable PDF" },
      { status: 500 },
    );
  }
}
