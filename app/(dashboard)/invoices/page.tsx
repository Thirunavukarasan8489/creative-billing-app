"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FileText, Plus, Search, Filter, CheckCircle2, AlertCircle, Eye, Printer } from "lucide-react";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      params.set("limit", "100");

      const res = await fetch(`/api/invoices?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.invoices) {
        setInvoices(data.invoices);
      }
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search, typeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#E11D48]" />
            <span>Bill Ledger & Invoices</span>
          </h1>
          <p className="text-xs text-slate-500">
            Filter, manage, record payments, and print Tax Invoices & Labour Bills
          </p>
        </div>

        <Link
          href="/invoices/new"
          className="px-4 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl font-bold text-sm shadow flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Bill</span>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Bill No, Company name, or Item..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white font-medium"
          >
            <option value="">All Bill Types (Tax Invoice & Labour)</option>
            <option value="tax_invoice">Tax Invoice Only</option>
            <option value="labour_bill">Labour Bill Only</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white font-medium"
          >
            <option value="">All Payment Statuses</option>
            <option value="draft">Drafts</option>
            <option value="sent">Issued / Unpaid</option>
            <option value="paid">Paid (Cleared)</option>
          </select>
        </div>
      </div>

      {/* Invoice Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading invoices...</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">No invoices match your search filters</p>
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white text-xs font-bold rounded-lg shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Bill</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-[#0F172A] font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Bill No.</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Client Company</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Grand Total (₹)</th>
                  <th className="p-3 text-right">Balance Due (₹)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#0F172A]">
                      <Link href={`/invoices/${inv._id}`} className="hover:underline">
                        {inv.number}
                      </Link>
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
                    <td className="p-3 text-center space-x-2">
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
