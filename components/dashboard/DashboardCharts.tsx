"use client";

import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, PieChart as PieChartIcon, Building2 } from "lucide-react";

interface InvoiceCompact {
  date: string;
  type: "tax_invoice" | "labour_bill";
  grandTotal: number;
}

interface TopClientItem {
  name: string;
  totalBilled: number;
  invoiceCount: number;
}

interface DashboardChartsProps {
  chartInvoices: InvoiceCompact[];
  totalPaid: number;
  totalOutstanding: number;
  topClients: TopClientItem[];
}

type TimeFilter = "7D" | "1M" | "3M" | "6M" | "1Y";

export function DashboardCharts({
  chartInvoices = [],
  totalPaid,
  totalOutstanding,
  topClients,
}: DashboardChartsProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("6M");

  // Calculate filtered Stacked Bar Chart data based on selected TimeFilter
  const { chartData, totalTax, totalLabour } = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    let mode: "day" | "month" = "month";

    if (timeFilter === "7D") {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      mode = "day";
    } else if (timeFilter === "1M") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      mode = "day";
    } else if (timeFilter === "3M") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      mode = "month";
    } else if (timeFilter === "6M") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      mode = "month";
    } else if (timeFilter === "1Y") {
      startDate = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
      mode = "month";
    }

    // Filter invoices within date range
    const filteredInvoices = chartInvoices.filter(
      (inv) => new Date(inv.date) >= startDate
    );

    let calculatedTax = 0;
    let calculatedLabour = 0;

    filteredInvoices.forEach((inv) => {
      if (inv.type === "tax_invoice") {
        calculatedTax += inv.grandTotal || 0;
      } else {
        calculatedLabour += inv.grandTotal || 0;
      }
    });

    // Grouping
    if (mode === "day") {
      const daysMap: Record<string, { taxAmount: number; labourAmount: number }> = {};
      const numDays = timeFilter === "7D" ? 7 : 30;

      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const label =
          timeFilter === "7D"
            ? d.toLocaleDateString("en-US", { weekday: "short" })
            : `${d.getDate()} ${d.toLocaleDateString("en-US", { month: "short" })}`;
        daysMap[label] = { taxAmount: 0, labourAmount: 0 };
      }

      filteredInvoices.forEach((inv) => {
        const d = new Date(inv.date);
        const label =
          timeFilter === "7D"
            ? d.toLocaleDateString("en-US", { weekday: "short" })
            : `${d.getDate()} ${d.toLocaleDateString("en-US", { month: "short" })}`;
        if (daysMap[label]) {
          if (inv.type === "tax_invoice") {
            daysMap[label].taxAmount += inv.grandTotal || 0;
          } else {
            daysMap[label].labourAmount += inv.grandTotal || 0;
          }
        }
      });

      const data = Object.entries(daysMap).map(([label, val]) => ({
        label,
        taxAmount: val.taxAmount,
        labourAmount: val.labourAmount,
        total: val.taxAmount + val.labourAmount,
      }));

      return { chartData: data, totalTax: calculatedTax, totalLabour: calculatedLabour };
    } else {
      // Month grouping
      const numMonths = timeFilter === "3M" ? 3 : timeFilter === "6M" ? 6 : 12;
      const monthsMap: Record<string, { taxAmount: number; labourAmount: number }> = {};

      for (let i = numMonths - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString("en-US", { month: "short" });
        monthsMap[label] = { taxAmount: 0, labourAmount: 0 };
      }

      filteredInvoices.forEach((inv) => {
        const d = new Date(inv.date);
        const label = d.toLocaleDateString("en-US", { month: "short" });
        if (monthsMap[label]) {
          if (inv.type === "tax_invoice") {
            monthsMap[label].taxAmount += inv.grandTotal || 0;
          } else {
            monthsMap[label].labourAmount += inv.grandTotal || 0;
          }
        }
      });

      const data = Object.entries(monthsMap).map(([label, val]) => ({
        label,
        taxAmount: val.taxAmount,
        labourAmount: val.labourAmount,
        total: val.taxAmount + val.labourAmount,
      }));

      return { chartData: data, totalTax: calculatedTax, totalLabour: calculatedLabour };
    }
  }, [chartInvoices, timeFilter]);

  // Donut chart data for payment distribution
  const paymentData = [
    { name: "Collected Payments", value: totalPaid, color: "#0D9488" },
    { name: "Outstanding Dues", value: totalOutstanding, color: "#E11D48" },
  ];

  const totalPaymentPool = totalPaid + totalOutstanding;

  const formatK = (num: number) => {
    if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Custom Stacked Bar Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const taxVal = payload.find((p: any) => p.dataKey === "taxAmount")?.value || 0;
      const labourVal = payload.find((p: any) => p.dataKey === "labourAmount")?.value || 0;
      const totalVal = taxVal + labourVal;

      return (
        <div className="bg-[#0F172A] text-white p-3 rounded-xl shadow-xl text-xs space-y-2 border border-slate-700 font-mono">
          <p className="font-bold text-slate-300 font-sans border-b border-slate-700 pb-1 uppercase tracking-wider">
            {label} Revenue
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2 h-2 rounded-full bg-[#0F172A] border border-blue-400" />
                Tax Invoice:
              </span>
              <span className="font-bold">
                ₹{Number(taxVal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-[#E11D48]" />
                Labour Bill:
              </span>
              <span className="font-bold">
                ₹{Number(labourVal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-700 font-sans">
              <span className="font-bold text-slate-300">Total Billed:</span>
              <span className="font-bold text-amber-300 font-mono">
                ₹{Number(totalVal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const maxClientRevenue = topClients.length > 0 ? Math.max(...topClients.map((c) => c.totalBilled)) : 1;

  const filtersList: TimeFilter[] = ["7D", "1M", "3M", "6M", "1Y"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. Stacked Revenue Breakdown Chart with Time Filter Pills */}
      <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
        {/* Chart Header & Filter Buttons (Matching Reference Design) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-[#0F172A]">
                Revenue & Billing Breakdown
              </h3>
              <p className="text-xs text-slate-500">
                Tax Invoice vs Labour Bill stacked totals
              </p>
            </div>
          </div>

          {/* Time Filter Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            {filtersList.map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeFilter === filter
                    ? "bg-[#0F172A] text-white shadow-sm font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Stat Cards (Matching Reference Image) */}
        <div className="flex flex-wrap gap-4 pt-1">
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#0F172A] shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Tax Invoices
              </p>
              <p className="font-mono text-lg font-black text-[#0F172A]">
                ₹{formatK(totalTax)}
              </p>
            </div>
          </div>

          <div className="bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#E11D48] shrink-0" />
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Labour Bills
              </p>
              <p className="font-mono text-lg font-black text-[#E11D48]">
                ₹{formatK(totalLabour)}
              </p>
            </div>
          </div>
        </div>

        {/* Recharts Stacked Bar Chart */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
                axisLine={{ stroke: "#E2E8F0" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#64748B", fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => (val >= 1000 ? `₹${(val / 1000).toFixed(0)}K` : `₹${val}`)}
              />
              <Tooltip content={<CustomTooltip />} />
              {/* Stacked Bars: Tax Invoice at base, Labour Bill on top */}
              <Bar
                dataKey="taxAmount"
                name="Tax Invoice"
                stackId="a"
                fill="#0F172A"
                barSize={28}
              />
              <Bar
                dataKey="labourAmount"
                name="Labour Bill"
                stackId="a"
                fill="#E11D48"
                radius={[6, 6, 0, 0]}
                barSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Payment Collection Donut Chart */}
      <div className="lg:col-span-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
        <div>
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-serif font-bold text-base text-[#0F172A] flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-teal-600" />
              <span>Payment Collection Share</span>
            </h3>
            <p className="text-xs text-slate-500">
              Collected vs Uncollected Revenue
            </p>
          </div>

          <div className="h-56 relative flex items-center justify-center pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [
                    `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
                    "",
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Summary Indicator */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Pool
              </span>
              <span className="font-mono text-sm font-black text-[#0F172A]">
                ₹{totalPaymentPool >= 1000 ? `${(totalPaymentPool / 1000).toFixed(1)}k` : totalPaymentPool}
              </span>
            </div>
          </div>
        </div>

        {/* Legend Cards */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-100 space-y-0.5">
            <div className="flex items-center gap-1.5 text-teal-800 font-sans font-bold text-[10px] uppercase">
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              Collected
            </div>
            <p className="font-bold text-teal-900 text-sm">
              ₹{totalPaid.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 space-y-0.5">
            <div className="flex items-center gap-1.5 text-rose-800 font-sans font-bold text-[10px] uppercase">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              Dues Pending
            </div>
            <p className="font-bold text-rose-900 text-sm">
              ₹{totalOutstanding.toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Top Client Revenue Leaders */}
      {topClients.length > 0 && (
        <div className="lg:col-span-12 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#0F172A] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>Top Client Revenue Leaders</span>
              </h3>
              <p className="text-xs text-slate-500">
                Highest billing client accounts by overall revenue
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 font-mono">
              Top {topClients.length} Accounts
            </span>
          </div>

          <div className="space-y-3">
            {topClients.map((client, idx) => {
              const percent = Math.round((client.totalBilled / maxClientRevenue) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-[10px] flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-[#0F172A]">
                        {client.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        ({client.invoiceCount} {client.invoiceCount === 1 ? "bill" : "bills"})
                      </span>
                    </div>
                    <span className="font-mono font-bold text-indigo-900">
                      ₹{client.totalBilled.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
