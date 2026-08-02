import { dbConnect } from "@/lib/db";
import Company from "@/lib/models/Company";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";

export const revalidate = 0;

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  const { companyId } = await searchParams;
  let preselectedCompany = null;

  if (companyId) {
    await dbConnect();
    const found = await Company.findById(companyId).lean();
    if (found) {
      preselectedCompany = JSON.parse(JSON.stringify(found));
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="font-serif text-2xl font-bold text-[#1F4D3D]">
          Create New Bill / Invoice
        </h1>
        <p className="text-xs text-gray-500">
          Company-first billing flow. Auto-suggests Tax Invoice or Labour Bill based on GSTIN.
        </p>
      </div>

      <InvoiceForm
        initialValues={
          preselectedCompany
            ? {
                companyId: preselectedCompany._id,
                companySnapshot: preselectedCompany,
                type: preselectedCompany.gstin ? "tax_invoice" : "labour_bill",
              }
            : undefined
        }
      />
    </div>
  );
}
