"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CompanyPicker } from "@/components/companies/CompanyPicker";
import { BillTypeToggle } from "@/components/invoices/BillTypeToggle";
import { InvoicePreview } from "@/components/invoices/InvoicePreview";
import { numberToWords } from "@/lib/numberToWords";
import {
  Plus,
  Trash2,
  Save,
  Send,
  Eye,
  AlertCircle,
  Banknote,
  Building,
  FileText,
} from "lucide-react";

interface LineItem {
  description: string;
  hsnSac?: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceFormProps {
  initialValues?: any;
  isEditing?: boolean;
}

// Safely convert companyId to string whether it's an object from populate or string
function getCompanyIdString(companyId: any): string {
  if (!companyId) return "";
  if (typeof companyId === "string") return companyId;
  if (typeof companyId === "object") {
    const id = companyId._id || companyId.id;
    if (id) return typeof id === "string" ? id : String(id);
  }
  return String(companyId);
}

export function InvoiceForm({
  initialValues,
  isEditing: propIsEditing,
}: InvoiceFormProps) {
  const isEditing = Boolean(propIsEditing || initialValues?._id);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);

  const [selectedCompany, setSelectedCompany] = useState<any>(
    initialValues?.companySnapshot
      ? {
          _id: getCompanyIdString(initialValues.companyId),
          ...initialValues.companySnapshot,
        }
      : null,
  );

  const [type, setType] = useState<"tax_invoice" | "labour_bill">(
    initialValues?.type || "tax_invoice",
  );
  const [labourCategory, setLabourCategory] = useState<"cash" | "credit">(
    initialValues?.labourCategory || "cash",
  );
  const [autoSuggested, setAutoSuggested] = useState(false);
  const [userSelectedType, setUserSelectedType] = useState(false);

  const [customCustomerName, setCustomCustomerName] = useState<string>(
    initialValues?.companySnapshot?.name && !initialValues?.companyId
      ? initialValues.companySnapshot.name
      : "",
  );
  const [customCustomerAddress, setCustomCustomerAddress] = useState<string>(
    initialValues?.companySnapshot?.address && !initialValues?.companyId
      ? initialValues.companySnapshot.address
      : "",
  );
  const [customCustomerPhone, setCustomCustomerPhone] = useState<string>(
    initialValues?.companySnapshot?.phone && !initialValues?.companyId
      ? initialValues.companySnapshot.phone
      : "",
  );

  const [invoiceNumber, setInvoiceNumber] = useState(
    initialValues?.number || "",
  );
  const [date, setDate] = useState(
    initialValues?.date
      ? new Date(initialValues.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
  );

  const [poNumber, setPoNumber] = useState<string>(
    initialValues?.poNumber || "",
  );
  const [poDate, setPoDate] = useState<string>(
    initialValues?.poDate
      ? new Date(initialValues.poDate).toISOString().split("T")[0]
      : "",
  );
  const [quoteNumber, setQuoteNumber] = useState<string>(
    initialValues?.quoteNumber || "",
  );
  const [quoteDate, setQuoteDate] = useState<string>(
    initialValues?.quoteDate
      ? new Date(initialValues.quoteDate).toISOString().split("T")[0]
      : "",
  );

  const [items, setItems] = useState<LineItem[]>(
    initialValues?.items || [
      {
        description: "",
        hsnSac: "4820",
        quantity: 0,
        rate: 0,
        amount: 0,
      },
    ],
  );

  const [notes, setNotes] = useState(initialValues?.notes || "");
  const [status, setStatus] = useState<"draft" | "sent" | "paid">(
    initialValues?.status ||
      (type === "labour_bill" && labourCategory === "cash" ? "paid" : "draft"),
  );

  const isTaxInvoice = type === "tax_invoice";
  const isCashLabour = type === "labour_bill" && labourCategory === "cash";

  // Derive effective company for preview & submission
  const effectiveCompany = isCashLabour
    ? {
        name: customCustomerName.trim() || "CASH SALE",
        address: customCustomerAddress.trim(),
        phone: customCustomerPhone.trim(),
        gstin: "",
        state: "Tamil Nadu",
        stateCode: "33",
      }
    : selectedCompany;

  // Auto-fetch next invoice number when type or date changes (only if not editing)
  useEffect(() => {
    if (isEditing) return;

    async function fetchNextNumber() {
      try {
        const res = await fetch(
          `/api/invoices/next-number?type=${type}&date=${date}`,
        );
        if (res.ok) {
          const data = await res.json();
          setInvoiceNumber(data.number);
        }
      } catch (err) {
        console.error("Failed to fetch next invoice number:", err);
      }
    }

    fetchNextNumber();
  }, [type, date, isEditing]);

  // Handle Company Selection
  const handleSelectCompany = (company: any) => {
    setSelectedCompany(company);
    if (!isEditing && company && !userSelectedType) {
      if (company.gstin && company.gstin.trim().length > 0) {
        setType("tax_invoice");
        setAutoSuggested(true);
      } else {
        setType("labour_bill");
        setLabourCategory("credit");
        setAutoSuggested(true);
      }
    }
  };

  // Math Calculations
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0,
  );

