"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Eye,
  Pencil,
  ArrowRightLeft,
  Trash2,
} from "lucide-react";

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/quotations?${params.toString()}`);
      const data = await res.json();
      if (res.ok && data.quotations) {
        setQuotations(data.quotations);
      }
    } catch (err) {
      console.error("Failed to load quotations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [search, statusFilter]);

  const handleConvert = async (id: string, qNumber: string) => {
    if (!confirm(`Convert Quotation ${qNumber} into an official Tax Invoice / Labour Bill?`)) return;

    setConvertingId(id);
    try {
      const res = await fetch(`/api/quotations/${id}/convert`, {
        method: "POST",
      });
      const invoice = await res.json();
      if (!res.ok) throw new Error(invoice.error || "Failed to convert quotation");

      toast.success(`Quotation converted to Bill ${invoice.number}!`);
      fetchQuotations();
    } catch (err: any) {
      toast.error(err.message || "Failed to convert quotation");
    } finally {
      setConvertingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quotation?")) return;
    try {
      const res = await fetch(`/api/quotations/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Quotation deleted");
        fetchQuotations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            <span>Rate Quotations</span>
          </h1>
          <p className="text-xs text-slate-500">
            Create, manage, print rate quotations, and convert approved quotes into bills
          </p>
        </div>

        <Link
          href="/quotations/new"
          className="px-4 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-blue-400" />
          <span>Create Rate Quotation</span>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Quotation No, Company name, or Item..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white font-medium"
          >
            <option value="">All Quotation Statuses</option>
            <option value="draft">Drafts</option>
            <option value="sent">Sent to Client</option>
            <option value="converted">Converted to Bill</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading rate quotations...</div>
        ) : quotations.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">No rate quotations created yet</p>
            <Link
              href="/quotations/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white text-xs font-bold rounded-lg shadow"
            >
              <Plus className="w-4 h-4 text-blue-400" />
              <span>Create First Quotation</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[640px]">
              <thead className="bg-slate-100 text-[#0F172A] font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Quotation No.</th>
                  <th className="p-3">Client Company</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Total Amount (₹)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map((q) => (
                  <tr key={q._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#0F172A]">
                      <Link href={`/quotations/${q._id}`} className="hover:underline">
                        {q.number}
                      </Link>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      {q.companySnapshot?.name || "N/A"}
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {new Date(q.date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="p-3 font-mono font-bold text-right text-[#0F172A]">
                      ₹{q.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      {q.status === "converted" ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                          Converted to Invoice
                        </span>
                      ) : q.status === "sent" ? (
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          Sent
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {q.status !== "converted" && (
                          <button
                            onClick={() => handleConvert(q._id, q.number)}
                            disabled={convertingId === q._id}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded font-semibold flex items-center gap-1 transition-colors"
                            title="Convert into Bill"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>{convertingId === q._id ? "Converting..." : "Convert to Bill"}</span>
                          </button>
                        )}
                        <Link
                          href={`/quotations/${q._id}/edit`}
                          className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded font-semibold flex items-center gap-1 transition-colors"
                          title="Edit Quotation"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </Link>
                        <Link
                          href={`/quotations/${q._id}`}
                          className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded font-semibold flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3 text-blue-600" />
                          <span>View & Print</span>
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
