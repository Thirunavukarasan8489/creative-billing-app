"use client";

import Link from "next/link";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";
import { QuotationForm } from "@/components/quotations/QuotationForm";

export default function NewQuotationPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <Link
          href="/quotations"
          className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
          title="Back to Quotations Ledger"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            <span>Create New Rate Quotation</span>
          </h1>
          <p className="text-xs text-slate-500">
            Generate an official rate quotation with live printed letterhead preview
          </p>
        </div>
      </div>

      <QuotationForm />
    </div>
  );
}
