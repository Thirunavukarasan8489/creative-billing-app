"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil, AlertCircle } from "lucide-react";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";

export default function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [invoice, setInvoice] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoiceData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load invoice");
      setInvoice(data.invoice || data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceData();
  }, [id]);

  if (loading) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading invoice data for editing...</div>;
  }

  if (error || !invoice) {
    return (
      <div className="p-8 text-center space-y-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-700">
        <AlertCircle className="w-8 h-8 mx-auto" />
        <p className="font-bold">{error || "Invoice not found"}</p>
        <Link href="/invoices" className="underline text-xs">
          Return to Invoice Ledger
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <Link
          href={`/invoices/${id}`}
          className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
          title="Back to Invoice Details"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-[#0F172A] flex items-center gap-2">
              <Pencil className="w-5 h-5 text-amber-600" />
              <span>Edit Bill — {invoice.number}</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-mono">
            Client: <strong>{invoice.companySnapshot?.name}</strong> | Add or modify job items, rate, quantity, or notes
          </p>
        </div>
      </div>

      {/* Edit Form with initialValues */}
      <InvoiceForm initialValues={invoice} isEditing={true} />
    </div>
  );
}
