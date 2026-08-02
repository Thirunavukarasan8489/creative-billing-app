"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Calendar,
  Building2,
  FileSpreadsheet,
  RefreshCw,
  Printer,
  FileText,
} from "lucide-react";

const MONTH_NAMES = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<
    "monthly" | "gst" | "client_ledgers"
  >("monthly");

  // Monthly Statement State
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(
    now.getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [monthlyData, setMonthlyData] = useState<any | null>(null);
  const [loadingMonthly, setLoadingMonthly] = useState<boolean>(true);

  // Overall GST & Ledger State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState<any | null>(null);
  const [loadingGeneral, setLoadingGeneral] = useState<boolean>(true);

  // Fetch Monthly Sales Statement Data
  const fetchMonthlyStatement = async () => {
    setLoadingMonthly(true);
    try {
      const res = await fetch(
        `/api/reports/monthly-sales?month=${selectedMonth}&year=${selectedYear}`
      );
      const data = await res.json();
      if (res.ok) {
        setMonthlyData(data);
      }
    } catch (err) {
      console.error("Failed to load monthly statement:", err);
    } finally {
      setLoadingMonthly(false);
    }
  };

  // Fetch General GST Reports Data
  const fetchGeneralReport = async () => {
    setLoadingGeneral(true);
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
      setLoadingGeneral(false);
    }
  };

  useEffect(() => {
    fetchMonthlyStatement();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchGeneralReport();
  }, [startDate, endDate]);

  const handlePrintMonthly = () => {
    window.open(
      `/reports/monthly-sales/print?month=${selectedMonth}&year=${selectedYear}`,
      "_blank"
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <PieChart className="w-6 h-6 text-blue-600" />
            <span>Reports & Monthly Statements</span>
          </h1>
          <p className="text-xs text-slate-500">
            Monthly billing statement ledgers, GSTR-1/3B tax summaries, and company outstanding balances
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "monthly" && (
            <button
              onClick={handlePrintMonthly}
              className="px-4 py-2 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl font-bold text-xs shadow flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Monthly Statement PDF</span>
            </button>
          )}

          <button
            onClick={() => {
              if (activeTab === "monthly") fetchMonthlyStatement();
              else fetchGeneralReport();
            }}
            className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4 text-blue-400" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab("monthly")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "monthly"
              ? "border-[#E11D48] text-[#E11D48]"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Monthly Sales Statement</span>
        </button>

        <button
          onClick={() => setActiveTab("gst")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "gst"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>GST Tax Summary</span>
        </button>

        <button
          onClick={() => setActiveTab("client_ledgers")}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "client_ledgers"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Client Company Ledgers</span>
        </button>
      </div>

      {/* TAB 1: MONTHLY SALES BILL STATEMENT */}
      {activeTab === "monthly" && (
        <div className="space-y-6">
          {/* Month & Year Selectors */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#E11D48]" />
                <span className="font-semibold text-slate-700 uppercase">
                  Select Statement Period:
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-slate-500 font-semibold">Month:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg font-bold bg-white text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-slate-500 font-semibold">Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg font-bold bg-white text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
            </div>

            <button
              onClick={handlePrintMonthly}
              className="px-3 py-1.5 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-lg font-bold text-xs shadow flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4 Statement</span>
            </button>
          </div>

          {/* Live Paper Statement Replica */}
          {loadingMonthly ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Generating monthly sales statement...
            </div>
          ) : !monthlyData ? (
            <div className="p-8 text-center text-xs text-rose-600">
              Failed to load monthly statement data.
            </div>
          ) : (
            <div className="bg-white p-4 sm:p-8 rounded-xl border-2 border-slate-900 shadow-lg space-y-4 max-w-5xl mx-auto overflow-x-auto">
              <div className="border border-slate-900 p-4 sm:p-6 min-w-[700px]">
                {/* ParkAvenue Heading */}
                <h2 className="park-avenue text-3xl sm:text-4xl text-center text-[#E11D48]">
                  Creative Line Graphics
                </h2>

                {/* Sub-Header Title & Date */}
                <div className="flex justify-between items-center border-t border-b-2 border-slate-900 py-1.5 my-3 text-xs sm:text-sm font-bold">
                  <div className="w-1/3"></div>
                  <div className="w-1/3 text-center text-[#BE123C] tracking-wide uppercase">
                    SALES BILL {monthlyData.monthLabel} {monthlyData.year}
                  </div>
                  <div className="w-1/3 text-right text-[#BE123C] font-mono">
                    {new Date().toLocaleDateString("en-GB").replace(/\//g, " - ")}
                  </div>
                </div>

                {/* 10-Column Monthly Sales Grid */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse border border-slate-900 font-mono">
                    <thead>
                      <tr className="bg-slate-50 text-slate-900 font-bold uppercase text-[10px] border-b border-slate-900">
                        <th className="border border-slate-900 p-1.5 text-center w-14">
                          BILL No.
                        </th>
                        <th className="border border-slate-900 p-1.5 text-center w-20">
                          Date
                        </th>
                        <th className="border border-slate-900 p-1.5 text-left">
                          Particulars
                        </th>
                        <th className="border border-slate-900 p-1.5 text-center w-36">
                          GST NO.
                        </th>
                        <th className="border border-slate-900 p-1.5 text-right w-20">
                          TOTAL
                        </th>
                        <th className="border border-slate-900 p-1.5 text-center w-8">
                          %
                        </th>
                        <th className="border border-slate-900 p-1.5 text-right w-20">
                          CGST
                        </th>
                        <th className="border border-slate-900 p-1.5 text-center w-8">
                          %
                        </th>
                        <th className="border border-slate-900 p-1.5 text-right w-20">
                          SGST
                        </th>
                        <th className="border border-slate-900 p-1.5 text-right w-24">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {monthlyData.rows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={10}
                            className="p-8 text-center text-slate-400 font-sans text-xs italic"
                          >
                            No bills issued in {monthlyData.monthLabel}{" "}
                            {monthlyData.year}
                          </td>
                        </tr>
                      ) : (
                        monthlyData.rows.map((r: any) => (
                          <tr key={r._id} className="hover:bg-slate-50">
                            <td className="border border-slate-900 p-1.5 text-center font-bold text-slate-900">
                              {r.billNo}
                            </td>
                            <td className="border border-slate-900 p-1.5 text-center text-slate-700">
                              {new Date(r.date)
                                .toLocaleDateString("en-GB")
                                .replace(/\//g, ".")}
                            </td>
                            <td className="border border-slate-900 p-1.5 font-sans font-semibold text-slate-800">
                              {r.particulars}
                            </td>
                            <td className="border border-slate-900 p-1.5 text-center text-slate-600 text-[10px]">
                              {r.gstin}
                            </td>
                            <td className="border border-slate-900 p-1.5 text-right text-slate-800">
                              {r.subtotal > 0
                                ? r.subtotal.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                  })
                                : ""}
                            </td>
                            <td className="border border-slate-900 p-1.5 text-center text-slate-600">
                              {r.cgstPercent > 0 ? r.cgstPercent : ""}
                            </td>
                            <td className="border border-slate-900 p-1.5 text-right text-slate-800">
                              {r.cgstAmount > 0
                                ? r.cgstAmount.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                  })
                                : ""}
                            </td>
                            <td className="border border-slate-900 p-1.5 text-center text-slate-600">
                              {r.sgstPercent > 0 ? r.sgstPercent : ""}
                            </td>
                            <td className="border border-slate-900 p-1.5 text-right text-slate-800">
                              {r.sgstAmount > 0
                                ? r.sgstAmount.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                  })
                                : ""}
                            </td>
                            <td className="border border-slate-900 p-1.5 text-right font-bold text-slate-900">
                              {r.grandTotal.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        ))
                      )}

                      {/* Summary Totals Row */}
                      <tr className="bg-rose-50/50 font-bold border-t-2 border-slate-900 text-xs">
                        <td
                          colSpan={4}
                          className="border border-slate-900 p-2 text-right text-[#BE123C] font-extrabold uppercase font-sans"
                        >
                          TOTAL
                        </td>
                        <td className="border border-slate-900 p-2 text-right text-[#BE123C] font-extrabold">
                          {monthlyData.totals.totalSubtotal.toLocaleString(
                            "en-IN",
                            { minimumFractionDigits: 2 }
                          )}
                        </td>
                        <td className="border border-slate-900 p-2"></td>
                        <td className="border border-slate-900 p-2 text-right text-[#BE123C] font-extrabold">
                          {monthlyData.totals.totalCGST.toLocaleString(
                            "en-IN",
                            { minimumFractionDigits: 2 }
                          )}
                        </td>
                        <td className="border border-slate-900 p-2"></td>
                        <td className="border border-slate-900 p-2 text-right text-[#BE123C] font-extrabold">
                          {monthlyData.totals.totalSGST.toLocaleString(
                            "en-IN",
                            { minimumFractionDigits: 2 }
                          )}
                        </td>
                        <td className="border border-slate-900 p-2 text-right text-[#BE123C] font-extrabold text-sm">
                          {monthlyData.totals.grandTotalSum.toLocaleString(
                            "en-IN",
                            { minimumFractionDigits: 2 }
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OVERALL GST TAX SUMMARY */}
      {activeTab === "gst" && (
        <div className="space-y-6">
          {/* Date Range Selector */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0F172A]" />
              <span className="font-semibold text-slate-700 uppercase">
                Date Range Filter:
              </span>
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

          {loadingGeneral ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Generating GST reports...
            </div>
          ) : !reportData ? (
            <div className="p-8 text-center text-xs text-rose-600">
              Failed to load reports data.
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* TAB 3: CLIENT COMPANY LEDGERS */}
      {activeTab === "client_ledgers" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden space-y-3">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-serif font-bold text-lg text-[#0F172A] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>Client Company Ledger Balances</span>
            </h2>
          </div>

          {loadingGeneral ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Loading company ledgers...
            </div>
          ) : !reportData ? (
            <div className="p-8 text-center text-xs text-rose-600">
              Failed to load company ledgers.
            </div>
          ) : (
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
          )}
        </div>
      )}
    </div>
  );
}
