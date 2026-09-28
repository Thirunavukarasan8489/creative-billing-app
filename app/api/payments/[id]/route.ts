import { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import Payment from "@/lib/models/Payment";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const payment = await Payment.findById(id);
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Revert the invoice amount
    const invoice = await Invoice.findById(payment.invoiceId);
    if (invoice) {
      const revertedPaidAmount = Math.max(
        0,
        (invoice.paidAmount || 0) - (payment.amountPaid || 0)
      );
      const revertedBalance = Math.max(0, invoice.grandTotal - revertedPaidAmount);
      const revertedStatus =
        revertedBalance === 0 ? "paid" : invoice.status === "cancelled" ? "cancelled" : "sent";

      await Invoice.findByIdAndUpdate(invoice._id, {
        paidAmount: revertedPaidAmount,
        balanceAmount: revertedBalance,
        status: revertedStatus,
      });
    }

    await Payment.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Payment deleted and invoice balance restored",
    });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json(
      { error: "Failed to delete payment" },
      { status: 500 }
    );
  }
}
