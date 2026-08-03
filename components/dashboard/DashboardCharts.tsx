"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, PieChart as PieChartIcon, Building2 } from "lucide-react";

interface MonthlyTrendItem {
  monthLabel: string;
  taxAmount: number;
  labourAmount: number;
  totalAmount: number;
}

interface TopClientItem {
  name: string;
  totalBilled: number;
  invoiceCount: number;
}

interface DashboardChartsProps {
  monthlyTrend: MonthlyTrendItem[];
  totalPaid: number;
  totalOutstanding: number;
  topClients: TopClientItem[];
}

export function DashboardCharts({
  monthlyTrend,
  totalPaid,
  totalOutstanding,
  topClients,
}: DashboardChartsProps) {
  // Donut chart data for payment distribution
  const paymentData = [
    { name: "Collected Payments", value: totalPaid, color: "#0D9488" },
    { name: "Outstanding Dues", value: totalOutstanding, color: "#E11D48" },
  ];

  const totalPaymentPool = totalPaid + totalOutstanding;

  // Custom Tooltip for Monthly Trend
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0F172A] text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 font-mono">
          <p className="font-bold text-slate-300 font-sans border-b border-slate-700 pb-1 uppercase tracking-wider">
            {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-bold">
                ₹{Number(entry.value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const maxClientRevenue = topClients.length > 0 ? Math.max(...topClients.map((c) => c.totalBilled)) : 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* 1. 6-Month Monthly Billing Trend (Bar Chart) */}
      <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-serif font-bold text-base text-[#0F172A] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Monthly Revenue Breakdown (Last 6 Months)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Tax Invoices vs Labour Bills over time
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0F172A]" /> Tax Invoices
            </span>
            <span className="flex items-center gap-1.5 text-slate-700">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#E11D48]" /> Labour Bills
            </span>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyTrend}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              barGap={6}
            >
              <XAxis
                dataKey="monthLabel"
                tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
                axisLine={{ stroke: "#E2E8F0" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#64748B", fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) =>
                  value >= 1000 ? `₹${(value / 1000).toFixed(0)}k` : `₹${value}`
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="taxAmount"
                name="Tax Invoice (₹)"
                fill="#0F172A"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="labourAmount"
                name="Labour Bill (₹)"
                fill="#E11D48"
                radius={[4, 4, 0, 0]}
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