  const cgstPercent = isTaxInvoice ? 9 : 0;
  const sgstPercent = isTaxInvoice ? 9 : 0;

  const cgstAmount = isTaxInvoice
    ? Math.round(((subtotal * cgstPercent) / 100) * 100) / 100
    : 0;
  const sgstAmount = isTaxInvoice
    ? Math.round(((subtotal * sgstPercent) / 100) * 100) / 100
    : 0;

  const rawTotal = subtotal + cgstAmount + sgstAmount;
  const grandTotal = Math.round(rawTotal);
  const roundOff = Math.round((grandTotal - rawTotal) * 100) / 100;
  const amountInWords = numberToWords(grandTotal);

  // Line Item Handler
  const handleItemChange = (
    index: number,
    field: keyof LineItem,
    value: any,
  ) => {
    const updated = [...items];
    const item = { ...updated[index] };

    if (field === "description" || field === "hsnSac") {
      item[field] = value;
    } else {
      const numVal = value === "" ? 0 : Number(value);
      item[field] = numVal as never;

      if (field === "quantity" || field === "rate") {
        const qty = field === "quantity" ? numVal : Number(item.quantity) || 0;
        const rate = field === "rate" ? numVal : Number(item.rate) || 0;
        item.amount = Math.round(qty * rate * 100) / 100;
      }
    }

    updated[index] = item;
    setItems(updated);
  };

