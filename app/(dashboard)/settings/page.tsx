"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Settings, Save, Check, AlertCircle, Building2, CreditCard, FileText, Eye } from "lucide-react";

export default function SettingsPage() {
  const [formData, setFormData] = useState({
    name: "CREATIVE LINE GRAPHICS",
    tagline: "OFFSET & DIGITAL PRINTING PRESS",
    address: "12, Printing Press Colony, Main Road, Tiruppur - 641601, Tamil Nadu.",
    phone: "+91 98421 00000",
    email: "creativeline.tpr@gmail.com",
    gstin: "33AAAAA0000A1Z5",
    state: "Tamil Nadu",
    stateCode: "33",
    bankName: "Union Bank of India",
    accountNo: "510101001234567",
    ifscCode: "UBIN0551015",
    branchName: "Main Branch, Tiruppur",
    terms: "Labour bill for printing work rendered. Payment due within 15 days of invoice date.",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      if (res.ok && data) {
        setFormData({
          name: data.name || "CREATIVE LINE GRAPHICS",
          tagline: data.tagline || "OFFSET & DIGITAL PRINTING PRESS",
          address: data.address || "",
          phone: data.phone || "",
          email: data.email || "",
          gstin: data.gstin || "",
          state: data.state || "Tamil Nadu",
          stateCode: data.stateCode || "33",
          bankName: data.bankName || "",
          accountNo: data.accountNo || "",
          ifscCode: data.ifscCode || "",
          branchName: data.branchName || "",
          terms: data.terms || "",
        });
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update settings");

      const msg = "Press company settings & bank details saved successfully!";
      setSuccessMsg(msg);
      toast.success(msg);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      const msg = err.message || "Failed to update settings";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-600" />
            <span>Creative Line Graphics Settings</span>
          </h1>
          <p className="text-xs text-slate-500">
            Edit your printing press details, address, GSTIN, and bank account for Tax Invoices
          </p>
        </div>

        <button
          form="settings-form"
          type="submit"
          disabled={saving || loading}
          className="px-5 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4 text-blue-400" />
          <span>{saving ? "Saving..." : "Save Settings"}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading settings...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Settings Form */}
          <form
            id="settings-form"
            onSubmit={handleSubmit}
            className="lg:col-span-7 space-y-6"
          >
            {/* 1. Printing Press Business Profile */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-serif font-bold text-base text-[#0F172A] border-b border-slate-100 pb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>1. Printing Press Business Profile</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Company / Press Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-serif font-bold text-[#0F172A] focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Business Tagline / Subtitle
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="OFFSET & DIGITAL PRINTING PRESS"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Press Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Phone / Contact Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 2. Tax & State Information */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-serif font-bold text-base text-[#0F172A] border-b border-slate-100 pb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>2. GST & State Registration</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Press GSTIN
                  </label>
                  <input
                    type="text"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 3. Bank Account Details (Tax Invoice Footer) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-serif font-bold text-base text-[#0F172A] border-b border-slate-100 pb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span>3. Bank Details for Tax Invoice Footer</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="Union Bank of India"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.accountNo}
                    onChange={(e) => setFormData({ ...formData, accountNo: e.target.value })}
                    placeholder="510101001234567"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                    placeholder="UBIN0551015"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={formData.branchName}
                    onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                    placeholder="Main Branch, Tiruppur"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 4. Terms & Conditions */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-serif font-bold text-base text-[#0F172A] border-b border-slate-100 pb-2">
                4. Default Labour Bill Terms
              </h3>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Labour Bill Footer Terms
                </label>
                <textarea
                  rows={2}
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-blue-400" />
                <span>{saving ? "Saving..." : "Save Settings"}</span>
              </button>
            </div>
          </form>

          {/* Right Column: Live Letterhead Header Preview */}
          <div className="lg:col-span-5 lg:sticky lg:top-8 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>Live Letterhead Header Preview</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Updates live</span>
            </div>

            {/* Live Paper Letterhead Box */}
            <div className="bg-white border-2 border-[#0F172A] rounded-xl p-5 shadow-md space-y-4">
              <div className="border-b border-slate-200 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="font-serif text-xl font-black text-[#E11D48]">
                    {formData.name || "CREATIVE LINE GRAPHICS"}
                  </h2>
                  <p className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider mt-0.5">
                    {formData.tagline || "OFFSET & DIGITAL PRINTING PRESS"}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 max-w-xs">{formData.address}</p>
                  <p className="text-xs text-slate-600 font-mono mt-0.5">
                    Ph: {formData.phone} | {formData.email}
                  </p>
                </div>

                <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-300 text-right text-[10px]">
                  <p className="font-bold text-slate-700">
                    GSTIN: <span className="font-mono text-xs text-[#0F172A]">{formData.gstin || "N/A"}</span>
                  </p>
                  <p className="font-bold text-slate-700 mt-1">
                    State Code: <span className="font-mono text-xs text-[#0F172A]">{formData.stateCode} ({formData.state})</span>
                  </p>
                </div>
              </div>

              {/* Bank Details Preview Box */}
              <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                <h4 className="font-bold text-[10px] uppercase tracking-wider text-[#0F172A] mb-1">
                  Bank Details Preview (Tax Invoice Footer):
                </h4>
                <p className="font-semibold text-slate-800">{formData.bankName || "Bank Name"}</p>
                <p className="font-mono text-slate-600">A/C No: {formData.accountNo || "XXXXXXXXXXXX"}</p>
                <p className="font-mono text-slate-600">IFSC: {formData.ifscCode || "XXXX000000"}</p>
                <p className="text-slate-600">Branch: {formData.branchName || "Branch"}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
