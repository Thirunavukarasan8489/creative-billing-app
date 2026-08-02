"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Building2,
  ArrowLeft,
  Plus,
  Printer,
  FileText,
  CheckCircle2,
  Calendar,
  Filter,
  Eye,
  Pencil,
} from "lucide-react";

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [statementData, setStatementData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Financial Year default: 1st April of current/previous FY to 31st March
  const now = new Date();
  const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const [startDate, setStartDate] = useState(`${fyStart}-04-01`);
  const [endDate, setEndDate] = useState(`${fyStart + 1}-03-31`);

  const fetchStatement = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/companies/${id}/statement?startDate=${startDate}&endDate=${endDate}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load account statement");
      setStatementData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, [id, startDate, endDate]);

  const handlePrintStatement = () => {
    window.open(
      `/companies/${id}/statement/print?startDate=${startDate}&endDate=${endDate}`,
      "_blank"
    );
  };

  if (loading && !statementData) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading company statement...</div>;
  }

  if (error || !statementData) {
    return (
      <div className="p-8 text-center space-y-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-700">
        <p className="font-bold">{error || "Company not found"}</p>
        <Link href="/companies" className="underline text-xs">
          Return to Client Directory
        </Link>
      </div>
    );
  }

  const { company, press, rows, summary } = statementData;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/companies"
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#0F172A] flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" />
              <span>{company.name}</span>
            </h1>
            <p className="text-xs text-slate-600 font-mono">
              Ph: {company.phone} | State: {company.state} ({company.stateCode})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrintStatement}
            className="px-4 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow flex items-center gap-2 transition-all"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>Print Account Statement</span>
          </button>

          <Link
            href={`/invoices/new?companyId=${company._id}`}
            className="px-4 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold rounded-xl shadow flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Bill For Company</span>
          </Link>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Company Billing Details
          </span>
          <p className="text-xs text-slate-700 whitespace-pre-line">{company.address}</p>
          {company.gstin ? (
            <span className="inline-block bg-[#0F172A] text-white text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold mt-2">
              GSTIN: {company.gstin}
            </span>
          ) : (
            <span className="inline-block bg-amber-100 text-amber-900 text-[10px] uppercase px-2 py-0.5 rounded font-semibold mt-2">
              No GSTIN (Labour Bill Client)
            </span>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Period Total Billed (₹)
          </span>
          <p className="font-mono text-2xl font-bold text-[#0F172A]">
            ₹{summary.totalBilled.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500">
            Total Payments Received: ₹{summary.totalReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
            Net Outstanding Balance (₹)
          </span>
          <p className="font-mono text-2xl font-bold text-[#E11D48]">
            ₹{summary.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-500">
            Statement Period: {new Date(startDate).toLocaleDateString("en-IN")} to {new Date(endDate).toLocaleDateString("en-IN")}
          </p>
        </div>
      </div>

      {/* Date Range Picker Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <h3 className="font-serif font-bold text-sm text-[#0F172A]">
            Statement Filter Period:
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs w-full sm:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            />
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={() => {
                const y = new Date().getFullYear();
                setStartDate(`${y - 1}-04-01`);
                setEndDate(`${y}-03-31`);
              }}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px]"
            >
              FY {fyStart - 1}-{fyStart}
            </button>
            <button
              onClick={() => {
                const y = new Date().getFullYear();
                setStartDate(`${y}-04-01`);
                setEndDate(`${y + 1}-03-31`);
              }}
              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-[11px]"
            >
              FY {fyStart}-{fyStart + 1}
            </button>
          </div>
        </div>
      </div>

      {/* 8-Column Paper Statement Table */}
      <div className="bg-white rounded-xl border-2 border-[#0F172A] shadow-md overflow-hidden p-6 space-y-4">
        {/* Paper Header */}
        <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
          <h2 className="font-serif text-2xl font-black text-[#E11D48]">
            {press.name}
          </h2>
          <p className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
            {press.address}
          </p>
          <p className="text-xs text-slate-600 font-mono">
            Cell : {press.phone} | GSTIN : <span className="font-bold text-[#E11D48]">{press.gstin}</span>
          </p>
        </div>

        {/* Statement Title Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-100 p-3 rounded-lg border border-slate-300 font-mono text-xs font-bold text-[#0F172A] gap-2">
          <span className="uppercase text-blue-700">{company.name}</span>
          <span>
            ACCOUNT STATEMENT - {new Date(startDate).toLocaleDateString("en-IN")} TO {new Date(endDate).toLocaleDateString("en-IN")}
          </span>
          <span>GSTIN: {company.gstin || "N/A"}</span>
        </div>

        {/* 8-Column Ledger Table */}
        <div className="overflow-x-auto border border-slate-300 rounded-lg">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[#0F172A] text-white uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="p-2.5 border border-slate-800 text-center w-24">Date</th>
                <th className="p-2.5 border border-slate-800 text-center w-24">Bill No.</th>
                <th className="p-2.5 border border-slate-800">Particulars</th>
                <th className="p-2.5 border border-slate-800 text-right w-24">Total (₹)</th>
                <th className="p-2.5 border border-slate-800 text-center w-10">%</th>
                <th className="p-2.5 border border-slate-800 text-right w-20">CGST (₹)</th>
                <th className="p-2.5 border border-slate-800 text-center w-10">%</th>
                <th className="p-2.5 border border-slate-800 text-right w-20">SGST (₹)</th>
                <th className="p-2.5 border border-slate-800 text-right w-28">Total Amount (₹)</th>
                <th className="p-2.5 border border-slate-800 text-right w-36">Payment Received Details (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 italic font-sans">
                    No bills or payment transactions recorded for this company during the selected date range.
                  </td>
                </tr>
              ) : (
                rows.map((r: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2 border border-slate-200 text-center text-slate-600">
                      {new Date(r.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="p-2 border border-slate-200 text-center font-bold text-[#0F172A]">
                      {r.billNo ? (
                        <Link href={`/invoices/new?search=${r.billNo}`} className="hover:underline">
                          {r.billNo}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-2 border border-slate-200 font-sans uppercase font-medium text-[#0F172A]">
                      {r.particulars}
                    </td>
                    <td className="p-2 border border-slate-200 text-right text-slate-700">
                      {r.subtotal > 0 ? r.subtotal.toFixed(2) : ""}
                    </td>
                    <td className="p-2 border border-slate-200 text-center text-slate-500">
                      {r.cgstPercent > 0 ? r.cgstPercent : ""}
                    </td>
                    <td className="p-2 border border-slate-200 text-right text-slate-700">
                      {r.cgstAmount > 0 ? r.cgstAmount.toFixed(2) : ""}
                    </td>
                    <td className="p-2 border border-slate-200 text-center text-slate-500">
                      {r.sgstPercent > 0 ? r.sgstPercent : ""}
                    </td>
                    <td className="p-2 border border-slate-200 text-right text-slate-700">
                      {r.sgstAmount > 0 ? r.sgstAmount.toFixed(2) : ""}
                    </td>
                    <td className="p-2 border border-slate-200 text-right font-bold text-[#0F172A]">
                      {r.totalAmount > 0 ? r.totalAmount.toFixed(2) : ""}
                    </td>
                    <td className="p-2 border border-slate-200 text-right font-bold text-emerald-700 bg-emerald-50/50">
                      {r.paymentReceived > 0 ? r.paymentReceived.toFixed(2) : ""}
                    </td>
                  </tr>
                ))
              )}

              {/* Totals Summary Row */}
              <tr className="bg-slate-100 font-bold font-serif text-xs border-t-2 border-slate-900">
                <td colSpan={3} className="p-3 text-right uppercase text-[#E11D48]">
                  TOTAL
                </td>
                <td colSpan={5} className="p-3 border border-slate-300"></td>
                <td className="p-3 border border-slate-300 text-right font-mono text-sm text-[#0F172A]">
                  ₹{summary.totalBilled.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="p-3 border border-slate-300 text-right font-mono text-sm text-emerald-700">
                  ₹{summary.totalReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>

              {/* Net Balance Row */}
              <tr className="bg-white font-bold font-serif text-sm border-t border-slate-300">
                <td colSpan={3} className="p-3 text-right uppercase text-[#E11D48]">
                  NET BALANCE DUE
                </td>
                <td colSpan={5} className="p-3 border border-slate-300"></td>
                <td colSpan={2} className="p-3 border border-slate-300 text-right font-mono text-base text-[#E11D48]">
                  ₹{summary.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bank Account Details Footer Box */}
        <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg max-w-xl mx-auto space-y-1.5 text-xs text-center font-mono">
          <h4 className="font-serif font-bold text-base text-[#0F172A]">{press.name}</h4>
          <p className="font-bold text-slate-800">
            NAME OF BANK : <span className="text-blue-700">{press.bankName}</span>
          </p>
          <p className="font-bold text-slate-800">NATURE OF ACCOUNT : CURRENT ACCOUNT</p>
          <p className="font-bold text-slate-800">
            ACCOUNT NO. : <span className="text-[#0F172A]">{press.accountNo}</span>
          </p>
          <p className="font-bold text-slate-800">
            IFSC : <span className="text-[#0F172A]">{press.ifscCode}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