  const addItemRow = () => {
    setItems([
      ...items,
      {
        description: "",
        hsnSac: isTaxInvoice ? "4820" : "",
        quantity: 0,
        rate: 0,
        amount: 0,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isCashLabour && !selectedCompany) {
      const msg =
        "Please select or create a client company first for credit bills / tax invoices.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (items.length === 0 || items.some((i) => !i.description.trim())) {
      const msg = "Please ensure all line items have a description.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        type,
        labourCategory: type === "labour_bill" ? labourCategory : undefined,
        number: invoiceNumber,
        date,
        poNumber: poNumber.trim(),
        poDate: poDate || null,
        quoteNumber: quoteNumber.trim(),
        quoteDate: quoteDate || null,
        companyId: isCashLabour
          ? null
          : getCompanyIdString(
              selectedCompany?._id ||
                selectedCompany?.id ||
                initialValues?.companyId,
            ),
        customCustomerName: isCashLabour
          ? customCustomerName.trim() || "CASH SALE"
          : undefined,
        customCustomerAddress: isCashLabour
          ? customCustomerAddress.trim()
          : undefined,
        customCustomerPhone: isCashLabour
          ? customCustomerPhone.trim()
          : undefined,
        companySnapshot: effectiveCompany,
        items: items.map((i) => ({
          ...i,
          quantity: Number(i.quantity) || 0,
          rate: Number(i.rate) || 0,
          amount: Number(i.amount) || 0,
        })),
        subtotal: Number(subtotal),
        cgstPercent: isTaxInvoice ? Number(cgstPercent) : 0,
        cgstAmount: Number(cgstAmount),
        sgstPercent: isTaxInvoice ? Number(sgstPercent) : 0,
        sgstAmount: Number(sgstAmount),
        roundOff: Number(roundOff),
        grandTotal: Number(grandTotal),
        amountInWords,
        status: isCashLabour ? "paid" : status,
        notes,
      };

      const url = isEditing
        ? `/api/invoices/${initialValues._id}`
        : "/api/invoices";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save invoice");
      }

      toast.success(
        isEditing
          ? "Invoice updated successfully!"
          : "Invoice created successfully!",
      );
      router.push(`/invoices/${data._id}`);
      router.refresh();
    } catch (err: any) {
      console.error("Submit error:", err);
      setError(err.message || "An unexpected error occurred");
      toast.error(err.message || "Failed to save invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mobile Toggle for Live Preview */}
      <div className="lg:hidden flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <span className="text-xs font-semibold text-slate-700">
          Mode: {showPreviewMobile ? "Live Paper Preview" : "Form Entry"}
        </span>
        <button
          type="button"
          onClick={() => setShowPreviewMobile(!showPreviewMobile)}
          className="px-3 py-1.5 bg-[#0F172A] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
        >
          <Eye className="w-4 h-4 text-blue-400" />
          <span>{showPreviewMobile ? "Edit Form" : "View Paper Preview"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Form */}
        <form
          onSubmit={handleSubmit}
          className={`lg:col-span-6 space-y-6 ${showPreviewMobile ? "hidden lg:block" : "block"}`}
        >
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Bill Type Selection */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#0F172A] border-b border-slate-100 pb-2">
              1. Select Bill Type & Category
            </h3>
            <BillTypeToggle
              type={type}
              onChange={(newType) => {
                setType(newType);
                setUserSelectedType(true);
                setAutoSuggested(false);
                if (newType === "labour_bill") {
                  setStatus("paid");
                }
              }}
              autoSuggested={autoSuggested}
            />

            {/* Labour Bill Category Selector */}
            {type === "labour_bill" && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2">
                  Labour Bill Entry Mode:
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setLabourCategory("cash");
                      setUserSelectedType(true);
                      setStatus("paid");
                    }}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      labourCategory === "cash"
                        ? "border-[#E11D48] bg-rose-50/60 text-[#BE123C] ring-2 ring-rose-500/20"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Banknote className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Cash Bill (Counter Sale)</div>
                      <div className="text-[10px] font-normal opacity-80 mt-0.5">
                        Instant entry without company creation. Defaults to
                        Paid.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLabourCategory("credit");
                      setUserSelectedType(true);
                    }}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      labourCategory === "credit"
                        ? "border-[#0F172A] bg-slate-100 text-[#0F172A] ring-2 ring-slate-900/20"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Building className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">
                        Credit Bill (Account Ledger)
                      </div>
                      <div className="text-[10px] font-normal opacity-80 mt-0.5">
                        Select client company from directory. Tracks ledger
                        dues.
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Client Company Selection / Quick Cash Customer Input */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#0F172A] border-b border-slate-100 pb-2">
              2.{" "}
              {isCashLabour
                ? "Customer / Company Details (Quick Entry)"
                : "Client Company Selection"}
            </h3>

