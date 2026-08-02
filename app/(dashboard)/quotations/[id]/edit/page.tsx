"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, AlertCircle } from "lucide-react";
import { QuotationForm } from "@/components/quotations/QuotationForm";

export default function EditQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [quotation, setQuotation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotationData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quotations/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load quotation");
      setQuotation(data.quotation);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotationData();
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading quotation data for editing...</div>;
  }

  if (error || !quotation) {
    return (
      <div className="p-8 text-center space-y-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-700">
        <AlertCircle className="w-8 h-8 mx-auto" />
        <p className="font-bold">{error || "Quotation not found"}</p>
        <Link href="/quotations" className="underline text-xs">
          Return to Quotations Ledger
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <Link
          href={`/quotations/${id}`}
          className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
          title="Back to Quotation Details"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-[#0F172A] flex items-center gap-2">
              <Pencil className="w-5 h-5 text-amber-600" />
              <span>Edit Rate Quotation — {quotation.number}</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-mono">
            Client: <strong>{quotation.companySnapshot?.name}</strong> | Add or modify quotation items, unit rates, or terms
          </p>
        </div>
      </div>

      <QuotationForm initialValues={quotation} />
    </div>
  );
}
