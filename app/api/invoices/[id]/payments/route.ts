import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import Payment from "@/lib/models/Payment";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const { amountPaid, date, mode, referenceNo, notes } = body;

    if (!amountPaid || typeof amountPaid !== "number" || amountPaid <= 0) {
      return NextResponse.json(
        { error: "Valid payment amount is required" },
        { status: 400 }
      );
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const payment = await Payment.create({
      invoiceId: id,
      amountPaid,
      date: date ? new Date(date) : new Date(),
      mode: mode || "bank_transfer",
      referenceNo: referenceNo || "",
      notes: notes || "",
    });

    // Update invoice paid amount, balance amount, and status
    const newPaidAmount = (invoice.paidAmount || 0) + amountPaid;
    const newBalance = Math.max(0, invoice.grandTotal - newPaidAmount);
    const newStatus = newBalance === 0 ? "paid" : invoice.status;

    await Invoice.findByIdAndUpdate(id, {
      paidAmount: newPaidAmount,
      balanceAmount: newBalance,
      status: newStatus,
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error recording payment:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}
