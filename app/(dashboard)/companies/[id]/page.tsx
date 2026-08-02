import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, ArrowLeft, Plus, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { dbConnect } from "@/lib/db";
import Company from "@/lib/models/Company";
import Invoice from "@/lib/models/Invoice";

export const revalidate = 0;

async function getCompanyData(id: string) {
  await dbConnect();
  const company = await Company.findById(id).lean();
  if (!company) return null;

  const invoices = await Invoice.find({ companyId: id }).sort({ date: -1 }).lean();

  const totalBilled = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const outstanding = totalBilled - totalPaid;

  return {
    company: JSON.parse(JSON.stringify(company)),
    invoices: JSON.parse(JSON.stringify(invoices)),
    stats: {
      totalBilled,
      totalPaid,
      outstanding,
    },
  };
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCompanyData(id);

  if (!data) {
    notFound();
  }

  const { company, invoices, stats } = data;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/companies"
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#1F4D3D] flex items-center gap-2">
              <Building2 className="w-6 h-6 text-[#C2196B]" />
              <span>{company.name}</span>
            </h1>
            <p className="text-xs text-gray-500 font-mono">
              Ph: {company.phone} | State: {company.state} ({company.stateCode})
            </p>
          </div>
        </div>

        <Link
          href={`/invoices/new?companyId=${company._id}`}
          className="px-4 py-2 bg-[#1F4D3D] hover:bg-[#16382C] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>New Invoice For Company</span>
        </Link>
      </div>

      {/* Company Info Card & Ledger Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
            Company Info
          </span>
          <p className="text-xs text-gray-700 whitespace-pre-line">{company.address}</p>
          {company.gstin ? (
            <span className="inline-block bg-[#1F4D3D] text-white text-[10px] uppercase font-mono px-2 py-0.5 rounded font-semibold mt-2">
              GSTIN: {company.gstin}
            </span>
          ) : (
            <span className="inline-block bg-amber-100 text-amber-800 text-[10px] uppercase px-2 py-0.5 rounded font-semibold mt-2">
              No GSTIN (Labour Bill Client)
            </span>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
            Total Lifetime Billed
          </span>
          <p className="font-mono text-2xl font-bold text-[#1F4D3D]">
            ₹{stats.totalBilled.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-gray-500">{invoices.length} Total Invoices</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
            Outstanding Ledger Balance
          </span>
          <p className="font-mono text-2xl font-bold text-[#C2196B]">
            ₹{stats.outstanding.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-gray-500">
            Paid: ₹{stats.totalPaid.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Historic Invoice Ledger Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden space-y-2">
        <div className="p-4 bg-[#E7EDE6] border-b flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-[#1F4D3D]">
            Company Bill Ledger History
          </h3>
        </div>

        {invoices.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-500">
            No invoices issued to this company yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#F2F6F1] text-[#1F4D3D] font-bold uppercase tracking-wider border-b">
                <tr>
                  <th className="p-3">Bill No.</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Date</th>
                  <th className="p-3 text-right">Grand Total (₹)</th>
                  <th className="p-3 text-right">Balance Due (₹)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv: any) => (
                  <tr key={inv._id} className="hover:bg-[#F2F6F1]">
                    <td className="p-3 font-mono font-bold text-[#1F4D3D]">
                      {inv.number}
                    </td>
                    <td className="p-3">
                      {inv.type === "tax_invoice" ? (
                        <span className="bg-[#1F4D3D] text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                          Tax Invoice
                        </span>
                      ) : (
                        <span className="bg-[#C2196B] text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded">
                          Labour Bill
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-gray-600">
                      {new Date(inv.date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="p-3 font-mono font-bold text-right text-[#1F4D3D]">
                      ₹{inv.grandTotal.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 font-mono font-bold text-right text-[#C2196B]">
                      ₹{(inv.balanceAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="p-3 text-center">
                      {inv.status === "paid" ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {inv.status}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <Link
                        href={`/invoices/${inv._id}`}
                        className="text-[#1F4D3D] hover:text-[#C2196B] font-semibold hover:underline"
                      >
                        View & Print
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
