import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";

export function getFinancialYear(dateInput: Date | string): string {
  const date = new Date(dateInput);
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed: 0 = Jan, 3 = April

  let startYear: number;
  let endYear: number;

  if (month >= 3) {
    // April (3) to Dec (11)
    startYear = year;
    endYear = year + 1;
  } else {
    // Jan (0) to March (2)
    startYear = year - 1;
    endYear = year;
  }

  const startStr = startYear.toString().slice(-2);
  const endStr = endYear.toString().slice(-2);
  return `${startStr}-${endStr}`;
}

export async function getNextInvoiceNumber(
  type: "tax_invoice" | "labour_bill",
  dateInput: Date | string = new Date()
): Promise<{ number: string; financialYear: string; sequenceNumber: number }> {
  await dbConnect();
  const financialYear = getFinancialYear(dateInput);
  const prefix = type === "tax_invoice" ? "TI" : "LB";

  const latestInvoice = await Invoice.findOne({
    type,
    financialYear,
  })
    .sort({ sequenceNumber: -1 })
    .exec();

  const sequenceNumber = latestInvoice ? latestInvoice.sequenceNumber + 1 : 1;
  const paddedSeq = sequenceNumber.toString().padStart(4, "0");
  const number = `${prefix}/${financialYear}/${paddedSeq}`;

  return { number, financialYear, sequenceNumber };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") as "tax_invoice" | "labour_bill";
    const dateParam = searchParams.get("date") || new Date().toISOString();

    if (!type || (type !== "tax_invoice" && type !== "labour_bill")) {
      return NextResponse.json(
        { error: "Invalid or missing 'type' parameter (tax_invoice | labour_bill)" },
        { status: 400 }
      );
    }

    const nextData = await getNextInvoiceNumber(type, dateParam);
    return NextResponse.json(nextData);
  } catch (error) {
    console.error("Error generating next invoice number:", error);
    return NextResponse.json(
      { error: "Failed to generate next invoice number" },
      { status: 500 }
    );
  }
}
