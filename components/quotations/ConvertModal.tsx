"use client";

import { useState } from "react";
import { ArrowRightLeft, CheckCircle2, FileText, X, ShieldAlert } from "lucide-react";

interface ConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (billType: "tax_invoice" | "labour_bill") => Promise<void>;
  quotationNumber: string;
  companyName: string;
  hasGstin: boolean;
  subtotal: number;
  converting: boolean;
}

export function ConvertModal({
  isOpen,
  onClose,
  onConfirm,
  quotationNumber,
  companyName,
  hasGstin,
  subtotal,
  converting,
}: ConvertModalProps) {
  const [selectedType, setSelectedType] = useState<"tax_invoice" | "labour_bill">(
    hasGstin ? "tax_invoice" : "labour_bill"
  );

  if (!isOpen) return null;

  const isTaxInvoice = selectedType === "tax_invoice";
  const cgstAmount = isTaxInvoice ? Math.round(((subtotal * 9) / 100) * 100) / 100 : 0;
  const sgstAmount = isTaxInvoice ? Math.round(((subtotal * 9) / 100) * 100) / 100 : 0;
  const rawTotal = subtotal + cgstAmount + sgstAmount;
  const grandTotal = Math.round(rawTotal);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(selectedType);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden text-slate-900">
        {/* Header */}
        <div className="bg-[#0F172A] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base tracking-wide">
                Convert Quotation to Bill
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Quote #{quotationNumber} • {companyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={converting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Document Type to Generate:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tax Invoice Option */}
              <div
                onClick={() => setSelectedType("tax_invoice")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedType === "tax_invoice"
                    ? "border-blue-600 bg-blue-50/50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-[#0F172A]">Tax Invoice</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedType === "tax_invoice"
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-300"
                    }`}
                  >
                    {selectedType === "tax_invoice" && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Includes GSTIN, HSN codes, CGST 9% + SGST 9% tax breakdown.
                </p>
                {hasGstin && (
                  <span className="mt-2 inline-block text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    Client Has GSTIN
                  </span>
                )}
              </div>

              {/* Labour Bill Option */}
              <div
                onClick={() => setSelectedType("labour_bill")}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedType === "labour_bill"
                    ? "border-rose-600 bg-rose-50/50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-[#0F172A]">Labour Bill</span>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      selectedType === "labour_bill"
                        ? "border-rose-600 bg-rose-600 text-white"
                        : "border-slate-300"
                    }`}
                  >
                    {selectedType === "labour_bill" && <CheckCircle2 className="w-3 h-3" />}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Simple particulars, quantity & rate format without tax breakdown.
                </p>
                {!hasGstin && (
                  <span className="mt-2 inline-block text-[10px] font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                    No GST Client
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Calculation Preview */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-bold">₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            {isTaxInvoice ? (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>CGST (9%):</span>
                  <span className="font-mono">₹{cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>SGST (9%):</span>
                  <span className="font-mono">₹{sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-slate-500 font-mono text-[11px]">
                <span>Tax Breakdown:</span>
                <span>No Tax Applied (0%)</span>
              </div>
            )}
            <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-[#0F172A]">
              <span>Final Grand Total:</span>
              <span className="font-mono text-blue-600">₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={converting}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={converting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {converting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Confirm & Generate Bill</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