            {isCashLabour ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Customer / Company Name{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cash Sale"
                    value={customCustomerName}
                    onChange={(e) => setCustomCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-[#0F172A] bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Address (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="City / Area name"
                      value={customCustomerAddress}
                      onChange={(e) =>
                        setCustomCustomerAddress(e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                      Phone (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Mobile number"
                      value={customCustomerPhone}
                      onChange={(e) => setCustomCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-mono focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <CompanyPicker
                selectedCompanyId={selectedCompany?._id}
                onSelectCompany={handleSelectCompany}
              />
            )}
          </div>

          {/* 3. Invoice Details & Numbering */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#0F172A] border-b border-slate-100 pb-2">
              3. Invoice Details & Dates
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Invoice Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold text-[#0F172A] bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Invoice Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  P.O. Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. PO-98214 (Optional)"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono text-[#0F172A] bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  P.O. Issue Date (Optional)
                </label>
                <input
                  type="date"
                  value={poDate}
                  onChange={(e) => setPoDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* 4. Particulars & Line Items */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-serif font-bold text-base text-[#0F172A]">
                4. Particulars / Job Items
              </h3>
              <button
                type="button"
                onClick={addItemRow}
                className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Item #{index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        className="text-rose-500 hover:text-rose-700 p-1 rounded transition-colors"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Particulars / Printing job description..."
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(index, "description", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-12 gap-3 items-center">
                    {isTaxInvoice && (
                      <div className="col-span-4">
                        <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                          HSN/SAC
                        </label>
                        <input
                          type="text"
                          value={item.hsnSac || ""}
                          onChange={(e) =>
                            handleItemChange(index, "hsnSac", e.target.value)
                          }
                          className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-xs bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    )}

                    <div className={isTaxInvoice ? "col-span-4" : "col-span-6"}>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0"
                        value={item.quantity === 0 ? "" : item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", e.target.value)
                        }
                        className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-right bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div className={isTaxInvoice ? "col-span-4" : "col-span-6"}>
                      <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                        Rate (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="0"
                        value={item.rate === 0 ? "" : item.rate}
                        onChange={(e) =>
                          handleItemChange(index, "rate", e.target.value)
                        }
                        className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-right bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div className="col-span-12 font-semibold text-right pt-1 border-t border-slate-200">
                      <span className="text-[10px] text-slate-500 block">
                        Amount:
                      </span>
                      <span className="font-mono text-sm text-[#0F172A]">
                        ₹
                        {(Number(item.amount) || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addItemRow}
                className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-blue-400 text-slate-600 hover:text-blue-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors bg-white"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Particular Row</span>
              </button>
            </div>
          </div>

          {/* 5. Notes & Status */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="font-serif font-bold text-base text-[#0F172A] border-b border-slate-100 pb-2">
              5. Additional Details
            </h3>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Bill Notes / Terms
              </label>
              <textarea
                rows={2}
                placeholder="Optional notes or terms..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Payment Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="draft">Draft / Unsent</option>
                <option value="sent">Sent / Pending Payment</option>
                <option value="paid">Paid (Payment Received)</option>
              </select>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-xl font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>
                {loading
                  ? "Saving Invoice..."
                  : isEditing
                    ? "Update Invoice"
                    : isCashLabour
                      ? "Save & Generate Cash Bill"
                      : "Save & Generate Invoice"}
              </span>
            </button>
          </div>
        </form>

        {/* Right Column: Real-Time Printed Paper Replica */}
        <div
          className={`lg:col-span-6 space-y-3 sticky top-6 ${
            showPreviewMobile ? "block" : "hidden lg:block"
          }`}
        >
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-serif font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Live Printed Bill Replica</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Auto-updating as you type
            </span>
          </div>

          <InvoicePreview
            type={type}
            number={invoiceNumber}
            date={date}
            poNumber={poNumber}
            poDate={poDate}
            company={effectiveCompany}
            items={items}
            subtotal={subtotal}
            cgstPercent={cgstPercent}
            cgstAmount={cgstAmount}
            sgstPercent={sgstPercent}
            sgstAmount={sgstAmount}
            roundOff={roundOff}
            grandTotal={grandTotal}
            amountInWords={amountInWords}
            notes={notes}
          />
        </div>
      </div>
    </div>
  );
}
