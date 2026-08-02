"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Plus,
  Trash2,
  Save,
  FileText,
  Check,
  AlertCircle,
  Eye,
} from "lucide-react";
import { CompanyPicker } from "@/components/companies/CompanyPicker";
import { QuotationPreview } from "./QuotationPreview";

interface QuotationLineItem {
  description: string;
  quantity: string;
  rate: number;
  amount: number;
}

interface QuotationFormProps {
  initialValues?: any;
}

export function QuotationForm({ initialValues }: QuotationFormProps) {
  const router = useRouter();

  const [selectedCompany, setSelectedCompany] = useState<any | null>(
    initialValues?.companySnapshot
      ? { ...initialValues.companySnapshot, _id: initialValues.companyId }
      : null,
  );

  const [number, setNumber] = useState(initialValues?.number || "");
  const [date, setDate] = useState(
    initialValues?.date
      ? new Date(initialValues.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  );

  const [recipientTitle, setRecipientTitle] = useState(
    initialValues?.recipientTitle || "The Purchase Manager",
  );
  const [subject, setSubject] = useState(
    initialValues?.subject || "Sub : Rate Quotation Reg.",
  );

  const [items, setItems] = useState<QuotationLineItem[]>(
    initialValues?.items || [
      {
        description: "",
        quantity: "",
        rate: 0,
        amount: 0,
      },
    ],
  );

  const [taxNote, setTaxNote] = useState(
    initialValues?.taxNote || "GST TAX 18% EXTRA",
  );
  const [notes, setNotes] = useState(initialValues?.notes || "");

  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleItemChange = (
    index: number,
    field: keyof QuotationLineItem,
    value: any,
  ) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };

    if (field === "quantity" || field === "rate") {
      const qStr = field === "quantity" ? value : item.quantity;
      const qNum = parseFloat(qStr) || 1;
      const rNum = field === "rate" ? parseFloat(value) || 0 : item.rate;
      item.amount = Math.round(qNum * rNum * 100) / 100;
    }

    updated[index] = item;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { description: "", quantity: "1 PAD", rate: 0, amount: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const grandTotal = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) {
      const msg = "Please select or create a client company first.";
      setError(msg);
      toast.error(msg);
      return;
    }
    if (items.length === 0 || items.some((i) => !i.description.trim())) {
      const msg = "Please ensure all line items have a description.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        number,
        date,
        companyId: selectedCompany._id || initialValues?.companyId,
        recipientTitle,
        subject,
        items: items.map((i) => ({
          ...i,
          rate: Number(i.rate) || 0,
          amount: Number(i.amount) || 0,
        })),
        subtotal: grandTotal,
        taxNote,
        grandTotal,
        notes,
      };

      const isEditing = Boolean(initialValues?._id);
      const url = isEditing
        ? `/api/quotations/${initialValues._id}`
        : "/api/quotations";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to save quotation");
      }

      toast.success(
        isEditing
          ? "Quotation updated successfully!"
          : "Quotation created successfully!",
      );
      router.push(`/quotations/${result._id}`);
      router.refresh();
    } catch (err: any) {
      const msg = err.message || "Failed to save quotation";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mobile Toggle */}
      <div className="lg:hidden flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <span className="text-xs font-semibold text-slate-700">
          Mode: {showPreviewMobile ? "Live Paper Preview" : "Form Entry"}
        </span>
        <button
          type="button"
          onClick={() => setShowPreviewMobile(!showPreviewMobile)}
          className="px-3 py-1.5 bg-[#0F172A] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
        >
          <Eye className="w-4 h-4 text-blue-400" />
          <span>{showPreviewMobile ? "Edit Form" : "View Paper Preview"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Entry */}
        <form
          onSubmit={handleSubmit}
          className={`lg:col-span-6 space-y-6 ${
            showPreviewMobile ? "hidden lg:block" : "block"
          }`}
        >
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Client Selection */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#0F172A] border-b border-slate-100 pb-2">
              1. Recipient Company Selection
            </h3>
            <CompanyPicker
              selectedCompanyId={selectedCompany?._id}
              onSelectCompany={(c) => setSelectedCompany(c)}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Recipient Title / Attention
              </label>
              <input
                type="text"
                value={recipientTitle}
                onChange={(e) => setRecipientTitle(e.target.value)}
                placeholder="e.g. The Purchase Manager"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              />
            </div>
          </div>

          {/* 2. Quotation Header Info */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#0F172A] border-b border-slate-100 pb-2">
              2. Quotation Details & Date
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Quotation Number{" "}
                  <span className="text-slate-400 font-normal">
                    (Auto-generated if empty)
                  </span>
                </label>
                <input
                  type="text"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="e.g. QT/26-27/0001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-[#0F172A] bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Quotation Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Sub : Rate Quotation"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-serif font-bold text-[#0F172A]"
              />
            </div>
          </div>

          {/* 3. Items Table */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-serif font-bold text-base text-[#0F172A]">
                3. Particulars & Item Rates
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 relative"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase text-slate-500">
                      Item #{index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Delete item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Particulars / Printing job description..."
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(index, "description", e.target.value)
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm bg-white uppercase font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Quantity / Unit
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 5 PAD / 10 NOS."
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", e.target.value)
                        }
                        className="w-full px-2 py-1 border border-slate-300 rounded font-mono bg-white uppercase text-center font-bold text-[#0F172A]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Rate Per Pcs (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.rate}
                        onChange={(e) =>
                          handleItemChange(index, "rate", e.target.value)
                        }
                        className="w-full px-2 py-1 border border-slate-300 rounded font-mono bg-white text-right"
                      />
                    </div>

                    <div className="font-semibold text-right pt-1">
                      <span className="text-[10px] text-slate-500 block">
                        Amount Rs:
                      </span>
                      <span className="font-mono text-sm text-[#0F172A]">
                        ₹
                        {item.amount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Item Row</span>
            </button>
          </div>

          {/* 4. Tax Badge Note */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#0F172A] border-b border-slate-100 pb-2">
              4. Tax Note & Instructions
            </h3>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                GST Tax Note Badge
              </label>
              <input
                type="text"
                value={taxNote}
                onChange={(e) => setTaxNote(e.target.value.toUpperCase())}
                placeholder="GST TAX 18% EXTRA"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold uppercase tracking-wider bg-slate-900 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Additional Quotation Notes / Delivery Terms
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional terms, validity date, or delivery details..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-bold text-white bg-[#0F172A] hover:bg-slate-800 rounded-lg shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Save className="w-4 h-4 text-blue-400" />
                  <span>
                    {initialValues?._id ? "Update Quotation" : "Save Quotation"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Column: Live Paper Replica Preview */}
        <div
          className={`lg:col-span-6 lg:sticky lg:top-8 ${
            showPreviewMobile ? "block" : "hidden lg:block"
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-serif font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Live Printed Quotation Replica</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Auto-updating as you type
            </span>
          </div>

          <QuotationPreview
            number={number}
            date={date}
            company={selectedCompany}
            recipientTitle={recipientTitle}
            subject={subject}
            items={items}
            subtotal={grandTotal}
            taxNote={taxNote}
            grandTotal={grandTotal}
            notes={notes}
          />
        </div>
      </div>
    </div>
  );
}
