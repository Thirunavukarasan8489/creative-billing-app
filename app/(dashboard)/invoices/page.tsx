"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  Eye,
  Pencil,
  Ban,
  Trash2,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
} from "lucide-react";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);
      if (statusFilter) params.set("status", statusFilter);
      params.set("sortOrder", sortOrder);
      params.set("limit", "100");

      const res = await fetch(`/api/invoices?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        const list = Array.isArray(data) ? data : (data.invoices || []);
        list.sort((a: any, b: any) => {
          if (
            typeof a.sequenceNumber === "number" &&
            typeof b.sequenceNumber === "number" &&
            a.sequenceNumber !== 0 &&
            b.sequenceNumber !== 0 &&
            a.sequenceNumber !== b.sequenceNumber
          ) {
            return sortOrder === "asc"
              ? a.sequenceNumber - b.sequenceNumber
              : b.sequenceNumber - a.sequenceNumber;
          }
          const comp = (a.number || "").localeCompare(b.number || "", undefined, {
            numeric: true,
            sensitivity: "base",
          });
          return sortOrder === "asc" ? comp : -comp;
        });
        setInvoices(list);
      }
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [search, typeFilter, statusFilter, sortOrder]);

  const handleCancelInvoice = async (id: string, number: string) => {
    if (
      !confirm(
        `Are you sure you want to CANCEL Bill #${number}? This will remove its amount from company account statements.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) {
        toast.success(`Bill #${number} cancelled`);
        fetchInvoices();
      } else {
        toast.error("Failed to cancel bill");
      }
    } catch (err) {
      toast.error("Error cancelling bill");
    }
  };

  const handleDeleteInvoice = async (id: string, number: string) => {
    if (
      !confirm(
        `Permanently DELETE Cancelled Bill #${number}? This action cannot be undone.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`Bill #${number} deleted permanently`);
        fetchInvoices();
      } else {
        toast.error("Failed to delete bill");
      }
    } catch (err) {
      toast.error("Error deleting bill");
    }
  };

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
            Filter, manage, record payments, cancel bills, and print Tax Invoices & Labour Bills
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
            <option value="">All Bill Types</option>
            <option value="tax_invoice">Tax Invoice (GST)</option>
            <option value="labour_bill">Labour Bill (Non-GST)</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white font-medium"
          >
            <option value="">All Bill Statuses</option>
            <option value="sent">Issued / Pending Payment</option>
            <option value="paid">Paid</option>
            <option value="draft">Drafts</option>
            <option value="cancelled">Cancelled Bills</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Loading invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">
              No bills found matching your criteria
            </p>
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#E11D48] text-white text-xs font-bold rounded-lg shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Bill</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-auto max-h-[calc(100vh-280px)] min-h-[350px]">
            <table className="w-full text-xs text-left min-w-[720px] border-separate border-spacing-0">
              <thead className="sticky top-0 z-10 bg-slate-100 text-[#0F172A] font-bold uppercase tracking-wider shadow-xs">
                <tr>
                  <th
                    onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
                    className="p-3 bg-slate-100 border-b border-slate-200 sticky top-0 z-10 cursor-pointer select-none hover:bg-slate-200/80 transition-colors group"
                    title={`Sort by Bill No. (Currently: ${sortOrder === "desc" ? "Descending / Newest first" : "Ascending / Oldest first"}) — Click to toggle`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Bill No.</span>
                      <span className="inline-flex items-center justify-center p-0.5 rounded bg-white border border-slate-300 group-hover:border-slate-400 shadow-2xs">
                        {sortOrder === "desc" ? (
                          <ArrowDown className="w-3.5 h-3.5 text-[#E11D48]" />
                        ) : (
                          <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
                        )}
                      </span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                          sortOrder === "desc"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {sortOrder === "desc" ? "DESC ↓" : "ASC ↑"}
                      </span>
                    </div>
                  </th>
                  <th className="py-3 px-3 bg-slate-100 border-b border-slate-200 sticky top-0 z-10">Type</th>
                  <th className="p-3 bg-slate-100 border-b border-slate-200 sticky top-0 z-10">Client Company</th>
                  <th className="p-3 bg-slate-100 border-b border-slate-200 sticky top-0 z-10">Date</th>
                  <th className="p-3 text-right bg-slate-100 border-b border-slate-200 sticky top-0 z-10">Grand Total (₹)</th>
                  <th className="p-3 text-right bg-slate-100 border-b border-slate-200 sticky top-0 z-10">Balance Due (₹)</th>
                  <th className="p-3 text-center bg-slate-100 border-b border-slate-200 sticky top-0 z-10">Status</th>
                  <th className="p-3 text-center bg-slate-100 border-b border-slate-200 sticky top-0 z-10">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {invoices.map((inv) => (
                  <tr
                    key={inv._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-[#0F172A]">
                      <Link
                        href={`/invoices/${inv._id}`}
                        className="hover:underline"
                      >
                        {inv.number}
                      </Link>
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
                      {inv.status === "cancelled" ? (
                        <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Ban className="w-3 h-3 text-rose-600" /> Cancelled
                        </span>
                      ) : inv.status === "paid" ? (
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
                      <div className="flex items-center justify-center gap-1.5">
                        {inv.status === "cancelled" ? (
                          <button
                            onClick={() =>
                              handleDeleteInvoice(inv._id, inv.number)
                            }
                            className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold flex items-center gap-1 text-[11px] shadow-2xs"
                            title="Permanently Delete Cancelled Bill"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        ) : (
                          <>
                            <Link
                              href={`/invoices/${inv._id}/edit`}
                              className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded font-semibold flex items-center gap-1 transition-colors text-[11px]"
                              title="Edit Bill Items"
                            >
                              <Pencil className="w-3 h-3" />
                              <span>Edit</span>
                            </Link>
                            <button
                              onClick={() =>
                                handleCancelInvoice(inv._id, inv.number)
                              }
                              className="px-2 py-1 bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded font-semibold flex items-center gap-1 transition-colors text-[11px]"
                              title="Cancel Bill"
                            >
                              <Ban className="w-3 h-3 text-rose-600" />
                              <span>Cancel</span>
                            </button>
                          </>
                        )}
                        <Link
                          href={`/invoices/${inv._id}`}
                          className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded font-semibold flex items-center gap-1 transition-colors text-[11px]"
                        >
                          <Eye className="w-3 h-3 text-blue-600" />
                          <span>View</span>
                        </Link>
                      </div>
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
