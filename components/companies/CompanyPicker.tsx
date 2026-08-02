"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Building2, Check, X } from "lucide-react";
import { CompanyForm } from "./CompanyForm";

interface CompanyPickerProps {
  selectedCompanyId?: string;
  onSelectCompany: (company: any) => void;
}

export function CompanyPicker({
  selectedCompanyId,
  onSelectCompany,
}: CompanyPickerProps) {
  const [companies, setCompanies] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);

  const fetchCompanies = async (query = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/companies?search=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      if (res.ok && data.companies) {
        setCompanies(data.companies);
        if (selectedCompanyId && !selectedCompany) {
          const match = data.companies.find((c: any) => c._id === selectedCompanyId);
          if (match) setSelectedCompany(match);
        }
      }
    } catch (err) {
      console.error("Failed to fetch companies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies(search);
  }, [search]);

  const handleSelect = (company: any) => {
    setSelectedCompany(company);
    onSelectCompany(company);
  };

  const handleCreateSuccess = (newCompany: any) => {
    setShowFormModal(false);
    handleSelect(newCompany);
    fetchCompanies("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Select Client Company <span className="text-rose-500">*</span>
        </label>
        <button
          type="button"
          onClick={() => setShowFormModal(true)}
          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Company</span>
        </button>
      </div>

      {selectedCompany ? (
        <div className="p-3 bg-slate-50 border-2 border-[#0F172A] rounded-xl flex items-start justify-between shadow-2xs">
          <div className="flex gap-3 items-start">
            <div className="p-2 bg-[#0F172A] text-white rounded-lg mt-0.5">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-[#0F172A]">
                  {selectedCompany.name}
                </h4>
                {selectedCompany.gstin ? (
                  <span className="bg-[#0F172A] text-white text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold">
                    GSTIN: {selectedCompany.gstin}
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-900 text-[10px] uppercase px-2 py-0.5 rounded font-semibold">
                    No GSTIN (Labour Bill)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">{selectedCompany.address}</p>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Ph: {selectedCompany.phone} | State: {selectedCompany.state} ({selectedCompany.stateCode})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCompany(null);
              onSelectCompany(null);
            }}
            className="text-slate-400 hover:text-rose-600 p-1 rounded-md"
            title="Change company"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company by name or GSTIN..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            />
          </div>

          <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
            {loading && companies.length === 0 ? (
              <div className="p-3 text-xs text-slate-500 text-center">Loading companies...</div>
            ) : companies.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-500 mb-2">No companies found</p>
                <button
                  type="button"
                  onClick={() => setShowFormModal(true)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create &quot;{search || "New Company"}&quot;</span>
                </button>
              </div>
            ) : (
              companies.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className="w-full text-left p-3 hover:bg-slate-50 flex items-center justify-between transition-colors group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#0F172A] group-hover:text-blue-600">
                        {c.name}
                      </span>
                      {c.gstin && (
                        <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded">
                          {c.gstin}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate max-w-md">{c.address}</p>
                  </div>
                  <span className="text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 flex items-center gap-1">
                    Select <Check className="w-3.5 h-3.5" />
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal for creating new company */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-serif font-bold text-[#0F172A] flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>Add Client Company</span>
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <CompanyForm
              initialValues={{ name: search }}
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowFormModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
