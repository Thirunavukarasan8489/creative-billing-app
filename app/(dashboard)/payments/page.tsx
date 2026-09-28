"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  CreditCard,
  Search,
  Calendar,
  Building2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Trash2,
  AlertCircle,
  Filter,
  Layers,
  Zap,
  Check,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileText,
  Plus,
  Sparkles,
  IndianRupee,
  Receipt,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";

interface Company {
  _id: string;
  name: string;
  phone?: string;
  gstin?: string;
  address?: string;
}

interface InvoiceItem {
  _id: string;
  number: string;
  type: "tax_invoice" | "labour_bill";
  date: string;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  status: "draft" | "sent" | "paid" | "cancelled";
  companySnapshot?: { name: string; gstin?: string };
}

interface PaymentRecord {
  _id: string;
  amountPaid: number;
  date: string;
  mode: "cash" | "upi" | "bank_transfer" | "cheque";
  referenceNo?: string;
  notes?: string;
  createdAt: string;
  invoiceId?: {
    _id: string;
    number: string;
    type: string;
    date: string;
    grandTotal: number;
    paidAmount: number;
    balanceAmount: number;
    status: string;
    companySnapshot?: { name: string };
  };
  companyId?: {
    _id: string;
    name: string;
    gstin?: string;
    phone?: string;
  };
}

