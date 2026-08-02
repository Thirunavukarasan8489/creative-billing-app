"use client";

import { FileText, Wrench } from "lucide-react";

interface BillTypeToggleProps {
  type: "tax_invoice" | "labour_bill";
  onChange: (type: "tax_invoice" | "labour_bill") => void;
  autoSuggested?: boolean;
}

export function BillTypeToggle({
  type,
  onChange,
  autoSuggested = false,
}: BillTypeToggleProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
          Select Bill Type <span className="text-rose-500">*</span>
        </label>
        {autoSuggested && (
          <span className="text-[11px] font-medium text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
            Auto-suggested from GSTIN
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => onChange("tax_invoice")}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
            type === "tax_invoice"
              ? "bg-[#0F172A] text-white shadow-md border border-slate-900"
              : "text-slate-600 hover:text-[#0F172A] hover:bg-white/60"
          }`}
        >
          <FileText className="w-4 h-4 text-blue-400" />
          <div className="text-left">
            <div>TAX INVOICE</div>
            <div className="text-[10px] font-normal opacity-80">GSTIN / CGST & SGST (9%+9%)</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChange("labour_bill")}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all ${
            type === "labour_bill"
              ? "bg-[#E11D48] text-white shadow-md border border-rose-700"
              : "text-slate-600 hover:text-[#E11D48] hover:bg-white/60"
          }`}
        >
          <Wrench className="w-4 h-4 text-white" />
          <div className="text-left">
            <div>LABOUR BILL</div>
            <div className="text-[10px] font-normal opacity-80">Non-GST / Simple Particulars</div>
          </div>
        </button>
      </div>
    </div>
  );
}
