import Link from "next/link";
import {
  FileText,
  Building2,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  PieChart,
  FileSpreadsheet,
  Zap,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { dbConnect } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import Company from "@/lib/models/Company";
import Quotation from "@/lib/models/Quotation";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";

export const revalidate = 0; // Dynamic server rendering

async function getDashboardData() {
  await dbConnect();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 6 months trend calculation
  const monthsTrendList: { start: Date; end: Date; monthLabel: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStart = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0);
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthLabel = d.toLocaleDateString("en-US", { month: "short" });

    monthsTrendList.push({
      start: mStart,
      end: mEnd,
      monthLabel,
    });
  }

  const [
    totalBilledMonthResult,
    taxInvoiceMonthCount,
    labourBillMonthCount,
    totalOutstandingResult,
    totalPaidResult,
    totalInvoicedAllResult,
    recentInvoices,
    companyCount,
    quotationCount,
    topClientsResult,
    ...trendResults
  ] = await Promise.all([
    // Total Billed this month
    Invoice.aggregate([
      { $match: { date: { $gte: startOfMonth }, status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]),
    // Tax Invoices Count this month
    Invoice.countDocuments({
      date: { $gte: startOfMonth },
      type: "tax_invoice",
      status: { $ne: "cancelled" },
    }),
    // Labour Bills Count this month
    Invoice.countDocuments({
      date: { $gte: startOfMonth },
      type: "labour_bill",
      status: { $ne: "cancelled" },
    }),
    // Total Outstanding across active invoices
    Invoice.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$balanceAmount" } } },
    ]),
    // Total Paid Amount across active invoices
    Invoice.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$paidAmount" } } },
    ]),
    // Total Invoiced All Time
    Invoice.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]),
    // Recent invoices
    Invoice.find({ status: { $ne: "cancelled" } })
      .sort({ date: -1, createdAt: -1 })
      .limit(6)
      .lean(),
    // Company count
    Company.countDocuments(),
    // Rate Quotations count
    Quotation.countDocuments(),
    // Top 5 Clients by revenue
    Invoice.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      {
        $group: {
          _id: "$companySnapshot.name",
          totalBilled: { $sum: "$grandTotal" },
          invoiceCount: { $sum: 1 },
        },
      },
      { $sort: { totalBilled: -1 } },
      { $limit: 5 },
    ]),
    // 6-month monthly trend promises
    ...monthsTrendList.flatMap((m) => [
      Invoice.aggregate([
        {
          $match: {
            date: { $gte: m.start, $lte: m.end },
            type: "tax_invoice",
            status: { $ne: "cancelled" },
          },
        },
        { $group: { _id: null, total: { $sum: "$grandTotal" } } },
      ]),
      Invoice.aggregate([
        {
          $match: {
            date: { $gte: m.start, $lte: m.end },
            type: "labour_bill",
            status: { $ne: "cancelled" },
          },
        },
        { $group: { _id: null, total: { $sum: "$grandTotal" } } },
      ]),
    ]),
  ]);

  const monthlyTrend = monthsTrendList.map((m, idx) => {
    const taxRes = trendResults[idx * 2];
    const labourRes = trendResults[idx * 2 + 1];
    const taxAmount = taxRes?.[0]?.total || 0;
    const labourAmount = labourRes?.[0]?.total || 0;

    return {
      monthLabel: m.monthLabel,
      taxAmount,
      labourAmount,
      totalAmount: taxAmount + labourAmount,
    };
  });

  const topClients = topClientsResult.map((c: any) => ({
    name: c._id || "Direct Client",
    totalBilled: c.totalBilled || 0,
    invoiceCount: c.invoiceCount || 0,
  }));

  const totalBilledMonth = totalBilledMonthResult[0]?.total || 0;
  const totalOutstanding = totalOutstandingResult[0]?.total || 0;
  const totalPaid = totalPaidResult[0]?.total || 0;
  const totalInvoicedAllTime = totalInvoicedAllResult[0]?.total || 0;

  const collectionRate =
    totalInvoicedAllTime > 0
      ? Math.min(100, Math.round((totalPaid / totalInvoicedAllTime) * 100))
      : 100;

  return {
    totalBilledMonth,
    taxInvoiceMonthCount,
    labourBillMonthCount,
    totalOutstanding,
    totalPaid,
    totalInvoicedAllTime,
    collectionRate,
    recentInvoices: JSON.parse(JSON.stringify(recentInvoices)),
    companyCount,
    quotationCount,
    monthlyTrend,
    topClients,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const currentDateStr = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Executive Hero Banner */}
      <div className="relative bg-[#0F172A] text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
        {/* Ambient Gradient Highlights */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E11D48] text-white text-[11px] font-bold uppercase tracking-wider shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                Creative Line Graphics
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                {currentDateStr}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Billing & Counter Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Fast counter-side billing management for <strong>Creative Line Graphics</strong>. Issue Tax Invoices, Labour Bills, and Rate Quotations with real-time paper previews.
            </p>
          </div>

          {/* Quick Counter Action Buttons */}
          <div className="flex flex-wrap gap-2.5 w-full lg:w-auto">
            <Link
              href="/invoices/new?type=tax_invoice"
              className="flex-1 sm:flex-initial px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 border border-blue-400/30"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>+ Tax Invoice</span>
            </Link>

            <Link
              href="/invoices/new?type=labour_bill"
              className="flex-1 sm:flex-initial px-4 py-3 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl font-bold text-xs shadow-md hover:shadow-rose-500/20 transition-all flex items-center justify-center gap-2 border border-rose-400/30"
            >
              <Plus className="w-4 h-4" />
              <span>+ Labour Bill</span>
            </Link>

            <Link
              href="/quotations/new"
              className="flex-1 sm:flex-initial px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs shadow transition-all flex items-center justify-center gap-2 border border-slate-700"
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-400" />
              <span>+ Rate Quote</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Modern KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Billed This Month */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 border-t-4 border-t-emerald-500 shadow-2xs space-y-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Billed This Month
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <p className="font-mono text-2xl font-black text-[#0F172A]">
              ₹{data.totalBilledMonth.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {data.taxInvoiceMonthCount} Tax Invoices • {data.labourBillMonthCount} Labour Bills
            </p>
          </div>
        </div>

        {/* Card 2: Total Outstanding */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 border-t-4 border-t-rose-500 shadow-2xs space-y-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Outstanding Dues
            </span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
              <AlertCircle className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <p className="font-mono text-2xl font-black text-[#E11D48]">
              ₹{data.totalOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Uncollected dues across client accounts
            </p>
          </div>
        </div>

        {/* Card 3: Collection Efficiency */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 border-t-4 border-t-teal-500 shadow-2xs space-y-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Collection Rate
            </span>
            <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <p className="font-mono text-2xl font-black text-[#0F172A]">
                {data.collectionRate}%
              </p>
              <span className="text-[11px] text-slate-500 font-mono">
                (₹{data.totalPaid.toLocaleString("en-IN")} collected)
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-2">
              <div
                className="bg-teal-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${data.collectionRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Saved Directory */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 border-t-4 border-t-blue-500 shadow-2xs space-y-3 hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Saved Directory
            </span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Building2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div>
            <p className="font-mono text-2xl font-black text-[#0F172A]">
              {data.companyCount} <span className="text-xs font-normal text-slate-500">Clients</span>
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {data.quotationCount} Rate Quotations on record
            </p>
          </div>
        </div>
      </div>

      {/* Quick Counter Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/invoices/new?type=tax_invoice"
          className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-500/50 shadow-2xs hover:shadow-md transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 group-hover:bg-blue-600 text-blue-600 group-hover:text-white flex items-center justify-center transition-colors">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-[#0F172A] group-hover:text-blue-600 transition-colors">
                Issue Tax Invoice
              </h3>
              <p className="text-[10px] text-slate-500">GST Companies (CGST/SGST)</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
        </Link>

        <Link
          href="/invoices/new?type=labour_bill"
          className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-rose-500/50 shadow-2xs hover:shadow-md transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-50 group-hover:bg-[#E11D48] text-[#E11D48] group-hover:text-white flex items-center justify-center transition-colors">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-[#0F172A] group-hover:text-[#E11D48] transition-colors">
                Issue Labour Bill
              </h3>
              <p className="text-[10px] text-slate-500">Fast non-GST printing bill</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#E11D48] transition-colors" />
        </Link>

        <Link
          href="/quotations"
          className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-teal-500/50 shadow-2xs hover:shadow-md transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 group-hover:bg-teal-600 text-teal-600 group-hover:text-white flex items-center justify-center transition-colors">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-[#0F172A] group-hover:text-teal-600 transition-colors">
                Rate Quotations
              </h3>
              <p className="text-[10px] text-slate-500">1-Click Invoice Converter</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors" />
        </Link>

        <Link
          href="/companies"
          className="group bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-500/50 shadow-2xs hover:shadow-md transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center transition-colors">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xs text-[#0F172A] group-hover:text-indigo-600 transition-colors">
                Companies Directory
              </h3>
              <p className="text-[10px] text-slate-500">Client account ledgers</p>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
        </Link>
      </div>

      {/* Interactive Visual Charts & Analytics */}
      <DashboardCharts
        monthlyTrend={data.monthlyTrend}
        totalPaid={data.totalPaid}
        totalOutstanding={data.totalOutstanding}
        topClients={data.topClients}
      />

      {/* Recent Invoices Table Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-serif font-bold text-lg text-[#0F172A]">
              Recent Bill Ledger
            </h2>
            <p className="text-xs text-slate-500">Latest issued Tax Invoices & Labour Bills</p>
          </div>
          <Link
            href="/invoices"
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
          >
            <span>View All Invoices</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {data.recentInvoices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">No invoices created yet</p>
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white text-xs font-bold rounded-lg shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Bill</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-auto max-h-[420px]">
            <table className="w-full text-xs text-left min-w-[720px] border-separate border-spacing-0">
              <thead className="sticky top-0 z-10 bg-slate-100 text-[#0F172A] font-bold uppercase tracking-wider shadow-xs">
                <tr>
                  <th className="p-3 bg-slate-100 border-b border-slate-200 sticky top-0 z-10">Bill No.</th>
                  <th className="py-3 px-3 bg-slate-100 border-b border-slate-200 sticky top-0 z-10">Type</th>
                  <th className="p-3 bg-slate-100 border-b border-slate-200 sticky top-0 z-10">Client Company</th>
                  <th className="p-3 bg-slate-100 border-b border-slate-200 sticky top-0 z-10">Date</th>
                  <th className="p-3 text-right bg-slate-100 border-b border-slate-200 sticky top-0 z-10">Grand Total (₹)</th>
                  <th className="p-3 text-right bg-slate-100 border-b border-slate-200 sticky top-0 z-10">Balance Due (₹)</th>
                  <th className="p-3 text-center bg-slate-100 border-b border-slate-200 sticky top-0 z-10">Status</th>
                  <th className="p-3 text-center bg-slate-100 border-b border-slate-200 sticky top-0 z-10">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {data.recentInvoices.map((inv: any) => (
                  <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#0F172A]">
                      {inv.number}
                    </td>
                    <td className="p-3">
                      {inv.type === "tax_invoice" ? (
                        <span className="bg-[#0F172A] text-white text-[10px] uppercase font-bold px-2 py-1 rounded">
                          Tax Invoice
                        </span>
                      ) : (
                        <span className="bg-[#E11D48] text-white text-[10px] uppercase font-bold px-2 py-1 rounded">
                          Labour Bill
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">
                        {inv.companySnapshot?.name || "N/A"}
                      </div>
                      {inv.companySnapshot?.gstin && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          GST: {inv.companySnapshot.gstin}
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {new Date(inv.date).toLocaleDateString("en-GB").replace(/\//g, ".")}
                    </td>
                    <td className="p-3 font-mono font-bold text-right text-[#0F172A]">
                      ₹{inv.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 font-mono font-bold text-right">
                      {inv.balanceAmount > 0 ? (
                        <span className="text-[#E11D48]">
                          ₹{inv.balanceAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-teal-700">₹0.00</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {inv.status === "paid" || inv.balanceAmount === 0 ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      ) : inv.status === "sent" || inv.status === "issued" ? (
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          Issued
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <Link
                        href={`/invoices/${inv._id}`}
                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                      >
                        View & Print
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
