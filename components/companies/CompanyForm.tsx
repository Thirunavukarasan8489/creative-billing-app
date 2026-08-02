"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Building2, X, Check, AlertCircle } from "lucide-react";
import { CompanyInput, companySchema } from "@/lib/validation/company";

interface CompanyFormProps {
  initialValues?: Partial<CompanyInput> & { _id?: string };
  onSuccess: (company: any) => void;
  onCancel?: () => void;
}

export function CompanyForm({ initialValues, onSuccess, onCancel }: CompanyFormProps) {
  const [formData, setFormData] = useState<CompanyInput>({
    name: initialValues?.name || "",
    address: initialValues?.address || "",
    phone: initialValues?.phone || "",
    email: initialValues?.email || "",
    gstin: initialValues?.gstin || "",
    state: initialValues?.state || "Tamil Nadu",
    stateCode: initialValues?.stateCode || "33",
    gstRegistered: initialValues?.gstRegistered ?? Boolean(initialValues?.gstin),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(initialValues?._id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const parsed = companySchema.parse(formData);
      const url = isEditing
        ? `/api/companies/${initialValues!._id}`
        : "/api/companies";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to save company");
      }

      toast.success(isEditing ? "Company details updated!" : "Company created successfully!");
      onSuccess(result);
    } catch (err: any) {
      let msg = err.message || "Failed to save company";
      if (err.errors && Array.isArray(err.errors)) {
        msg = err.errors.map((e: any) => e.message).join(", ");
      }
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGstinChange = (val: string) => {
    const uppercaseVal = val.toUpperCase();
    const isGst = uppercaseVal.trim().length > 0;
    setFormData((prev) => ({
      ...prev,
      gstin: uppercaseVal,
      gstRegistered: isGst,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
          Company Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Sri Garments Pvt Ltd"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-[#0F172A]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            GSTIN <span className="text-slate-400 font-normal">(Optional for Labour Bill)</span>
          </label>
          <input
            type="text"
            value={formData.gstin || ""}
            onChange={(e) => handleGstinChange(e.target.value)}
            placeholder="e.g. 33AAAAA0000A1Z5"
            maxLength={15}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none bg-white text-[#0F172A] uppercase"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Phone Number <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="e.g. 9842100000"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-[#0F172A]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
          Address <span className="text-rose-500">*</span>
        </label>
        <textarea
          required
          rows={2}
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Street, City, Postal Code"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-[#0F172A]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email || ""}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="billing@company.com"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-[#0F172A]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            State
          </label>
          <input
            type="text"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-[#0F172A]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            State Code
          </label>
          <input
            type="text"
            value={formData.stateCode}
            onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-[#0F172A]"
          />
        </div>
      </div>

      {formData.gstin ? (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 font-medium flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>GSTIN detected: Default bill type will be <strong>Tax Invoice</strong>.</span>
        </div>
      ) : (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900 font-medium">
          <span>No GSTIN provided: Default bill type will be <strong>Labour Bill</strong>.</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-sm font-semibold text-white bg-[#0F172A] hover:bg-slate-800 rounded-lg shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <span>Saving...</span>
          ) : (
            <>
              <Check className="w-4 h-4 text-blue-400" />
              <span>{isEditing ? "Update Company" : "Save Company"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
