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
  number: z.string().optional(), // If omitted, API will generate next number
  date: z.string().or(z.date()),
  companyId: z.string().min(1, "Company selection is required"),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  subtotal: z.coerce.number().min(0),
  cgstPercent: z.coerce.number().min(0).default(0),
  cgstAmount: z.coerce.number().min(0).default(0),
  sgstPercent: z.coerce.number().min(0).default(0),
  sgstAmount: z.coerce.number().min(0).default(0),
  roundOff: z.coerce.number().default(0),
  grandTotal: z.coerce.number().min(0),
  amountInWords: z.string().min(1),
  status: z.enum(["draft", "sent", "paid"]).default("draft"),
  notes: z.string().optional(),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
