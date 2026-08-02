"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  FileText,
  Printer,
  CreditCard,
  ArrowLeft,
  Pencil,
  Trash2,
  AlertCircle,
  Ban,
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

  const handleCancel = async () => {
    if (
      !confirm(
        `Are you sure you want to CANCEL Bill #${invoice.number}? This will remove its amount from company account statements.`,
      )
    )
      return;

    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) {
        toast.success(`Bill #${invoice.number} cancelled`);
        fetchInvoiceData();
      } else {
        toast.error("Failed to cancel bill");
      }
    } catch (err) {
      toast.error("Error cancelling bill");
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Permanently DELETE Bill #${invoice.number}? This action cannot be undone.`,
      )
    )
      return;

    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Invoice deleted");
        router.push("/invoices");
        router.refresh();
      } else {
        toast.error("Failed to delete invoice");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting invoice");
    }
  };

  const handlePrint = () => {
    window.open(`/invoices/${id}/pdf`, "_blank");
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#0F172A]">
        Loading invoice...
      </div>
    );
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
  const isCancelled = invoice.status === "cancelled";

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
              {isCancelled && (
                <span className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                  Cancelled
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
          {!isCancelled && (
            <Link
              href={`/invoices/${id}/edit`}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5 transition-colors"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit Bill</span>
            </Link>
          )}

          {!isPaid && !isCancelled && (
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
            <span>Print / ExportPrint / PDF</span>
          </button>

          {!isCancelled ? (
            <button
              onClick={handleCancel}
              className="px-3 py-2 text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-300 text-xs font-bold flex items-center gap-1 transition-colors"
              title="Cancel Bill"
            >
              <Ban className="w-4 h-4 text-rose-600" />
              <span>Cancel Bill</span>
            </button>
          ) : (
            <button
              onClick={handleDelete}
              className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow"
              title="Permanently Delete Cancelled Invoice"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Cancelled Bill</span>
            </button>
          )}
        </div>
      </div>

      {/* Payment & Balance Status Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-600 block">
            Grand Total Amount
          </span>
          <p className="font-mono text-xl font-bold text-[#0F172A] mt-0.5">
            ₹
            {invoice.grandTotal.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-600 block">
            Total Payments Received
          </span>
          <p className="font-mono text-xl font-bold text-emerald-800 mt-0.5">
            ₹
            {(invoice.paidAmount || 0).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-600 block">
            Balance Outstanding
          </span>
          <p className="font-mono text-xl font-bold text-[#E11D48] mt-0.5">
            ₹
            {(invoice.balanceAmount || 0).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {/* Live Paper Bill Preview */}
      <InvoicePreview
        type={invoice.type}
        number={invoice.number}
        date={invoice.date}
        poNumber={invoice.poNumber}
        poDate={invoice.poDate}
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

      {/* Payment Transactions Ledger */}
      {payments.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <h3 className="font-serif font-bold text-base text-[#0F172A] border-b border-slate-100 pb-2">
            Payment Transaction History ({payments.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-[#0F172A] font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-2">Date</th>
                  <th className="p-2">Mode</th>
                  <th className="p-2">Reference No.</th>
                  <th className="p-2 text-right">Amount Paid (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td className="p-2">
                      {new Date(p.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="p-2 uppercase font-bold text-blue-800">
                      {p.mode}
                    </td>
                    <td className="p-2 text-slate-700">
                      {p.referenceNo || "—"}
                    </td>
                    <td className="p-2 text-right font-bold text-emerald-800">
                      ₹
                      {p.amountPaid.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          invoiceId={id}
          invoiceNumber={invoice.number}
          outstandingBalance={invoice.balanceAmount}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            fetchInvoiceData();
          }}
        />
      )}
    </div>
  );
}
