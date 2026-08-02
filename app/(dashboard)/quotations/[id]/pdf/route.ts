import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Quotation from "@/lib/models/Quotation";
import PressProfile from "@/lib/models/PressProfile";

const DEFAULT_PRESS = {
  name: "Creative Line Graphics",
  tagline: "OFFSET & DIGITAL PRINTING PRESS",
  address:
    "No,28412, Thirumalai Nagar, Ganapathypalayam, Veerapandi PO, TIRUPUR - 641 605.",
  phone: "8489 902 902, 93442 16902",
  email: "creativeline.tpr@gmail.com",
  gstin: "33DDIPG2441F1Z0",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;
    const quotation = await Quotation.findById(id).lean();

    if (!quotation) {
      return new NextResponse("Quotation Not Found", { status: 404 });
    }

    const dbPress = await PressProfile.findOne().lean();
    const press = (dbPress || DEFAULT_PRESS) as typeof DEFAULT_PRESS;

    const dateObj = new Date(quotation.date);
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const yyyy = dateObj.getFullYear();
    const formattedDate = `${dd}.${mm}.${yyyy}`;

    const itemsHtml = quotation.items
      .map((item: any) => {
        const rateVal = Number(item.rate) || 0;
        const amountVal = Number(item.amount) || 0;
        return `
        <tr>
          <td style="border-right: 2px solid #000; border-bottom: 1px solid #000; padding: 10px; text-transform: uppercase; font-weight: 500;">${item.description}</td>
          <td style="border-right: 2px solid #000; border-bottom: 1px solid #000; padding: 10px; text-align: center; font-weight: bold; font-family: monospace;">${item.quantity}</td>
          <td style="border-right: 2px solid #000; border-bottom: 1px solid #000; padding: 10px; text-align: right; font-family: monospace;">${rateVal.toFixed(2).replace(".", "-")}</td>
          <td style="border-bottom: 1px solid #000; padding: 10px; text-align: right; font-family: monospace; font-weight: bold;">${amountVal.toFixed(2).replace(".", "-")}</td>
        </tr>
      `;
      })
      .join("");

    const grandTotalVal = Number(quotation.grandTotal) || 0;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Rate Quotation - ${quotation.number}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #000; background: #FFF; margin: 0; padding: 10px; font-size: 13px; }
    .header-banner { text-align: center; margin-bottom: 12px; }
    .press-title { font-family: 'Brush Script MT', Georgia, serif; font-size: 42px; color: #B91C1C; margin: 0; font-weight: normal; text-transform: capitalize; }
    .press-details { font-size: 12px; color: #0F172A; font-weight: bold; margin: 3px 0; }
    .press-gst { font-size: 15px; font-weight: bold; color: #000; margin-top: 4px; font-family: monospace; }
    .quote-title { font-size: 24px; font-weight: bold; text-decoration: underline; text-transform: uppercase; text-align: center; margin: 0; }
    .quote-table { width: 100%; border-collapse: collapse; border: 2px solid #000; margin-top: 15px; }
    .quote-table th { border-right: 2px solid #000; border-bottom: 2px solid #000; padding: 10px; text-transform: uppercase; font-size: 12px; font-weight: bold; }
    .tax-badge { background: #000; color: #FFF; font-weight: bold; padding: 6px 12px; font-size: 13px; display: inline-block; text-transform: uppercase; }
    @media print {
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background: #0F172A; color: white; padding: 12px; text-align: center; font-weight: bold; margin-bottom: 20px;">
    <button onclick="window.print()" style="background: #E11D48; color: white; border: none; padding: 10px 20px; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 14px;">Print / Export Quotation PDF</button>
  </div>

  <div style="max-w: 800px; margin: 0 auto; padding: 10px;">
    <!-- Header Banner -->
    <div class="header-banner">
      <h1 class="press-title">${press.name}</h1>
      <p class="press-details">${press.address}</p>
      <p class="press-details">Cell : ${press.phone}</p>
      <p class="press-gst">GSTIN : ${press.gstin}</p>
      <hr style="border: none; border-top: 3px double #000; margin-top: 10px;" />
    </div>

    <!-- Quotation Title & Date -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; margin-bottom: 20px;">
      <div style="width: 30%;"></div>
      <h2 class="quote-title">QUOTATION</h2>
      <div style="width: 30%; text-align: right; font-weight: bold; font-family: monospace; font-size: 14px;">
        Date : ${formattedDate}
      </div>
    </div>

    <!-- Recipient To & Subject -->
    <div style="margin-bottom: 25px; font-size: 14px; line-height: 1.6;">
      <p style="margin: 0; font-weight: bold;">To,</p>
      <p style="margin: 2px 0; font-weight: bold;">${quotation.recipientTitle || "The Purchase Manager"}</p>
      <p style="margin: 2px 0; font-weight: bold; font-size: 16px;">${quotation.companySnapshot.name}</p>
      <p style="margin: 2px 0; color: #333; white-space: pre-line;">${quotation.companySnapshot.address}</p>

      <p style="margin-top: 20px; font-weight: bold; font-size: 15px;">
        ${quotation.subject || "Sub : Rate Quotation Reg."}
      </p>
    </div>

    <!-- Particulars Table -->
    <table class="quote-table">
      <thead>
        <tr>
          <th style="text-align: left;">Particulars</th>
          <th style="width: 120px; text-align: center;">Quantity</th>
          <th style="width: 130px; text-align: right;">Rate Per Pcs</th>
          <th style="width: 140px; text-align: right; border-right: none;">Amount Rs.</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Tax Badge Footer -->
    <div style="border: 2px solid #000; border-top: none; padding: 10px; display: flex; justify-content: space-between; align-items: center; background: #FAF9F6;">
      <div>
        ${quotation.taxNote ? `<span class="tax-badge">${quotation.taxNote}</span>` : ""}
      </div>
      <div style="font-family: monospace; font-weight: bold; font-size: 15px;">
        Total Amount: ₹${grandTotalVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
      </div>
    </div>

    ${
      quotation.notes
        ? `<div style="margin-top: 20px; padding: 10px; border: 1px solid #CBD5E1; font-size: 12px; background: #F8FAFC;">
            <strong>Additional Terms:</strong><br/>${quotation.notes}
          </div>`
        : ""
    }

    <!-- Signature Bar -->
    <div style="margin-top: 80px; display: flex; justify-content: flex-end; text-align: right;">
      <div>
        <p style="margin: 0; font-weight: bold; font-size: 14px;">For ${press.name}</p>
        <div style="height: 50px;"></div>
        <p style="margin: 0; font-size: 11px; text-transform: uppercase; font-weight: bold; color: #475569;">Authorized Signatory</p>
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
    console.error("Error generating printable quotation route:", error);
    return new NextResponse("Server Error", { status: 500 });
  }
}
