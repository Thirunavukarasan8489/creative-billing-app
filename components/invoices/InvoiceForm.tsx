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
import { BillTypeToggle } from "./BillTypeToggle";
import { InvoicePreview } from "./InvoicePreview";
import { numberToWords } from "@/lib/numberToWords";

interface LineItem {
  description: string;
  hsnSac: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceFormProps {
  initialValues?: any;
}

export function InvoiceForm({ initialValues }: InvoiceFormProps) {
  const router = useRouter();

  const getCompanyIdString = (val: any): string => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") {
      const id = val._id || val.id;
      if (id) return typeof id === "string" ? id : String(id);
    }
    return String(val);
  };

  const [selectedCompany, setSelectedCompany] = useState<any | null>(
    initialValues?.companySnapshot
      ? {
          ...initialValues.companySnapshot,
          _id: getCompanyIdString(initialValues.companyId),
        }
      : null,
  );

  const [type, setType] = useState<"tax_invoice" | "labour_bill">(
    initialValues?.type || "tax_invoice",
  );
  const [autoSuggested, setAutoSuggested] = useState(false);

  const [invoiceNumber, setInvoiceNumber] = useState(
    initialValues?.number || "",
  );
  const [date, setDate] = useState(
    initialValues?.date
      ? new Date(initialValues.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  );

  const [poNumber, setPoNumber] = useState<string>(initialValues?.poNumber || "");
  const [poDate, setPoDate] = useState<string>(
    initialValues?.poDate
      ? new Date(initialValues.poDate).toISOString().split("T")[0]
      : "",
  );
  const [quoteNumber, setQuoteNumber] = useState<string>(
    initialValues?.quoteNumber || "",
  );
  const [quoteDate, setQuoteDate] = useState<string>(
    initialValues?.quoteDate
      ? new Date(initialValues.quoteDate).toISOString().split("T")[0]
      : "",
  );

  const [items, setItems] = useState<LineItem[]>(
    initialValues?.items || [
      {
        description: "",
        hsnSac: "4820",
        quantity: 0,
        rate: 0,
        amount: 0,
      },
    ],
  );

  const [cgstPercent, setCgstPercent] = useState<number>(
    initialValues?.cgstPercent ?? 9,
  );
  const [sgstPercent, setSgstPercent] = useState<number>(
    initialValues?.sgstPercent ?? 9,
  );
  const [notes, setNotes] = useState(initialValues?.notes || "");
  const [status, setStatus] = useState<"draft" | "sent" | "paid">(
    initialValues?.status || "draft",
  );

  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-suggest bill type when company is selected
  const handleSelectCompany = (company: any) => {
    setSelectedCompany(company);
    if (company) {
      if (company.gstin && company.gstin.trim().length > 0) {
        setType("tax_invoice");
        setAutoSuggested(true);
      } else {
        setType("labour_bill");
        setAutoSuggested(true);
      }
    }
  };

  // Fetch next invoice number when type or date changes
  useEffect(() => {
    if (!initialValues?._id) {
      const fetchNextNumber = async () => {
        try {
          const res = await fetch(
            `/api/invoices/next-number?type=${type}&date=${date}`,
          );
          const data = await res.json();
          if (res.ok && data.number) {
            setInvoiceNumber(data.number);
          }
        } catch (err) {
          console.error("Failed to fetch next number:", err);
        }
      };
      fetchNextNumber();
    }
  }, [type, date, initialValues]);

  // Handle line item updates with numeric coercion
  const handleItemChange = (
    index: number,
    field: keyof LineItem,
    value: any,
  ) => {
    const updated = [...items];
    const isNumeric =
      field === "quantity" || field === "rate" || field === "amount";
    const val = isNumeric ? parseFloat(value) || 0 : value;

    const item = { ...updated[index], [field]: val };

    if (field === "quantity" || field === "rate") {
      const q = field === "quantity" ? parseFloat(value) || 0 : item.quantity;
      const r = field === "rate" ? parseFloat(value) || 0 : item.rate;
      item.amount = Math.round(q * r * 100) / 100;
    }

    updated[index] = item;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        description: "",
        hsnSac: type === "tax_invoice" ? "4820" : "",
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Live Math Calculations
  const subtotal = items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const isTaxInvoice = type === "tax_invoice";

  const cgstAmount = isTaxInvoice
    ? Math.round(((subtotal * Number(cgstPercent)) / 100) * 100) / 100
    : 0;
  const sgstAmount = isTaxInvoice
    ? Math.round(((subtotal * Number(sgstPercent)) / 100) * 100) / 100
    : 0;

  const rawTotal = subtotal + cgstAmount + sgstAmount;
  const grandTotal = Math.round(rawTotal);
  const roundOff = Math.round((grandTotal - rawTotal) * 100) / 100;
  const amountInWords = numberToWords(grandTotal);

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
        type,
        number: invoiceNumber,
        date,
        poNumber: poNumber.trim(),
        poDate: poDate || null,
        quoteNumber: quoteNumber.trim(),
        quoteDate: quoteDate || null,
        companyId: getCompanyIdString(
          selectedCompany?._id ||
            selectedCompany?.id ||
            initialValues?.companyId,
        ),
        items: items.map((i) => ({
          ...i,
          quantity: Number(i.quantity) || 0,
          rate: Number(i.rate) || 0,
          amount: Number(i.amount) || 0,
        })),
        subtotal: Number(subtotal),
        cgstPercent: isTaxInvoice ? Number(cgstPercent) : 0,
        cgstAmount: Number(cgstAmount),
        sgstPercent: isTaxInvoice ? Number(sgstPercent) : 0,
        sgstAmount: Number(sgstAmount),
        roundOff: Number(roundOff),
        grandTotal: Number(grandTotal),
        amountInWords,
        status,
        notes,
      };

      const isEditing = Boolean(initialValues?._id);
      const url = isEditing
        ? `/api/invoices/${initialValues._id}`
        : "/api/invoices";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        if (result.details && result.details.fieldErrors) {
          const fieldMsgs = Object.entries(result.details.fieldErrors)
            .map(
              ([field, msgs]: [string, any]) => `${field}: ${msgs.join(", ")}`,
            )
            .join(" | ");
          throw new Error(`Validation failed — ${fieldMsgs}`);
        }
        throw new Error(result.error || "Failed to save invoice");
      }

      toast.success(
        isEditing
          ? "Bill updated successfully!"
          : "Bill saved & issued successfully!",
      );
      router.push(`/invoices/${result._id}`);
      router.refresh();
    } catch (err: any) {
      const msg = err.message || "Failed to save invoice";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mobile Toggle for Live Preview */}
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
        {/* Left Column: Interactive Form */}
        <form
          onSubmit={handleSubmit}
          className={`lg:col-span-6 space-y-6 ${showPreviewMobile ? "hidden lg:block" : "block"}`}
        >
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Pick / Create Company */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#0F172A] border-b border-slate-100 pb-2">
              1. Client Company Selection
            </h3>
            <CompanyPicker
              selectedCompanyId={selectedCompany?._id}
              onSelectCompany={handleSelectCompany}
            />
          </div>

          {/* 2. Bill Type & Numbering */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#0F172A] border-b border-slate-100 pb-2">
              2. Invoice Details & Type
            </h3>
            <BillTypeToggle
              type={type}
              onChange={(newType) => {
                setType(newType);
                setAutoSuggested(false);
              }}
              autoSuggested={autoSuggested}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Invoice Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-[#0F172A] bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Invoice Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Quote Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. QT/26-27/0001 (Optional)"
                  value={quoteNumber}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-[#0F172A] bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Quote Date (Optional)
                </label>
                <input
                  type="date"
                  value={quoteDate}
                  onChange={(e) => setQuoteDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  P.O. Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO-98214 (Optional)"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-[#0F172A] bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  P.O. Issue Date (Optional)
                </label>
                <input
                  type="date"
                  value={poDate}
                  onChange={(e) => setPoDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* 3. Particulars & Line Items */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-serif font-bold text-base text-[#0F172A]">
                3. Particulars / Job Items
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
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 relative group"
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
                      className="w-full px-3 py-1.5 border border-slate-300 rounded text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {isTaxInvoice && (
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                          HSN/SAC
                        </label>
                        <input
                          type="text"
                          value={item.hsnSac || ""}
                          onChange={(e) =>
                            handleItemChange(index, "hsnSac", e.target.value)
                          }
                          placeholder="4820"
                          className="w-full px-2 py-1 border border-slate-300 rounded font-mono bg-white"
                        />
                      </div>
                    )}
                    <div className={isTaxInvoice ? "" : "col-span-1"}>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0"
                        value={item.quantity === 0 ? "" : item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", e.target.value)
                        }
                        className="w-full px-2 py-1 border border-slate-300 rounded font-mono bg-white text-right focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div className={isTaxInvoice ? "" : "col-span-1"}>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Rate (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0"
                        value={item.rate === 0 ? "" : item.rate}
                        onChange={(e) =>
                          handleItemChange(index, "rate", e.target.value)
                        }
                        className="w-full px-2 py-1 border border-slate-300 rounded font-mono bg-white text-right focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div
                      className={
                        isTaxInvoice
                          ? "col-span-3 font-semibold text-right pt-1"
                          : "col-span-1 font-semibold text-right pt-1"
                      }
                    >
                      <span className="text-[10px] text-slate-500 block">
                        Amount:
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
              <span>Add Another Particular Row</span>
            </button>
          </div>

          {/* 4. GST & Status Options */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#0F172A] border-b border-slate-100 pb-2">
              4. GST Rates & Status
            </h3>

            {isTaxInvoice ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    CGST Rate (%)
                  </label>
                  <input
                    type="number"
                    value={cgstPercent}
                    onChange={(e) =>
                      setCgstPercent(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                    SGST Rate (%)
                  </label>
                  <input
                    type="number"
                    value={sgstPercent}
                    onChange={(e) =>
                      setSgstPercent(parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono bg-white"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded border border-slate-200">
                Labour Bills are non-GST documents. CGST & SGST are omitted
                automatically.
              </p>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Invoice Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
              >
                <option value="draft">Draft (Unsaved/Working)</option>
                <option value="sent">Issued / Pending Payment</option>
                <option value="paid">Paid (Fully Cleared)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Notes / Terms
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional billing instructions or job notes..."
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
                <span>Saving Invoice...</span>
              ) : (
                <>
                  <Save className="w-4 h-4 text-blue-400" />
                  <span>
                    {initialValues?._id ? "Update Bill" : "Save & Issue Bill"}
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
              <span>Live Printed Bill Replica</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Auto-updating as you type
            </span>
          </div>

          <InvoicePreview
            type={type}
            number={invoiceNumber}
            date={date}
            poNumber={poNumber}
            poDate={poDate}
            quoteNumber={quoteNumber}
            quoteDate={quoteDate}
            company={selectedCompany}
            items={items}
            subtotal={subtotal}
            cgstPercent={cgstPercent}
            cgstAmount={cgstAmount}
            sgstPercent={sgstPercent}
            sgstAmount={sgstAmount}
            roundOff={roundOff}
            grandTotal={grandTotal}
            amountInWords={amountInWords}
            notes={notes}
          />
        </div>
      </div>
    </div>
  );
}
