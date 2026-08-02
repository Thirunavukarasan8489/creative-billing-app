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
} from "lucide-react";
import { dbConnect } from "@/lib/db";
import Invoice from "@/lib/models/Invoice";
import Company from "@/lib/models/Company";

export const revalidate = 0; // Dynamic server rendering

async function getDashboardData() {
  await dbConnect();

  // Month range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalBilledMonthResult,
    totalOutstandingResult,
    recentInvoices,
    companyCount,
    draftCount,
  ] = await Promise.all([
    // Total Billed this month
    Invoice.aggregate([
      { $match: { date: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]),
    // Total Outstanding
    Invoice.aggregate([
      { $group: { _id: null, total: { $sum: "$balanceAmount" } } },
    ]),
    // Recent invoices
    Invoice.find().sort({ date: -1, createdAt: -1 }).limit(6).lean(),
    // Company count
    Company.countDocuments(),
    // Draft invoices count
    Invoice.countDocuments({ status: "draft" }),
  ]);

  const totalBilledMonth = totalBilledMonthResult[0]?.total || 0;
  const totalOutstanding = totalOutstandingResult[0]?.total || 0;

  return {
    totalBilledMonth,
    totalOutstanding,
    recentInvoices: JSON.parse(JSON.stringify(recentInvoices)),
    companyCount,
    draftCount,
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E11D48] text-white text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Creative Line Graphics • Billing Management</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-tight text-white">
            Printing Press Dashboard
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Company-first billing workflow, live paper bill replica preview, automatic GST CGST/SGST calculation, and company ledger balances.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 z-10 w-full sm:w-auto">
          <Link
            href="/invoices/new"
            className="px-5 py-3 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 border border-rose-400/20"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Bill</span>
          </Link>
          <Link
            href="/companies"
            className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 border border-white/10"
          >
            <Building2 className="w-4 h-4" />
            <span>Companies</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Billed This Month */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Billed This Month</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-2xl font-bold text-[#0F172A]">
            ₹{data.totalBilledMonth.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-slate-500">Current month billed total</p>
        </div>

        {/* Card 2: Total Outstanding */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Outstanding Dues</span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-2xl font-bold text-[#E11D48]">
            ₹{data.totalOutstanding.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-slate-500">Uncollected client dues</p>
        </div>

        {/* Card 3: Registered Companies */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Saved Directory</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-2xl font-bold text-[#0F172A]">
            {data.companyCount} <span className="text-sm font-normal text-slate-500">Companies</span>
          </p>
          <p className="text-[11px] text-slate-500">GST & Labour client profiles</p>
        </div>

        {/* Card 4: Working Drafts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Pending Drafts</span>
            <div className="p-2 bg-amber-50 text-amber-700 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="font-mono text-2xl font-bold text-[#0F172A]">
            {data.draftCount} <span className="text-sm font-normal text-slate-500">Invoices</span>
          </p>
          <p className="text-[11px] text-slate-500">Drafts awaiting issue</p>
        </div>
      </div>

      {/* Recent Invoices Table Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
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
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-[#0F172A] font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Bill No.</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Company</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Grand Total (₹)</th>
                  <th className="p-3 text-right">Balance Due (₹)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentInvoices.map((inv: any) => (
                  <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#0F172A]">
                      {inv.number}
                    </td>
                    <td className="p-3">
                      {inv.type === "tax_invoice" ? (
                        <span className="bg-[#0F172A] text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                          Tax Invoice
                        </span>
                      ) : (
                        <span className="bg-[#E11D48] text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                          Labour Bill
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      {inv.companySnapshot?.name || "N/A"}
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {new Date(inv.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="p-3 font-mono font-bold text-right text-[#0F172A]">
                      ₹{inv.grandTotal.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 font-mono font-bold text-right text-[#E11D48]">
                      ₹{(inv.balanceAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-center">
                      {inv.status === "paid" ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      ) : inv.status === "sent" ? (
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
