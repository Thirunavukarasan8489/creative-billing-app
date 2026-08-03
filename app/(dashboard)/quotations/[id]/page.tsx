"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  FileSpreadsheet,
  Printer,
  ArrowLeft,
  ArrowRightLeft,
  Pencil,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { QuotationPreview } from "@/components/quotations/QuotationPreview";
import { ConvertModal } from "@/components/quotations/ConvertModal";

export default function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [quotation, setQuotation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);

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

  const handleConfirmConvert = async (billType: "tax_invoice" | "labour_bill") => {
    setConverting(true);
    try {
      const res = await fetch(`/api/quotations/${id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: billType }),
      });
      const invoice = await res.json();
      if (!res.ok) throw new Error(invoice.error || "Failed to convert quotation");

      toast.success(`Quotation converted to ${billType === "tax_invoice" ? "Tax Invoice" : "Labour Bill"} ${invoice.number}!`);
      setShowConvertModal(false);
      router.push(`/invoices/${invoice._id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to convert quotation");
    } finally {
      setConverting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this quotation?")) return;
    try {
      const res = await fetch(`/api/quotations/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Quotation deleted");
        router.push("/quotations");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.open(`/quotations/${id}/pdf`, "_blank");
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Loading quotation...
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="p-8 text-center space-y-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-700">
        <AlertCircle className="w-8 h-8 mx-auto" />
        <p className="font-bold">{error || "Quotation not found"}</p>
        <Link href="/quotations" className="underline text-xs">
          Return to Rate Quotations Ledger
        </Link>
      </div>
    );
  }

  const isConverted = quotation.status === "converted";
  const hasGstin = Boolean(quotation.companySnapshot?.gstin && quotation.companySnapshot.gstin.trim().length > 0);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/quotations"
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-[#0F172A]">
                {quotation.number}
              </h1>
              <span className="bg-blue-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                Rate Quotation
              </span>
              {isConverted && (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-emerald-300">
                  Converted to Bill
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 font-mono">
              Issued To: <strong>{quotation.companySnapshot.name}</strong> | Date:{" "}
              {new Date(quotation.date).toLocaleDateString("en-GB")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isConverted && (
            <button
              onClick={() => setShowConvertModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Convert to Bill</span>
            </button>
          )}

          <Link
            href={`/quotations/${id}/edit`}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            <span>Edit Quotation</span>
          </Link>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>Print / Export PDF</span>
          </button>

          <button
            onClick={handleDelete}
            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 cursor-pointer"
            title="Delete Quotation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Paper Quotation Preview */}
      <QuotationPreview
        number={quotation.number}
        date={quotation.date}
        company={quotation.companySnapshot}
        recipientTitle={quotation.recipientTitle}
        subject={quotation.subject}
        items={quotation.items}
        subtotal={quotation.subtotal}
        taxNote={quotation.taxNote}
        grandTotal={quotation.grandTotal}
        notes={quotation.notes}
      />

      {/* Convert Selection Modal */}
      <ConvertModal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        onConfirm={handleConfirmConvert}
        quotationNumber={quotation.number}
        companyName={quotation.companySnapshot?.name || "Client"}
        hasGstin={hasGstin}
        subtotal={quotation.subtotal}
        converting={converting}
      />
    </div>
  );
}
