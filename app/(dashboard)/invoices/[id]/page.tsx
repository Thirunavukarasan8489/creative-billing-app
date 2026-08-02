"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Printer,
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  Pencil,
} from "lucide-react";
import { InvoicePreview } from "@/components/invoices/InvoicePreview";
import { PaymentModal } from "@/components/invoices/PaymentModal";

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [invoice, setInvoice] = useState<any | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchInvoiceData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load invoice");
      setInvoice(data.invoice);
      setPayments(data.payments || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceData();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this invoice?")) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/invoices");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.open(`/invoices/${id}/pdf`, "_blank");
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-[#0F172A]">Loading invoice...</div>;
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

  const isPaid = invoice.status === "paid" || invoice.balanceAmount === 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/invoices"
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl font-bold text-[#0F172A]">
                {invoice.number}
              </h1>
              {invoice.type === "tax_invoice" ? (
                <span className="bg-[#0F172A] text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                  Tax Invoice
                </span>
              ) : (
                <span className="bg-[#E11D48] text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                  Labour Bill
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 font-mono">
              Issued To: <strong>{invoice.companySnapshot.name}</strong> | Date:{" "}
              {new Date(invoice.date).toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Edit Bill Button */}
          <Link
            href={`/invoices/${id}/edit`}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            <span>Edit Bill</span>
          </Link>

          {!isPaid && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Record Payment</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Export PDF</span>
          </button>

          <button
            onClick={handleDelete}
            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200"
            title="Delete Invoice"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Payment & Balance Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">
            Grand Total
          </span>
          <p className="font-mono text-xl font-bold text-[#0F172A]">
            ₹{invoice.grandTotal.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">
            Amount Paid
          </span>
          <p className="font-mono text-xl font-bold text-emerald-700">
            ₹{(invoice.paidAmount || 0).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">
            Outstanding Balance
          </span>
          <p className="font-mono text-xl font-bold text-[#E11D48]">
            ₹{(invoice.balanceAmount || 0).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Live Paper Bill Display */}
      <InvoicePreview
        type={invoice.type}
        number={invoice.number}
        date={invoice.date}
        company={invoice.companySnapshot}
        items={invoice.items}
        subtotal={invoice.subtotal}
        cgstPercent={invoice.cgstPercent}
        cgstAmount={invoice.cgstAmount}
        sgstPercent={invoice.sgstPercent}
        sgstAmount={invoice.sgstAmount}
        roundOff={invoice.roundOff}
        grandTotal={invoice.grandTotal}
        amountInWords={invoice.amountInWords}
        notes={invoice.notes}
      />

      {/* Payment Transaction Ledger */}
      {payments.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden p-5 space-y-3">
          <h3 className="font-serif font-bold text-base text-[#0F172A]">
            Recorded Payment Transactions
          </h3>
          <div className="divide-y divide-slate-100">
            {payments.map((p) => (
              <div key={p._id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#0F172A]">
                    ₹{p.amountPaid.toLocaleString("en-IN")}
                  </span>{" "}
                  <span className="text-slate-500 font-mono">
                    via {p.mode.toUpperCase()} ({new Date(p.date).toLocaleDateString("en-IN")})
                  </span>
                  {p.referenceNo && (
                    <p className="text-[11px] font-mono text-slate-500">
                      Ref: {p.referenceNo}
                    </p>
                  )}
                </div>
                <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                  Cleared
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          invoiceId={invoice._id}
          invoiceNumber={invoice.number}
          outstandingBalance={invoice.balanceAmount}
          onSuccess={fetchInvoiceData}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
