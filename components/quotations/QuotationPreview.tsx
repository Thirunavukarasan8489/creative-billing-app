"use client";

import { useState, useEffect } from "react";

interface QuotationItem {
  description: string;
  quantity: string;
  rate: number;
  amount: number;
}

interface QuotationPreviewProps {
  number: string;
  date: string;
  company?: {
    name: string;
    address: string;
    phone: string;
    gstin?: string;
  } | null;
  recipientTitle?: string;
  subject?: string;
  items: QuotationItem[];
  subtotal: number;
  taxNote?: string;
  grandTotal: number;
  notes?: string;
  pressProfile?: any;
}

export function QuotationPreview({
  number,
  date,
  company,
  recipientTitle = "The Purchase Manager",
  subject = "Sub : Rate Quotation Reg.",
  items,
  subtotal,
  taxNote = "GST TAX 18% EXTRA",
  grandTotal,
  notes,
  pressProfile: initialPressProfile,
}: QuotationPreviewProps) {
  const [pressProfile, setPressProfile] = useState<any>(
    initialPressProfile || {
      name: "Creative Line Graphics",
      tagline: "OFFSET & DIGITAL PRINTING PRESS",
      address: "No,28412, Thirumalai Nagar, Ganapathypalayam, Veerapandi PO, TIRUPUR - 641 605.",
      phone: "8489 902 902, 93442 16902",
      email: "creativeline.tpr@gmail.com",
      gstin: "33DDIPG2441F1Z0",
    }
  );

  useEffect(() => {
    if (!initialPressProfile) {
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.name) setPressProfile(data);
        })
        .catch((err) => console.error(err));
    }
  }, [initialPressProfile]);

  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-GB").replace(/\//g, ".")
    : "28.07.2026";

  const safeGrandTotal = Number(grandTotal) || 0;

  return (
    <div className="bg-white text-black border-2 border-slate-800 rounded-xl p-6 sm:p-8 shadow-md space-y-6 max-w-3xl mx-auto font-sans">
      {/* Press Header Banner */}
      <div className="text-center border-b-4 border-double border-slate-900 pb-4 space-y-1">
        <h1 className="park-avenue normal-case text-4xl sm:text-5xl font-normal text-[#E11D48] leading-tight">
          Creative Line Graphics
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-slate-800">
          {pressProfile.address}
        </p>
        <p className="text-xs sm:text-sm font-semibold text-slate-800 font-mono">
          Cell : {pressProfile.phone}
        </p>
        <p className="text-sm font-bold font-mono text-slate-900 mt-1">
          GSTIN : <span className="text-[#E11D48]">{pressProfile.gstin}</span>
        </p>
      </div>

      {/* Quotation Title & Date Bar */}
      <div className="flex justify-between items-center border-b border-slate-200 pb-2">
        <div className="w-1/3"></div>
        <h2 className="font-sans font-bold text-xl sm:text-2xl text-center underline uppercase tracking-wider text-slate-900 w-1/3">
          QUOTATION
        </h2>
        <div className="text-right w-1/3 font-mono font-bold text-xs sm:text-sm text-slate-800">
          Date : {formattedDate}
        </div>
      </div>

      {/* Recipient To Box & Subject */}
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="space-y-0.5">
          <p className="font-bold text-slate-900">To,</p>
          <p className="font-semibold text-slate-800">{recipientTitle}</p>
          {company ? (
            <div>
              <p className="font-bold text-base text-slate-900">{company.name}</p>
              <p className="text-slate-700 whitespace-pre-line leading-relaxed">{company.address}</p>
            </div>
          ) : (
            <p className="text-slate-400 italic">Select or create a company to populate recipient details...</p>
          )}
        </div>

        <div className="pt-2">
          <p className="font-bold text-slate-900 font-serif text-sm sm:text-base">
            {subject}
          </p>
        </div>
      </div>

      {/* 4-Column Particulars Table */}
      <div className="border-2 border-slate-900 rounded overflow-hidden bg-white">
        <table className="w-full text-xs sm:text-sm text-left border-collapse">
          <thead className="border-b-2 border-slate-900 font-bold uppercase text-slate-900 bg-slate-50">
            <tr>
              <th className="p-3 border-r-2 border-slate-900">Particulars</th>
              <th className="p-3 border-r-2 border-slate-900 text-center w-24 sm:w-28">Quantity</th>
              <th className="p-3 border-r-2 border-slate-900 text-right w-28 sm:w-32">Rate Per Pcs</th>
              <th className="p-3 text-right w-28 sm:w-36">Amount Rs.</th>
            </tr>
          </thead>
          <tbody className="divide-y border-slate-900">
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                  No quotation item rows added yet.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => {
                const rateVal = Number(item.rate) || 0;
                const amountVal = Number(item.amount) || 0;
                return (
                  <tr key={idx} className="hover:bg-slate-50 font-medium">
                    <td className="p-3 border-r-2 border-slate-900 uppercase font-semibold text-slate-900">
                      {item.description}
                    </td>
                    <td className="p-3 border-r-2 border-slate-900 text-center font-bold font-mono text-slate-800">
                      {item.quantity}
                    </td>
                    <td className="p-3 border-r-2 border-slate-900 text-right font-mono text-slate-800">
                      {rateVal.toFixed(2).replace(".", "-")}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {amountVal.toFixed(2).replace(".", "-")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* GST Tax Extra Badge Footer inside table */}
        <div className="p-3 border-t-2 border-slate-900 flex justify-between items-center bg-slate-50">
          {taxNote ? (
            <span className="bg-slate-900 text-white font-bold text-xs uppercase px-3 py-1 tracking-wider inline-block">
              {taxNote}
            </span>
          ) : (
            <div></div>
          )}

          <div className="font-mono text-sm font-bold text-slate-900 flex items-center gap-2">
            <span>Total Amount:</span>
            <span className="text-base bg-white px-2 py-0.5 border border-slate-400 rounded">
              ₹{safeGrandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {notes && (
        <div className="p-3 bg-slate-50 border border-slate-300 rounded text-xs text-slate-700">
          <span className="font-bold block text-slate-900">Additional Terms / Instructions:</span>
          <p className="mt-0.5 whitespace-pre-line">{notes}</p>
        </div>
      )}

      {/* Signature Bar */}
      <div className="pt-8 flex justify-between items-end text-xs sm:text-sm">
        <div></div>
        <div className="text-right">
          <p className="font-serif font-bold text-slate-900">For Creative Line Graphics</p>
          <div className="h-12 border-b border-slate-400 w-40 ml-auto mt-2"></div>
          <p className="text-[10px] text-slate-600 uppercase font-semibold mt-1">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
}
