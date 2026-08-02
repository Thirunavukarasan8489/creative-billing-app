"use client";

import { useState, useEffect } from "react";

interface InvoiceItem {
  description: string;
  hsnSac?: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoicePreviewProps {
  type: "tax_invoice" | "labour_bill";
  number: string;
  date: string;
  company?: {
    name: string;
    address: string;
    phone: string;
    gstin?: string;
    state?: string;
    stateCode?: string;
  } | null;
  items: InvoiceItem[];
  subtotal: number;
  cgstPercent?: number;
  cgstAmount?: number;
  sgstPercent?: number;
  sgstAmount?: number;
  roundOff?: number;
  grandTotal: number;
  amountInWords: string;
  notes?: string;
  pressProfile?: any;
}

export function InvoicePreview({
  type,
  number,
  date,
  company,
  items,
  subtotal,
  cgstPercent = 9,
  cgstAmount = 0,
  sgstPercent = 9,
  sgstAmount = 0,
  roundOff = 0,
  grandTotal,
  amountInWords,
  notes,
  pressProfile: initialPressProfile,
}: InvoicePreviewProps) {
  const isTaxInvoice = type === "tax_invoice";

  const [pressProfile, setPressProfile] = useState<any>(
    initialPressProfile || {
      name: "Creative Line Graphics",
      tagline: "OFFSET PRINTING PRESS",
      address:
        "2/412 72, Thirumalai Nagar, Ganapathypalayam, Veerapandi (P.O), Palladam (T.K), Tiruppur - 641 605, Tamil Nadu.",
      phone: "+91 90479 02902",
      email: "creativetpr@gmail.com",
      gstin: "33DDIPG2441F1Z0",
      state: "Tamil Nadu",
      stateCode: "33",
      bankName: "Federal Bank",
      accountNo: "13590200065469",
      ifscCode: "FDRL0001359",
      branchName: "Industrial Branch, Tiruppur",
      terms:
        "Labour bill for printing work rendered. Payment due within 15 days of invoice date.",
    },
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

  return (
    <div
      className={`rounded-xl overflow-hidden transition-all border-2 ${
        isTaxInvoice ? "paper-bill-tax" : "paper-bill-labour"
      }`}
    >
      {/* Top Paper Header Bar */}
      <div
        className={`px-6 py-4 flex flex-wrap items-center justify-between border-b ${
          isTaxInvoice
            ? "bg-[#0F172A] text-white border-slate-800"
            : "bg-[#E11D48] text-white border-rose-800"
        }`}
      >
        <div>
          <h2 className="font-serif text-2xl font-black tracking-wider uppercase">
            {isTaxInvoice ? "TAX INVOICE" : "LABOUR BILL"}
          </h2>
          <p className="text-xs font-mono opacity-90">
            BILL NO: {number || "TI/26-27/XXXX"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest opacity-80">
            Date
          </p>
          <p className="font-mono font-bold text-sm">
            {date ? new Date(date).toLocaleDateString("en-IN") : "DD/MM/YYYY"}
          </p>
        </div>
      </div>

      {/* Main Letterhead Section */}
      <div className="p-6 bg-white text-[#0F172A] space-y-6">
        {/* Creative Line Graphics Letterhead Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-4 gap-4">
          <div>
            <h2 className="park-avenue normal-case text-3xl sm:text-4xl font-normal tracking-tight text-[#E11D48] leading-tight">
              Creative Line Graphics
            </h2>
            <p className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
              {pressProfile.tagline}
            </p>
            <p className="text-xs text-slate-600 mt-1 max-w-sm">
              {pressProfile.address}
            </p>
            <p className="text-xs text-slate-600 font-mono">
              Ph: {pressProfile.phone} | Email: {pressProfile.email}
            </p>
          </div>

          {isTaxInvoice && (
            <div className="text-right bg-slate-100 p-3 rounded-lg border border-slate-300">
              <p className="text-[10px] uppercase font-bold text-slate-700">
                GSTIN:{" "}
                <span className="font-mono text-xs text-[#0F172A]">
                  {pressProfile.gstin}
                </span>
              </p>
              <p className="text-[10px] uppercase font-bold text-slate-700 mt-1">
                State Code:{" "}
                <span className="font-mono text-xs text-[#0F172A]">
                  {pressProfile.stateCode} ({pressProfile.state})
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Billed To Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              BILLED TO:
            </span>
            {company ? (
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">
                  {company.name}
                </h3>
                <p className="text-xs text-slate-600 whitespace-pre-line mt-0.5">
                  {company.address}
                </p>
                <p className="text-xs text-slate-600 font-mono mt-1">
                  Ph: {company.phone}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Select or create a company to populate billing details...
              </p>
            )}
          </div>

          {isTaxInvoice && company && (
            <div className="sm:text-right flex flex-col justify-end">
              <p className="text-xs font-mono font-bold text-[#0F172A]">
                Party GSTIN:{" "}
                <span className="text-[#E11D48]">{company.gstin || "N/A"}</span>
              </p>
              <p className="text-xs font-mono text-slate-600">
                State: {company.state || "Tamil Nadu"} (
                {company.stateCode || "33"})
              </p>
            </div>
          )}
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
          <table className="w-full text-xs text-left">
            <thead
              className={`uppercase font-bold tracking-wider text-white ${
                isTaxInvoice ? "bg-[#0F172A]" : "bg-[#E11D48]"
              }`}
            >
              <tr>
                <th className="p-2.5 text-center w-10">S.No</th>
                <th className="p-2.5">Particulars / Job Description</th>
                {isTaxInvoice && <th className="p-2.5 text-center">HSN/SAC</th>}
                <th className="p-2.5 text-right">Qty</th>
                <th className="p-2.5 text-right">Rate (₹)</th>
                <th className="p-2.5 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={isTaxInvoice ? 6 : 5}
                    className="p-6 text-center text-slate-400 italic"
                  >
                    No line items added yet.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 text-center font-mono text-slate-500">
                      {idx + 1}
                    </td>
                    <td className="p-2.5 font-medium text-[#0F172A]">
                      {item.description}
                    </td>
                    {isTaxInvoice && (
                      <td className="p-2.5 text-center font-mono text-slate-600">
                        {item.hsnSac || "4820"}
                      </td>
                    )}
                    <td className="p-2.5 text-right font-mono font-semibold">
                      {item.quantity}
                    </td>
                    <td className="p-2.5 text-right font-mono">
                      {item.rate.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-[#0F172A]">
                      {item.amount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Math & Totals Ledger */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="w-full sm:w-1/2 space-y-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                Amount in Words:
              </span>
              <p className="font-serif font-bold text-xs text-[#0F172A]">
                {amountInWords || "Rupees Zero Only"}
              </p>
            </div>

            {notes && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                <span className="font-bold block text-slate-700">
                  Notes / Instructions:
                </span>
                <p className="mt-0.5">{notes}</p>
              </div>
            )}
          </div>

          <div className="w-full sm:w-5/12 bg-white p-4 rounded-lg border border-slate-300 space-y-2 text-xs">
            <div className="flex justify-between font-medium text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-semibold">
                ₹
                {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {isTaxInvoice && (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>CGST ({cgstPercent}%):</span>
                  <span className="font-mono">
                    ₹
                    {cgstAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>SGST ({sgstPercent}%):</span>
                  <span className="font-mono">
                    ₹
                    {sgstAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </>
            )}

            {roundOff !== 0 && (
              <div className="flex justify-between text-slate-500 italic">
                <span>Round Off:</span>
                <span className="font-mono">
                  {roundOff > 0
                    ? `+₹${roundOff.toFixed(2)}`
                    : `-₹${Math.abs(roundOff).toFixed(2)}`}
                </span>
              </div>
            )}

            <div className="border-t-2 border-dashed border-slate-300 pt-2 flex justify-between items-center text-sm font-bold text-[#0F172A]">
              <span className="font-serif text-base">GRAND TOTAL:</span>
              <span className="font-mono text-lg bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                ₹
                {grandTotal.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Printable Footer with Bank Details & Authorization */}
        <div className="border-t-2 border-slate-200 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {isTaxInvoice ? (
            <div className="p-3 bg-slate-100 rounded-lg border border-slate-200">
              <h4 className="font-bold text-[11px] uppercase tracking-wider text-[#0F172A] mb-1">
                Bank Details for Payment:
              </h4>
              <p className="font-semibold text-slate-800">
                {pressProfile.bankName}
              </p>
              <p className="font-mono text-slate-600">
                A/C No: {pressProfile.accountNo}
              </p>
              <p className="font-mono text-slate-600">
                IFSC Code: {pressProfile.ifscCode}
              </p>
              <p className="text-slate-600">
                Branch: {pressProfile.branchName}
              </p>
            </div>
          ) : (
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-rose-800">
              <h4 className="font-bold text-[11px] uppercase tracking-wider mb-1">
                Terms:
              </h4>
              <p className="text-[11px]">{pressProfile.terms}</p>
            </div>
          )}

          <div className="flex flex-col justify-between text-right sm:items-end">
            <span className="font-serif font-bold text-xs text-[#0F172A]">
              For {pressProfile.name}
            </span>
            <div className="h-12 border-b border-slate-400 w-36 self-end mt-4"></div>
            <span className="text-[10px] text-slate-500 uppercase font-semibold mt-1">
              Authorized Signatory
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
