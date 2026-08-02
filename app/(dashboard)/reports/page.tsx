"use client";

import { useState, useEffect } from "react";
import { PieChart, Download, Calendar, Building2, FileSpreadsheet, RefreshCw } from "lucide-react";

export default function ReportsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setReportData(data);
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <PieChart className="w-6 h-6 text-blue-600" />
            <span>GST & Tax Reports</span>
          </h1>
          <p className="text-xs text-slate-500">
            GST CGST/SGST tax breakdown for GSTR-1/3B filing and company outstanding ledgers
          </p>
        </div>

        <button
          onClick={fetchReport}
          className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4 text-blue-400" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#0F172A]" />
          <span className="font-semibold text-slate-700 uppercase">Date Range Filter:</span>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-slate-500">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg font-mono bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-slate-500">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg font-mono bg-white"
          />
        </div>
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="text-rose-600 font-bold hover:underline"
          >
            Reset Filter
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Generating reports...</div>
      ) : !reportData ? (
        <div className="p-8 text-center text-xs text-rose-600">Failed to load reports data.</div>
      ) : (
        <div className="space-y-8">
          {/* GST Summary Cards */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-serif font-bold text-lg text-[#0F172A] flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                <span>GST Tax Summary (GSTR-1 / GSTR-3B Ready)</span>
              </h2>
              <span className="bg-[#0F172A] text-white text-[10px] uppercase font-mono px-2 py-1 rounded font-bold">
                Tax Invoices: {reportData.gstSummary.taxInvoiceCount}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">
                  Taxable Value (Subtotal)
                </span>
                <p className="font-mono text-xl font-bold text-[#0F172A] mt-1">
                  ₹{reportData.gstSummary.totalSubtotal.toLocaleString("en-IN")}
                </p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                  CGST Total (9%)
                </span>
                <p className="font-mono text-xl font-bold text-emerald-800 mt-1">
                  ₹{reportData.gstSummary.totalCGST.toLocaleString("en-IN")}
                </p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                  SGST Total (9%)
                </span>
                <p className="font-mono text-xl font-bold text-emerald-800 mt-1">
                  ₹{reportData.gstSummary.totalSGST.toLocaleString("en-IN")}
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <span className="text-[10px] font-bold uppercase text-purple-900 block">
                  Total Tax Collected
                </span>
                <p className="font-mono text-xl font-bold text-purple-900 mt-1">
                  ₹{reportData.gstSummary.totalGST.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          {/* Company Ledgers Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-3">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-serif font-bold text-lg text-[#0F172A] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>Client Company Ledger Balances</span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[600px]">
                <thead className="bg-slate-100 text-[#0F172A] font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3">Company Name</th>
                    <th className="p-3">GSTIN</th>
                    <th className="p-3 text-center">Invoices</th>
                    <th className="p-3 text-right">Total Billed (₹)</th>
                    <th className="p-3 text-right">Total Paid (₹)</th>
                    <th className="p-3 text-right">Outstanding (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.companyLedgers.map((cl: any) => (
                    <tr key={cl.companyId} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-[#0F172A]">{cl.name}</td>
                      <td className="p-3 font-mono text-slate-600">{cl.gstin}</td>
                      <td className="p-3 text-center font-mono">{cl.totalInvoices}</td>
                      <td className="p-3 font-mono font-semibold text-right">
                        ₹{cl.totalBilled.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3 font-mono text-emerald-700 font-semibold text-right">
                        ₹{cl.totalPaid.toLocaleString("en-IN")}
                      </td>
                      <td className="p-3 font-mono font-bold text-right text-[#E11D48]">
                        ₹{cl.outstanding.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
