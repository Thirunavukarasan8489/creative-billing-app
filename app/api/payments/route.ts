import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import Payment from "@/lib/models/Payment";
import Company from "@/lib/models/Company";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    const query: any = {};

    if (companyId && mongoose.Types.ObjectId.isValid(companyId)) {
      query.companyId = companyId;
    }

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { referenceNo: searchRegex },
        { notes: searchRegex },
        { mode: searchRegex },
      ];
    }

    const payments = await Payment.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .populate({
        path: "invoiceId",
        select: "number type date grandTotal paidAmount balanceAmount status companySnapshot companyId",
        strictPopulate: false,
      })
      .populate({
        path: "companyId",
        select: "name gstin phone",
        strictPopulate: false,
      })
      .lean();

    // If search had bill number or company name match, perform client filter if not in query
    let filteredPayments = payments;
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      filteredPayments = payments.filter((p: any) => {
        const invNum = p.invoiceId?.number?.toLowerCase() || "";
        const compName =
          p.companyId?.name?.toLowerCase() ||
          p.invoiceId?.companySnapshot?.name?.toLowerCase() ||
          "";
        const ref = p.referenceNo?.toLowerCase() || "";
        const notes = p.notes?.toLowerCase() || "";
        const mode = p.mode?.toLowerCase() || "";
        return (
          invNum.includes(term) ||
          compName.includes(term) ||
          ref.includes(term) ||
          notes.includes(term) ||
          mode.includes(term)
        );
      });
    }

    // Calculate summary statistics
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const allPaymentsForStats = await Payment.find({}).lean();
    let totalAllTime = 0;
    let totalThisMonth = 0;
    let totalToday = 0;

    for (const p of allPaymentsForStats) {
      const pDate = new Date(p.date || p.createdAt);
      totalAllTime += p.amountPaid || 0;
      if (pDate >= startOfMonth) totalThisMonth += p.amountPaid || 0;
      if (pDate >= startOfToday) totalToday += p.amountPaid || 0;
    }

    return NextResponse.json({
      payments: filteredPayments,
      stats: {
        totalRecords: allPaymentsForStats.length,
        totalAllTime,
        totalThisMonth,
        totalToday,
      },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();

    const {
      companyId,
      date,
      mode = "bank_transfer",
      referenceNo = "",
      notes = "",
      payments: rawPayments,
      invoiceId,
      amountPaid,
    } = body;

    // Normalise to list of allocations: [{ invoiceId, amountPaid }]
    let allocations: Array<{ invoiceId: string; amountPaid: number }> = [];

    if (Array.isArray(rawPayments) && rawPayments.length > 0) {
      allocations = rawPayments.filter(
        (p) => p.invoiceId && typeof p.amountPaid === "number" && p.amountPaid > 0
      );
    } else if (invoiceId && typeof amountPaid === "number" && amountPaid > 0) {
      allocations = [{ invoiceId, amountPaid }];
    }

    if (allocations.length === 0) {
      return NextResponse.json(
        { error: "At least one invoice with a positive payment amount is required" },
        { status: 400 }
      );
    }

    const paymentDate = date ? new Date(date) : new Date();
    const createdPayments = [];
    let totalAllocated = 0;

    for (const alloc of allocations) {
      const invoice = await Invoice.findById(alloc.invoiceId);
      if (!invoice) continue;
      if (invoice.status === "cancelled") continue;

      const payAmt = Math.round(alloc.amountPaid * 100) / 100;
      if (payAmt <= 0) continue;

      const resolvedCompanyId =
        companyId && mongoose.Types.ObjectId.isValid(companyId)
          ? companyId
          : invoice.companyId || undefined;

      const payment = await Payment.create({
        invoiceId: invoice._id,
        companyId: resolvedCompanyId,
        amountPaid: payAmt,
        date: paymentDate,
        mode: mode || "bank_transfer",
        referenceNo: referenceNo.trim(),
        notes: notes.trim(),
      });

      const newPaidAmount = (invoice.paidAmount || 0) + payAmt;
      const newBalance = Math.max(0, invoice.grandTotal - newPaidAmount);
      const newStatus = newBalance === 0 ? "paid" : "sent";

      await Invoice.findByIdAndUpdate(invoice._id, {
        paidAmount: newPaidAmount,
        balanceAmount: newBalance,
        status: newStatus,
      });

      createdPayments.push(payment);
      totalAllocated += payAmt;
    }

    if (createdPayments.length === 0) {
      return NextResponse.json(
        { error: "No valid or active invoices were updated" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        count: createdPayments.length,
        totalAllocated,
        payments: createdPayments,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating payments:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}
