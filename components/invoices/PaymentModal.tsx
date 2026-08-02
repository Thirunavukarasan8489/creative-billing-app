"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { CreditCard, X, Check, AlertCircle } from "lucide-react";

interface PaymentModalProps {
  invoiceId: string;
  invoiceNumber: string;
  outstandingBalance: number;
  onSuccess: () => void;
  onClose: () => void;
}

export function PaymentModal({
  invoiceId,
  invoiceNumber,
  outstandingBalance,
  onSuccess,
  onClose,
}: PaymentModalProps) {
  const [amountPaid, setAmountPaid] = useState<number>(outstandingBalance);
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [mode, setMode] = useState<"bank_transfer" | "upi" | "cash" | "cheque">("bank_transfer");
  const [referenceNo, setReferenceNo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountPaid || amountPaid <= 0) {
      const msg = "Please enter a valid payment amount";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountPaid,
          date,
          mode,
          referenceNo,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record payment");
      }

      toast.success("Payment recorded successfully!");
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.message || "Failed to record payment";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-serif font-bold text-[#0F172A] flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            <span>Record Payment</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono flex items-center justify-between">
          <span>Bill No: <strong>{invoiceNumber}</strong></span>
          <span>Dues: <strong className="text-rose-600">₹{outstandingBalance.toLocaleString("en-IN")}</strong></span>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold uppercase text-gray-700 mb-1">
              Amount Paid (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max={outstandingBalance}
              step="any"
              required
              value={amountPaid}
              onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono font-bold text-[#0F172A]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold uppercase text-gray-700 mb-1">
                Payment Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold uppercase text-gray-700 mb-1">
                Mode
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
              >
                <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="upi">UPI / GPay / PhonePe</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold uppercase text-gray-700 mb-1">
              Reference / UTR No.
            </label>
            <input
              type="text"
              placeholder="e.g. UTR123456789 or Cheque No."
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold uppercase text-gray-700 mb-1">
              Payment Remarks
            </label>
            <input
              type="text"
              placeholder="Optional payment notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-white bg-[#0F172A] hover:bg-slate-800 rounded-lg font-bold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-blue-400" />
              <span>{loading ? "Recording..." : "Save Payment"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
