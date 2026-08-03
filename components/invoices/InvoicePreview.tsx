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
  poNumber?: string;
  poDate?: string;
  quoteNumber?: string;
  quoteDate?: string;
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
  poNumber,
  poDate,
  quoteNumber,
  quoteDate,
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
        "No. 2/412, Thirumalai Nagar, Ganapathypalayam,\nVeerapandi (PO), palladam (T.K), Tiruppur - 641 605",
      phone: "8489 902 902, 93442 16902",
      email: "creativetpr@gmail.com",
      gstin: "33DDIPG2441F1Z0",
      state: "Tamil Nadu",
      stateCode: "33",
      bankName: "FEDERAL BANK, TIRUPUR",
      accountNo: "13590200065469",
      ifscCode: "FDRL0001359",
      branchName: "Industrial Branch, Tiruppur",
      terms:
        "Labour bill for printing work rendered. Payment due within 15 days of invoice date.",
    },
  );

  useEffect(() => {
    if (initialPressProfile) {
      setPressProfile(initialPressProfile);
    }
  }, [initialPressProfile]);

  return (
    <div className="rounded-xl overflow-hidden transition-all border-2 border-slate-900 bg-white p-6 text-[#0F172A] space-y-5">
      {/* Top Header: Centered Title, Right-Aligned Bill & PO Details */}
      <div className="border-b-2 border-slate-900 pb-2 flex justify-center items-center">
        <div className="flex-1 text-center">
          <h2 className="font-serif text-lg font-bold tracking-widest uppercase text-[#0F172A]">
            {isTaxInvoice ? "TAX INVOICE" : "LABOUR BILL"}
          </h2>
        </div>
      </div>

      {/* Creative Line Graphics Letterhead Banner */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-3">
        <div>
          <h2 className="park-avenue normal-case text-3xl sm:text-4xl font-normal tracking-tight text-[#E11D48] leading-tight">
            Creative Line Graphics
          </h2>
          <p className="text-xs font-semibold text-[#0F172A] uppercase tracking-wider">
            {pressProfile.tagline}
          </p>
          <p className="text-xs text-slate-600 mt-0.5 tracking-wide whitespace-pre-line">
            {pressProfile.address}
          </p>
          <p className="text-xs text-slate-600 font-serif tracking-wide">
            Ph: {pressProfile.phone} | Email: {pressProfile.email}
          </p>
          {isTaxInvoice && (
            <p className="text-xs font-semibold text-[#0F172A] font-serif tracking-wide mt-0.5">
              GSTIN: {pressProfile.gstin} | State:{" "}
              {pressProfile.state || "Tamil Nadu"} (
              {pressProfile.stateCode || "33"})
            </p>
          )}
        </div>
        {/* <div className="flex-2 text-right text-xs font-mono font-bold text-slate-900 leading-tight">
          <div>BILL NO: {number || "TI/26-27/XXXX"}</div>
          <div>
            DATE:{" "}
            {date
              ? new Date(date).toLocaleDateString("en-GB").replace(/\//g, ".")
              : "DD.MM.YYYY"}
          </div>
          {quoteNumber && <div>QUOTE NO: {quoteNumber}</div>}
          {quoteDate && (
            <div>
              QUOTE DATE:{" "}
              {new Date(quoteDate).toLocaleDateString("en-GB").replace(/\//g, ".")}
            </div>
          )}
          {poNumber && <div>P.O. NO: {poNumber}</div>}
          {poDate && (
            <div>
              P.O. DATE:{" "}
              {new Date(poDate).toLocaleDateString("en-GB").replace(/\//g, ".")}
            </div>
          )}
        </div> */}
        <div>
          <table className="w-full text-xs text-left border-collapse border border-slate-900">
            <thead>
              <tr>
                <th className="border py-1 w-24 pl-1.5">BILL NO</th>
                <td className="border py-1 w-24 pl-1.5">{number}</td>
              </tr>
              <tr>
                <th className="border py-1 w-24 pl-1.5">DATE</th>
                <td className="border py-1 w-24 pl-1.5">
                  {date
                    ? new Date(date).toLocaleDateString("en-GB").replace(/\//g, ".")
                    : "DD.MM.YYYY"}
                </td>
              </tr>
              {quoteNumber && <tr>
                <th className="border py-1 w-24 pl-1.5">QUOTE NO</th>
                <td className="border py-1 w-24 pl-1.5">{quoteNumber}</td>
              </tr>}
              {quoteDate && <tr>
                <th className="border py-1 w-24 pl-1.5">QUOTE DATE</th>
                <td className="border py-1 w-24 pl-1.5">{new Date(quoteDate).toLocaleDateString("en-GB").replace(/\//g, ".")}</td>
              </tr>}
              {poNumber && <tr>
                <th className="border py-1 w-24 pl-1.5">P.O. NO</th>
                <td className="border w-24 pl-1.5">{poNumber}</td>
              </tr>}
              {poDate && <tr>
                <th className="border py-1 w-24 pl-1.5">P.O. DATE</th>
                <td className="border py-1 w-24 pl-1.5">{new Date(poDate).toLocaleDateString("en-GB").replace(/\//g, ".")}
                </td>
              </tr>}
            </thead>
          </table>
        </div>
      </div>

      {/* Billed To Section (Optimized without empty whitespace) */}
      <div className="flex justify-between items-start bg-white p-3 border border-slate-900 gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
            BILLED TO:
          </span>
          {company ? (
            <div>
              <h3 className="font-bold text-base text-[#0F172A]">
                {company.name}
              </h3>
              <p className="text-xs text-slate-600 whitespace-pre-line tracking-wide mt-0.5">
                {company.address}
              </p>
              <p className="text-xs text-slate-600 font-serif mt-0.5 tracking-wide">
                Ph: {company.phone}
              </p>
              <p className="text-xs font-semibold text-[#0F172A] font-serif mt-0.5 tracking-wide">
                GSTIN: {company.gstin} | State: {company.state} ({company.stateCode})
              </p>
            </div>

          ) : (
            <p className="text-xs text-slate-400 italic">
              Select or create a company to populate billing details...
            </p>
          )}
        </div>

        {/* {company && (
          <div className="text-right font-mono text-xs text-slate-800 shrink-0">
            {company.gstin && (
              <p className="font-bold text-[#0F172A]">
                Party GSTIN:{" "}
                <span className="text-[#E11D48]">{company.gstin}</span>
              </p>
            )}
            <p className="text-slate-600 mt-0.5">
              State: {company.state || "Tamil Nadu"} (
              {company.stateCode || "33"})
            </p>
          </div>
        )} */}
      </div>

      {/* Line Items Table with Black Borders */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse border border-slate-900">
          <thead>
            <tr className="uppercase font-bold tracking-wider bg-white text-slate-900 border-b border-slate-900 text-[11px]">
              <th className="p-2 text-center w-10 border border-slate-900">
                S.No
              </th>
              <th className="p-2 border border-slate-900">
                Particulars / Job Description
              </th>
              {isTaxInvoice && (
                <th className="p-2 text-center border border-slate-900">
                  HSN/SAC
                </th>
              )}
              <th className="p-2 text-right border border-slate-900">Qty</th>
              <th className="p-2 text-right border border-slate-900">
                Rate (₹)
              </th>
              <th className="p-2 text-right border border-slate-900">
                Amount (₹)
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={isTaxInvoice ? 6 : 5}
                  className="p-6 text-center text-slate-400 italic border border-slate-900"
                >
                  No line items added yet.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2 text-center font-mono text-slate-900 border border-slate-900">
                    {idx + 1}
                  </td>
                  <td className="p-2 font-medium text-[#0F172A] border border-slate-900">
                    {item.description}
                  </td>
                  {isTaxInvoice && (
                    <td className="p-2 text-center font-mono text-slate-950 border border-slate-900">
                      {item.hsnSac || "4820"}
                    </td>
                  )}
                  <td className="p-2 text-right font-mono font-semibold border border-slate-900">
                    {item.quantity}
                  </td>
                  <td className="p-2 text-right font-mono font-semibold border border-slate-900">
                    {item.rate.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="p-2 text-right font-mono font-bold text-[#0F172A] border border-slate-900">
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

      {/* Financial Totals & Signatures */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
        {/* Left Side: Bank Details & Amount in Words */}
        <div className="md:col-span-7 space-y-4">
          {isTaxInvoice && (
            <div className="bg-white space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900 block">
                Bank Account Details:
              </span>
              <table className="w-full text-xs text-left border-collapse border border-slate-900">
                <tbody>
                  <tr className="border border-slate-900">
                    <th className="border border-slate-900 p-2">Bank Name:</th>
                    <td className="border border-slate-900 p-2">{pressProfile.bankName}</td>
                  </tr>
                  <tr className="border border-slate-900">
                    <th className="border border-slate-900 p-2">Account No:</th>
                    <td className="border border-slate-900 p-2">{pressProfile.accountNo}</td>
                  </tr>
                  <tr className="border border-slate-900">
                    <th className="border border-slate-900 p-2">IFSC Code:</th>
                    <td className="border border-slate-900 p-2">{pressProfile.ifscCode}</td>
                  </tr>
                  <tr className="border border-slate-900">
                    <th className="border border-slate-900 p-2">Branch:</th>
                    <td className="border border-slate-900 p-2">{pressProfile.branchName}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
              Amount in Words:
            </span>
            <p className="font-serif font-bold text-sm text-[#0F172A] capitalize">
              {amountInWords}
            </p>
          </div>

          {notes && (
            <div className="text-xs text-slate-600 bg-slate-50 p-2.5 border border-slate-200">
              <span className="font-bold block text-slate-700">Notes:</span>
              {notes}
            </div>
          )}
        </div>

        {/* Right Side: Math Calculations */}
        <div className="md:col-span-5 space-y-2 text-xs font-mono pt-3">
          <div className="flex justify-between py-1 border-b border-slate-300">
            <span className="text-slate-900">Subtotal:</span>
            <span className="font-bold text-[#0F172A]">
              ₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {isTaxInvoice && (
            <>
              <div className="flex justify-between py-1 border-b border-slate-300 text-slate-900">
                <span>CGST ({cgstPercent}%):</span>
                <span>
                  ₹
                  {cgstAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-300 text-slate-900">
                <span>SGST ({sgstPercent}%):</span>
                <span>
                  ₹
                  {sgstAmount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </>
          )}

          {roundOff !== 0 && (
            <div className="flex justify-between py-1 border-b border-slate-100 text-slate-500">
              <span>Round Off:</span>
              <span>
                {roundOff > 0 ? "+" : ""}
                {roundOff.toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-between py-2 border-t-2 border-b-2 border-slate-900 font-bold text-sm text-[#0F172A] bg-slate-50 px-2">
            <span>Grand Total:</span>
            <span>
              ₹
              {grandTotal.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Signature Section */}
      <div className="pt-8 flex justify-between items-end border-t border-slate-200 text-xs">
        <div className="text-slate-500 text-[10px]">
          <p>E. & O.E.</p>
          <p>Subject to Tiruppur Jurisdiction</p>
        </div>

        <div className="text-right space-y-8">
          <p className="font-bold text-[#0F172A]">For Creative Line Graphics</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-t border-slate-900 pt-1 inline-block min-w-[140px] text-center">
            Authorised Signatory
          </p>
        </div>
      </div>
    </div>
  );
}