export default function PaymentsPage() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"entry" | "history">("entry");

  // Companies & Invoices state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [companySearch, setCompanySearch] = useState("");

  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Strategy mode inside entry: "month" | "multi" | "fifo"
  const [entryMode, setEntryMode] = useState<"month" | "multi" | "fifo">("month");

  // Multi-bill custom selections: Map invoiceId -> allocated amount
  const [selectedBills, setSelectedBills] = useState<{ [id: string]: number }>({});

  // Month-wise expanded state
  const [expandedMonths, setExpandedMonths] = useState<{ [monthKey: string]: boolean }>({});

  // FIFO Lumpsum state
  const [lumpSumAmount, setLumpSumAmount] = useState<string>("");

  // Common payment transaction details
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMode, setPaymentMode] = useState<
    "bank_transfer" | "upi" | "cash" | "cheque"
  >("bank_transfer");
  const [referenceNo, setReferenceNo] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Payment History state
  const [paymentsList, setPaymentsList] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyModeFilter, setHistoryModeFilter] = useState("all");
  const [stats, setStats] = useState({
    totalRecords: 0,
    totalAllTime: 0,
    totalThisMonth: 0,
    totalToday: 0,
  });

  // Fetch Companies on mount
  useEffect(() => {
    async function loadCompanies() {
      setLoadingCompanies(true);
      try {
        const res = await fetch("/api/companies?limit=200");
        const data = await res.json();
        if (res.ok && data.companies) {
          setCompanies(data.companies);
        }
      } catch (err) {
        console.error("Failed to load companies:", err);
      } finally {
        setLoadingCompanies(false);
      }
    }
    loadCompanies();
  }, []);

  // Fetch Payment History
  const fetchPaymentHistory = async () => {
    setLoadingPayments(true);
    try {
      const res = await fetch("/api/payments?limit=150");
      const data = await res.json();
      if (res.ok) {
        setPaymentsList(data.payments || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  // Fetch unpaid invoices when company is selected
  useEffect(() => {
    if (!selectedCompanyId) {
      setInvoices([]);
      setSelectedBills({});
      return;
    }

    async function loadCompanyInvoices() {
      setLoadingInvoices(true);
      setSelectedBills({});
      try {
        const res = await fetch(
          `/api/invoices?companyId=${selectedCompanyId}&status=unpaid&sortOrder=asc`
        );
        const data = await res.json();
        if (res.ok) {
          // Exclude cancelled bills and bills with 0 balance
          const valid = (data.invoices || []).filter(
            (inv: InvoiceItem) =>
              inv.status !== "cancelled" && (inv.balanceAmount || 0) > 0
          );
          setInvoices(valid);

          // By default expand all months
          const expanded: { [key: string]: boolean } = {};
          valid.forEach((inv: InvoiceItem) => {
            const mKey = getMonthKey(inv.date);
            expanded[mKey] = true;
          });
          setExpandedMonths(expanded);
        }
      } catch (err) {
        console.error("Failed to load company invoices:", err);
        toast.error("Error loading unpaid bills");
      } finally {
        setLoadingInvoices(false);
      }
    }

    loadCompanyInvoices();
  }, [selectedCompanyId]);

  // Selected company object
  const selectedCompany = useMemo(() => {
    return companies.find((c) => c._id === selectedCompanyId);
  }, [companies, selectedCompanyId]);

  // Total balance due for selected company
  const totalCompanyBalanceDue = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + (inv.balanceAmount || 0), 0);
  }, [invoices]);

  // Format month key helper
  function getMonthKey(dateStr: string) {
    const d = new Date(dateStr);
    const month = d.toLocaleString("en-IN", { month: "long" });
    const year = d.getFullYear();
    return `${month} ${year}`;
  }

  // Group invoices by Month
  const monthGroupedInvoices = useMemo(() => {
    const groups: {
      [monthKey: string]: {
        monthKey: string;
        bills: InvoiceItem[];
        totalBilled: number;
        totalPaid: number;
        totalBalance: number;
      };
    } = {};

    invoices.forEach((inv) => {
      const mKey = getMonthKey(inv.date);
      if (!groups[mKey]) {
        groups[mKey] = {
          monthKey: mKey,
          bills: [],
          totalBilled: 0,
          totalPaid: 0,
          totalBalance: 0,
        };
      }
      groups[mKey].bills.push(inv);
      groups[mKey].totalBilled += inv.grandTotal || 0;
      groups[mKey].totalPaid += inv.paidAmount || 0;
      groups[mKey].totalBalance += inv.balanceAmount || 0;
    });

    return Object.values(groups);
  }, [invoices]);

  // Handle Month Quick Settle: Select all bills in a specific month
  const handleSelectFullMonth = (monthKey: string) => {
    const group = monthGroupedInvoices.find((g) => g.monthKey === monthKey);
    if (!group) return;

    const newSelections: { [id: string]: number } = { ...selectedBills };
    // Add all bills for this month at full balance
    group.bills.forEach((b) => {
      newSelections[b._id] = b.balanceAmount;
    });

    setSelectedBills(newSelections);
    setNotes(`Settlement for ${monthKey}`);
    toast.success(`Selected all ${group.bills.length} bills for ${monthKey}`);
  };

  // Toggle single bill selection in custom or month mode
  const handleToggleBill = (invoiceId: string, balance: number) => {
    setSelectedBills((prev) => {
      const copy = { ...prev };
      if (copy[invoiceId] !== undefined) {
        delete copy[invoiceId];
      } else {
        copy[invoiceId] = balance;
      }
      return copy;
    });
  };

  // Update specific allocated amount for a bill
  const handleBillAmountChange = (
    invoiceId: string,
    val: number,
    maxBalance: number
  ) => {
    const safeVal = Math.max(0, Math.min(val, maxBalance));
    setSelectedBills((prev) => ({
      ...prev,
      [invoiceId]: safeVal,
    }));
  };

  // Select all unpaid bills
  const handleSelectAllBills = () => {
    const all: { [id: string]: number } = {};
    invoices.forEach((inv) => {
      all[inv._id] = inv.balanceAmount;
    });
    setSelectedBills(all);
    toast.success(`Selected all ${invoices.length} unpaid bills`);
  };

  // Clear selections
  const handleClearSelection = () => {
    setSelectedBills({});
  };

  // Calculate FIFO allocation based on lumpSumAmount
  const fifoAllocations = useMemo(() => {
    const num = parseFloat(lumpSumAmount);
    if (isNaN(num) || num <= 0) return { allocations: {}, remaining: 0, allocatedTotal: 0 };

    let runningAmt = num;
    const allocs: { [id: string]: number } = {};

    for (const inv of invoices) {
      if (runningAmt <= 0) break;
      const due = inv.balanceAmount || 0;
      const payForThis = Math.min(runningAmt, due);
      allocs[inv._id] = Math.round(payForThis * 100) / 100;
      runningAmt -= payForThis;
    }

    const allocatedTotal = Object.values(allocs).reduce((a, b) => a + b, 0);
    return {
      allocations: allocs,
      remaining: Math.max(0, Math.round(runningAmt * 100) / 100),
      allocatedTotal,
    };
  }, [lumpSumAmount, invoices]);

  // Effective allocations to be paid based on current mode
  const currentAllocations = useMemo(() => {
    if (entryMode === "fifo") {
      return fifoAllocations.allocations;
    }
    return selectedBills;
  }, [entryMode, fifoAllocations, selectedBills]);

  // Total amount to be paid right now
  const totalAmountToPay = useMemo(() => {
    return Object.values(currentAllocations).reduce((sum, val) => sum + (val || 0), 0);
  }, [currentAllocations]);

  const selectedBillsCount = useMemo(() => {
    return Object.keys(currentAllocations).filter((k) => (currentAllocations[k] || 0) > 0)
      .length;
  }, [currentAllocations]);

  // Submit Payment Handler
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCompanyId) {
      toast.error("Please select a client company");
      return;
    }

    const allocList = Object.entries(currentAllocations)
      .filter(([_, amt]) => amt > 0)
      .map(([invoiceId, amountPaid]) => ({ invoiceId, amountPaid }));

    if (allocList.length === 0) {
      toast.error("Please select at least one bill or enter a payment amount");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          date: paymentDate,
          mode: paymentMode,
          referenceNo: referenceNo.trim(),
          notes: notes.trim(),
          payments: allocList,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record payment");
      }

      toast.success(
        `Successfully recorded ₹${data.totalAllocated?.toLocaleString(
          "en-IN"
        )} across ${data.count} bill(s)!`
      );

      // Reset selection and form
      setSelectedBills({});
      setLumpSumAmount("");
      setReferenceNo("");
      setNotes("");

      // Refresh invoices for company and payment history
      const resInvoices = await fetch(
        `/api/invoices?companyId=${selectedCompanyId}&status=unpaid&sortOrder=asc`
      );
      const dataInvoices = await resInvoices.json();
      if (resInvoices.ok) {
        const valid = (dataInvoices.invoices || []).filter(
          (inv: InvoiceItem) =>
            inv.status !== "cancelled" && (inv.balanceAmount || 0) > 0
        );
        setInvoices(valid);
      }

      fetchPaymentHistory();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete payment handler
  const handleDeletePayment = async (paymentId: string, amount: number) => {
    if (
      !confirm(
        `Are you sure you want to delete this payment of ₹${amount.toLocaleString(
          "en-IN"
        )}? The bill's balance will be automatically restored.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete payment");

      toast.success("Payment deleted & balance restored");

      // Refresh data
      fetchPaymentHistory();
      if (selectedCompanyId) {
        const resInvoices = await fetch(
          `/api/invoices?companyId=${selectedCompanyId}&status=unpaid&sortOrder=asc`
        );
        const dataInvoices = await resInvoices.json();
        if (resInvoices.ok) {
          setInvoices(
            (dataInvoices.invoices || []).filter(
              (inv: InvoiceItem) =>
                inv.status !== "cancelled" && (inv.balanceAmount || 0) > 0
            )
          );
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete payment");
    }
  };

  // Filtered payment history
  const filteredHistory = useMemo(() => {
    return paymentsList.filter((p) => {
      const term = historySearch.toLowerCase().trim();
      const matchSearch =
        !term ||
        p.referenceNo?.toLowerCase().includes(term) ||
        p.notes?.toLowerCase().includes(term) ||
        p.invoiceId?.number?.toLowerCase().includes(term) ||
        p.companyId?.name?.toLowerCase().includes(term) ||
        p.invoiceId?.companySnapshot?.name?.toLowerCase().includes(term);

      const matchMode =
        historyModeFilter === "all" || p.mode === historyModeFilter;

      return matchSearch && matchMode;
    });
  }, [paymentsList, historySearch, historyModeFilter]);

  // Companies filtered for search
  const filteredCompanies = useMemo(() => {
    if (!companySearch.trim()) return companies;
    const term = companySearch.toLowerCase().trim();
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.gstin?.toLowerCase().includes(term) ||
        c.phone?.toLowerCase().includes(term)
    );
  }, [companies, companySearch]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <span>Record Payment & Collections</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record client settlements: single bills, entire month lump-sum, or FIFO auto-allocation
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab("entry")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === "entry"
                ? "bg-white text-blue-700 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-[#0F172A]"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Make Payment Entry</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === "history"
                ? "bg-white text-blue-700 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-[#0F172A]"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Payment History ({stats.totalRecords})</span>
          </button>
        </div>
      </div>

      {/* Top Stat KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">
            Today's Collections
          </span>
          <p className="font-mono text-lg font-bold text-emerald-700 mt-0.5">
            ₹{stats.totalToday.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">
            This Month
          </span>
          <p className="font-mono text-lg font-bold text-blue-700 mt-0.5">
            ₹{stats.totalThisMonth.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">
            All-Time Collections
          </span>
          <p className="font-mono text-lg font-bold text-[#0F172A] mt-0.5">
            ₹{stats.totalAllTime.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold uppercase text-slate-500 block">
            Total Receipts
          </span>
          <p className="font-mono text-lg font-bold text-purple-700 mt-0.5">
            {stats.totalRecords} Records
          </p>
        </div>
      </div>

      {activeTab === "entry" ? (
        /* ========================================================================= */
        /* PAYMENT ENTRY TAB                                                         */
        /* ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Company & Bills Selection (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Step 1: Select Client Company Card */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-black">
                    1
                  </span>
                  <span>Select Client Company</span>
                </span>
                {selectedCompanyId && (
                  <button
                    onClick={() => {
                      setSelectedCompanyId("");
                      setCompanySearch("");
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:underline"
                  >
                    Change Company
                  </button>
                )}
              </div>

              {!selectedCompanyId ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search company by name, GSTIN, or phone..."
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                    {loadingCompanies ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        Loading companies directory...
                      </div>
                    ) : filteredCompanies.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No companies found matching "{companySearch}"
                      </div>
                    ) : (
                      filteredCompanies.map((c) => (
                        <div
                          key={c._id}
                          onClick={() => setSelectedCompanyId(c._id)}
                          className="p-2.5 hover:bg-blue-50/60 cursor-pointer transition-colors flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-bold text-slate-900">{c.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {c.gstin ? `GST: ${c.gstin}` : "Non-GST Client"}{" "}
                              {c.phone && `• ${c.phone}`}
                            </p>
                          </div>
                          <span className="text-[11px] text-blue-600 font-bold flex items-center gap-1 group">
                            Select <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* Selected Company Details Banner */
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-[#0F172A]">
                      {selectedCompany?.name}
                    </h3>
                    <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                      {selectedCompany?.gstin && `GST: ${selectedCompany.gstin} • `}
                      {selectedCompany?.phone || "No phone listed"}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Total Unpaid Balance
                    </span>
                    <p className="font-mono text-lg font-extrabold text-[#E11D48]">
                      ₹{totalCompanyBalanceDue.toLocaleString("en-IN")}
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {invoices.length} unpaid bill{invoices.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Bills Selection & Payment Modes */}
            {selectedCompanyId && (
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-black">
                      2
                    </span>
                    <span>Choose Settlement Concept</span>
                  </span>

                  {/* Mode Tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-bold w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setEntryMode("month")}
                      className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-md text-[11px] flex items-center justify-center gap-1 transition-all ${
                        entryMode === "month"
                          ? "bg-white text-blue-700 shadow-2xs border border-slate-200"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Calendar className="w-3 h-3 text-blue-600" />
                      <span>Month-Wise</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryMode("multi")}
                      className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-md text-[11px] flex items-center justify-center gap-1 transition-all ${
                        entryMode === "multi"
                          ? "bg-white text-blue-700 shadow-2xs border border-slate-200"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Layers className="w-3 h-3 text-purple-600" />
                      <span>Select Bills</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryMode("fifo")}
                      className={`flex-1 sm:flex-initial px-2.5 py-1 rounded-md text-[11px] flex items-center justify-center gap-1 transition-all ${
                        entryMode === "fifo"
                          ? "bg-white text-blue-700 shadow-2xs border border-slate-200"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>Auto-FIFO</span>
                    </button>
                  </div>
                </div>

                {loadingInvoices ? (
                  <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Loading unpaid bills for {selectedCompany?.name}...</span>
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="py-8 text-center text-xs text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200 p-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                    <p className="font-bold">All Bills Cleared!</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      {selectedCompany?.name} has no outstanding unpaid bills.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* MODE 1: MONTH-WISE SETTLEMENT CONCEPT */}
                    {entryMode === "month" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <p className="text-[11px]">
                            Bills grouped by month. Click{" "}
                            <strong>"Settle Full Month"</strong> or expand to pick single bills.
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleSelectAllBills}
                              className="text-[11px] font-bold text-blue-600 hover:underline"
                            >
                              Select All Months
                            </button>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={handleClearSelection}
                              className="text-[11px] font-bold text-slate-500 hover:underline"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {monthGroupedInvoices.map((group) => {
                            const isExpanded = expandedMonths[group.monthKey] ?? true;
                            const isMonthFullySelected = group.bills.every(
                              (b) => selectedBills[b._id] === b.balanceAmount
                            );

                            return (
                              <div
                                key={group.monthKey}
                                className={`border rounded-xl overflow-hidden transition-all ${
                                  isMonthFullySelected
                                    ? "border-emerald-300 bg-emerald-50/20"
                                    : "border-slate-200 bg-white"
                                }`}
                              >
                                {/* Month Accordion Header */}
                                <div className="p-3 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100">
                                  <div
                                    onClick={() =>
                                      setExpandedMonths((prev) => ({
                                        ...prev,
                                        [group.monthKey]: !isExpanded,
                                      }))
                                    }
                                    className="flex items-center gap-2 cursor-pointer select-none"
                                  >
                                    <span className="p-1 rounded bg-white border border-slate-200 text-slate-600">
                                      {isExpanded ? (
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      )}
                                    </span>
                                    <div>
                                      <span className="font-bold text-xs uppercase tracking-wide text-[#0F172A]">
                                        {group.monthKey}
                                      </span>
                                      <span className="text-[10px] text-slate-500 font-mono ml-2">
                                        ({group.bills.length} Bill{group.bills.length !== 1 ? "s" : ""})
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between w-full sm:w-auto gap-3">
                                    <div className="text-right">
                                      <span className="text-[9px] uppercase font-bold text-slate-500 block">
                                        Month Due
                                      </span>
                                      <span className="font-mono text-xs font-bold text-[#E11D48]">
                                        ₹{group.totalBalance.toLocaleString("en-IN")}
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => handleSelectFullMonth(group.monthKey)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                        isMonthFullySelected
                                          ? "bg-emerald-600 text-white shadow-xs"
                                          : "bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200"
                                      }`}
                                    >
                                      {isMonthFullySelected ? (
                                        <>
                                          <Check className="w-3.5 h-3.5" />
                                          <span>Month Selected</span>
                                        </>
                                      ) : (
                                        <>
                                          <Zap className="w-3 h-3 text-amber-500" />
                                          <span>Settle Month (₹{group.totalBalance.toLocaleString("en-IN")})</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {/* Month Bills List */}
                                {isExpanded && (
                                  <div className="divide-y divide-slate-100 p-2 text-xs">
                                    {group.bills.map((bill) => {
                                      const isSelected = selectedBills[bill._id] !== undefined;
                                      const currentAmt = selectedBills[bill._id] ?? bill.balanceAmount;

                                      return (
                                        <div
                                          key={bill._id}
                                          className={`p-2 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 transition-colors ${
                                            isSelected ? "bg-blue-50/50" : "hover:bg-slate-50"
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="checkbox"
                                              checked={isSelected}
                                              onChange={() =>
                                                handleToggleBill(bill._id, bill.balanceAmount)
                                              }
                                              className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                                            />
                                            <div>
                                              <div className="flex items-center gap-1.5">
                                                <span className="font-mono font-bold text-slate-900">
                                                  {bill.number}
                                                </span>
                                                <span
                                                  className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                                                    bill.type === "tax_invoice"
                                                      ? "bg-[#0F172A] text-white"
                                                      : "bg-[#E11D48] text-white"
                                                  }`}
                                                >
                                                  {bill.type === "tax_invoice" ? "Tax" : "Labour"}
                                                </span>
                                              </div>
                                              <span className="text-[10px] text-slate-500 font-mono">
                                                Date: {new Date(bill.date).toLocaleDateString("en-IN")} • Billed: ₹
                                                {bill.grandTotal.toLocaleString("en-IN")}
                                              </span>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                            <div className="text-right">
                                              <span className="text-[9px] font-bold text-slate-500 block uppercase">
                                                Balance Due
                                              </span>
                                              <span className="font-mono font-bold text-[#E11D48]">
                                                ₹{bill.balanceAmount.toLocaleString("en-IN")}
                                              </span>
                                            </div>

                                            {isSelected ? (
                                              <div className="flex items-center gap-1">
                                                <span className="text-[10px] font-bold text-slate-500">
                                                  Pay ₹
                                                </span>
                                                <input
                                                  type="number"
                                                  min={1}
                                                  max={bill.balanceAmount}
                                                  value={currentAmt}
                                                  onChange={(e) =>
                                                    handleBillAmountChange(
                                                      bill._id,
                                                      parseFloat(e.target.value) || 0,
                                                      bill.balanceAmount
                                                    )
                                                  }
                                                  className="w-24 px-2 py-1 text-xs font-mono font-bold border border-blue-400 rounded bg-white text-right focus:ring-1 focus:ring-blue-500"
                                                />
                                              </div>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  handleToggleBill(bill._id, bill.balanceAmount)
                                                }
                                                className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold"
                                              >
                                                Pay Bill
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* MODE 2: MULTI-BILL CHECKBOX SELECTION */}
                    {entryMode === "multi" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <p className="text-[11px]">
                            Check individual bills to pay. You can adjust custom payment amounts per bill.
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleSelectAllBills}
                              className="text-[11px] font-bold text-blue-600 hover:underline"
                            >
                              Select All
                            </button>
                            <span>•</span>
                            <button
                              type="button"
                              onClick={handleClearSelection}
                              className="text-[11px] font-bold text-slate-500 hover:underline"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-100 text-[#0F172A] font-bold uppercase text-[10px]">
                              <tr>
                                <th className="p-2.5 text-center w-8">
                                  <input
                                    type="checkbox"
                                    checked={
                                      invoices.length > 0 &&
                                      invoices.every((b) => selectedBills[b._id] !== undefined)
                                    }
                                    onChange={(e) => {
                                      if (e.target.checked) handleSelectAllBills();
                                      else handleClearSelection();
                                    }}
                                    className="cursor-pointer"
                                  />
                                </th>
                                <th className="p-2.5">Bill No.</th>
                                <th className="p-2.5">Date</th>
                                <th className="p-2.5 text-right">Grand Total (₹)</th>
                                <th className="p-2.5 text-right">Balance Due (₹)</th>
                                <th className="p-2.5 text-right">Payment Amount (₹)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-sans">
                              {invoices.map((bill) => {
                                const isSelected = selectedBills[bill._id] !== undefined;
                                const currentAmt = selectedBills[bill._id] ?? bill.balanceAmount;

                                return (
                                  <tr
                                    key={bill._id}
                                    className={`transition-colors ${
                                      isSelected ? "bg-blue-50/60" : "hover:bg-slate-50"
                                    }`}
                                  >
                                    <td className="p-2.5 text-center">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() =>
                                          handleToggleBill(bill._id, bill.balanceAmount)
                                        }
                                        className="cursor-pointer"
                                      />
                                    </td>
                                    <td className="p-2.5 font-mono font-bold text-[#0F172A]">
                                      {bill.number}
                                    </td>
                                    <td className="p-2.5 font-mono text-slate-600">
                                      {new Date(bill.date).toLocaleDateString("en-IN")}
                                    </td>
                                    <td className="p-2.5 font-mono font-bold text-right text-slate-700">
                                      ₹{bill.grandTotal.toLocaleString("en-IN")}
                                    </td>
                                    <td className="p-2.5 font-mono font-bold text-right text-[#E11D48]">
                                      ₹{bill.balanceAmount.toLocaleString("en-IN")}
                                    </td>
                                    <td className="p-2.5 text-right">
                                      {isSelected ? (
                                        <input
                                          type="number"
                                          min={1}
                                          max={bill.balanceAmount}
                                          value={currentAmt}
                                          onChange={(e) =>
                                            handleBillAmountChange(
                                              bill._id,
                                              parseFloat(e.target.value) || 0,
                                              bill.balanceAmount
                                            )
                                          }
                                          className="w-28 px-2 py-1 text-xs font-mono font-bold border border-blue-400 rounded bg-white text-right focus:ring-1 focus:ring-blue-500"
                                        />
                                      ) : (
                                        <span className="text-slate-400 font-mono">—</span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* MODE 3: AUTO-FIFO LUMPSUM SETTLEMENT */}
                    {entryMode === "fifo" && (
                      <div className="space-y-4">
                        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                            <Zap className="w-4 h-4 text-amber-600" />
                            <span>First-In, First-Out (FIFO) Lump-Sum Settlement</span>
                          </div>
                          <p className="text-[11px] text-amber-800 leading-relaxed">
                            Enter the total payment received from <strong>{selectedCompany?.name}</strong>.
                            The system will automatically allocate the funds to clear the oldest unpaid bills first!
                          </p>

                          <div className="pt-1">
                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                              Total Lump-Sum Received (₹):
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-2 text-sm font-bold text-slate-400 font-mono">
                                ₹
                              </span>
                              <input
                                type="number"
                                min={1}
                                placeholder={`e.g. 50000 (Total due: ₹${totalCompanyBalanceDue.toLocaleString(
                                  "en-IN"
                                )})`}
                                value={lumpSumAmount}
                                onChange={(e) => setLumpSumAmount(e.target.value)}
                                className="w-full pl-8 pr-4 py-2 border-2 border-amber-300 rounded-lg text-sm font-mono font-bold text-slate-900 focus:outline-hidden focus:border-amber-500 bg-white"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Live Allocation Preview */}
                        {parseFloat(lumpSumAmount) > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-slate-700 uppercase text-[10px]">
                                Live FIFO Allocation Breakdown
                              </span>
                              <span className="font-mono text-[11px] font-bold text-blue-700">
                                Allocated: ₹{fifoAllocations.allocatedTotal.toLocaleString("en-IN")}{" "}
                                {fifoAllocations.remaining > 0 && (
                                  <span className="text-emerald-700">
                                    (Unused Credit: ₹
                                    {fifoAllocations.remaining.toLocaleString("en-IN")})
                                  </span>
                                )}
                              </span>
                            </div>

                            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden text-xs max-h-56 overflow-y-auto">
                              {invoices.map((bill) => {
                                const alloc = fifoAllocations.allocations[bill._id] || 0;
                                const isFull = alloc === bill.balanceAmount && alloc > 0;
                                const isPartial = alloc > 0 && alloc < bill.balanceAmount;

                                return (
                                  <div
                                    key={bill._id}
                                    className={`p-2.5 flex items-center justify-between ${
                                      isFull
                                        ? "bg-emerald-50/60"
                                        : isPartial
                                        ? "bg-amber-50/60"
                                        : "bg-slate-50/30 opacity-60"
                                    }`}
                                  >
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono font-bold text-slate-900">
                                          {bill.number}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-mono">
                                          ({new Date(bill.date).toLocaleDateString("en-IN")})
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-slate-500 font-mono">
                                        Due: ₹{bill.balanceAmount.toLocaleString("en-IN")}
                                      </span>
                                    </div>

                                    <div className="text-right">
                                      {isFull ? (
                                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                          <Check className="w-3 h-3" /> Fully Cleared (₹
                                          {alloc.toLocaleString("en-IN")})
                                        </span>
                                      ) : isPartial ? (
                                        <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                          Partial: ₹{alloc.toLocaleString("en-IN")} (₹
                                          {(bill.balanceAmount - alloc).toLocaleString("en-IN")}{" "}
                                          remains)
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 text-[10px] font-mono">
                                          Uncovered
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Universal Payment Entry Details Form (5 cols) */}
          <div className="lg:col-span-5 sticky top-20">
            <form
              onSubmit={handleRecordPayment}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 text-xs"
            >
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="font-serif font-bold text-base text-[#0F172A] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <span>Payment Transaction</span>
                </h3>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Step 3
                </span>
              </div>

              {/* Total Payment Due Summary Banner */}
              <div className="p-4 bg-gradient-to-br from-slate-900 to-[#0F172A] text-white rounded-xl shadow-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Total Settlement Amount
                </span>
                <p className="font-mono text-2xl sm:text-3xl font-extrabold text-emerald-400">
                  ₹{totalAmountToPay.toLocaleString("en-IN")}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-slate-800">
                  <span>
                    Selected: <strong>{selectedBillsCount} bill(s)</strong>
                  </span>
                  <span>
                    Company:{" "}
                    <strong>{selectedCompany?.name || "None selected"}</strong>
                  </span>
                </div>
              </div>

              {/* Payment Date */}
              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1 text-[11px]">
                  Payment Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1 text-[11px]">
                  Payment Mode <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "bank_transfer", label: "Bank Transfer (NEFT)" },
                    { id: "upi", label: "UPI / GPay" },
                    { id: "cash", label: "Cash" },
                    { id: "cheque", label: "Cheque" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMode(m.id as any)}
                      className={`p-2 rounded-lg text-[11px] font-bold border transition-all text-center ${
                        paymentMode === m.id
                          ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference / UTR / Cheque Number */}
              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1 text-[11px]">
                  Reference / UTR / Cheque No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR1284729482 or Cheque #004512"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes & Remarks */}
              <div>
                <label className="block font-semibold uppercase text-slate-700 mb-1 text-[11px]">
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Settled full July bills via Federal Bank transfer..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting || totalAmountToPay <= 0 || !selectedCompanyId}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Recording Payment...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Confirm & Record Payment (₹
                      {totalAmountToPay.toLocaleString("en-IN")})
                    </span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-slate-400 text-center leading-tight">
                Instantly updates bill balances, sets cleared bills to Paid, and records accounting ledger entries.
              </p>
            </form>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* PAYMENT HISTORY & RECEIPTS TAB                                            */
        /* ========================================================================= */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#0F172A] flex items-center gap-2">
                <Receipt className="w-5 h-5 text-purple-600" />
                <span>Recorded Payment Receipts</span>
              </h2>
              <p className="text-xs text-slate-500">
                Audit log of all counter payments and settlements
              </p>
            </div>

            {/* History Filter & Search */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search receipt, bill, client..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={historyModeFilter}
                onChange={(e) => setHistoryModeFilter(e.target.value)}
                className="py-1.5 px-3 text-xs border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Modes</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cash">Cash</option>
                <option value="cheque">Cheque</option>
              </select>

              <button
                onClick={fetchPaymentHistory}
                className="p-2 border border-slate-300 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                title="Refresh History"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loadingPayments ? (
            <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading payment records...</span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-semibold text-slate-600">No payment records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left min-w-[760px]">
                <thead className="bg-slate-100 text-[#0F172A] font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Client Company</th>
                    <th className="p-3">Bill Number</th>
                    <th className="p-3 text-right">Amount Paid (₹)</th>
                    <th className="p-3 text-center">Mode</th>
                    <th className="p-3">Reference / Remarks</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredHistory.map((p) => {
                    const compName =
                      p.companyId?.name ||
                      p.invoiceId?.companySnapshot?.name ||
                      "N/A";

                    return (
                      <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono text-slate-700 whitespace-nowrap">
                          {new Date(p.date || p.createdAt).toLocaleDateString("en-IN")}
                        </td>
                        <td className="p-3 font-semibold text-slate-900">
                          {compName}
                        </td>
                        <td className="p-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {p.invoiceId ? (
                            <Link
                              href={`/invoices/${p.invoiceId._id}`}
                              className="hover:underline flex items-center gap-1 group"
                              title="View Invoice Detail"
                            >
                              <span>{p.invoiceId.number}</span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>
                          ) : (
                            <span className="text-slate-400">Bill Removed</span>
                          )}
                        </td>
                        <td className="p-3 font-mono font-bold text-right text-emerald-700">
                          ₹{p.amountPaid.toLocaleString("en-IN")}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              p.mode === "upi"
                                ? "bg-purple-100 text-purple-800"
                                : p.mode === "cash"
                                ? "bg-emerald-100 text-emerald-800"
                                : p.mode === "cheque"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {p.mode.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs truncate">
                          {p.referenceNo && (
                            <span className="font-mono font-bold text-slate-800 mr-1.5">
                              [{p.referenceNo}]
                            </span>
                          )}
                          <span>{p.notes || "—"}</span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeletePayment(p._id, p.amountPaid)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Payment (Reverts Bill Balance)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
