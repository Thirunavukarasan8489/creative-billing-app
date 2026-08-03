import { z } from "zod";

export const invoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  hsnSac: z.string().optional(),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  rate: z.coerce.number().min(0, "Rate must be 0 or greater"),
  amount: z.coerce.number().min(0),
});

export const invoiceSchema = z.object({
  type: z.enum(["tax_invoice", "labour_bill"]),
  labourCategory: z.enum(["cash", "credit"]).optional().default("cash"),
  number: z.string().optional(),
  date: z.string().or(z.date()),
  poNumber: z.string().optional().nullable(),
  poDate: z.string().or(z.date()).optional().nullable(),
  quoteNumber: z.string().optional().nullable(),
  quoteDate: z.string().or(z.date()).optional().nullable(),
  companyId: z
    .any()
    .transform((val) => {
      if (!val) return "";
      if (typeof val === "string") return val;
      if (typeof val === "object") {
        const id = val._id || val.id;
        if (id) return typeof id === "string" ? id : String(id);
      }
      return String(val);
    })
    .optional(),
  customCustomerName: z.string().optional(),
  customCustomerAddress: z.string().optional(),
  customCustomerPhone: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  subtotal: z.coerce.number().min(0),
  cgstPercent: z.coerce.number().min(0).default(0),
  cgstAmount: z.coerce.number().min(0).default(0),
  sgstPercent: z.coerce.number().min(0).default(0),
  sgstAmount: z.coerce.number().min(0).default(0),
  roundOff: z.coerce.number().default(0),
  grandTotal: z.coerce.number().min(0),
  amountInWords: z.string().min(1),
  status: z.enum(["draft", "sent", "paid", "cancelled"]).default("draft"),
  notes: z.string().optional(),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
