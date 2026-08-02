"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertCircle,
  NotebookTabs,
} from "lucide-react";
import { CompanyForm } from "@/components/companies/CompanyForm";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = async (query = "") => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/companies?search=${encodeURIComponent(query)}&limit=100`,
      );
      const data = await res.json();
      if (res.ok && data.companies) {
        setCompanies(data.companies);
      }
    } catch (err) {
      console.error("Failed to load companies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies(search);
  }, [search]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    setError(null);
    try {
      const res = await fetch(`/api/companies/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete company");
      }
      fetchCompanies(search);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFormSuccess = () => {
    setShowModal(false);
    setEditingCompany(null);
    fetchCompanies(search);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            <span>Client Companies Directory</span>
          </h1>
          <p className="text-xs text-slate-500">
            Manage GST registered clients and non-GST labour clients
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCompany(null);
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-blue-400" />
          <span>Add New Company</span>
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by company name, GSTIN, or phone..."
          className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Companies List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">
            Loading companies...
          </div>
        ) : companies.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">
              No client companies found
            </p>
            <button
              onClick={() => {
                setEditingCompany(null);
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white text-xs font-bold rounded-lg shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Company</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-[#0F172A] font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3">Company Name</th>
                  <th className="p-3">GSTIN</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">State</th>
                  <th className="p-3">Default Bill Type</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {companies.map((company) => (
                  <tr
                    key={company._id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-3">
                      <Link
                        href={`/companies/${company._id}`}
                        className="font-bold text-sm text-[#0F172A] hover:text-blue-600 hover:underline"
                      >
                        {company.name}
                      </Link>
                      <p className="text-[11px] text-slate-500 truncate max-w-xs">
                        {company.address}
                      </p>
                    </td>
                    <td className="p-3 font-mono font-semibold">
                      {company.gstin ? (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px]">
                          {company.gstin}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-slate-700">
                      {company.phone}
                    </td>
                    <td className="p-3 font-mono text-slate-600">
                      {company.state} ({company.stateCode})
                    </td>
                    <td className="p-3">
                      {company.gstRegistered ? (
                        <span className="bg-[#0F172A] text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                          Tax Invoice
                        </span>
                      ) : (
                        <span className="bg-[#E11D48] text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                          Labour Bill
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center flex items-center gap-2">
                      <Link
                        href={`/companies/${company._id}`}
                        className="text-blue-600 hover:text-blue-800 font-semibold text-[11px]"
                        title="View Company Ledger & Statements"
                      >
                        <NotebookTabs className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => {
                          setEditingCompany(company);
                          setShowModal(true);
                        }}
                        className="text-slate-600 hover:text-blue-600 p-1"
                        title="Edit company"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(company._id, company.name)}
                        className="text-rose-600 hover:text-rose-800 p-1"
                        title="Delete company"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Creating / Editing Company */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-serif font-bold text-[#0F172A] flex items-center gap-2 border-b border-slate-100 pb-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>{editingCompany ? "Edit Company" : "Add New Company"}</span>
            </h3>
            <CompanyForm
              initialValues={editingCompany || undefined}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowModal(false);
                setEditingCompany(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
