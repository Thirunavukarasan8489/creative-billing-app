import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address").or(z.literal("")).optional(),
  gstin: z
    .string()
    .transform((val) => val.trim().toUpperCase())
    .refine(
      (val) =>
        val === "" ||
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(val),
      {
        message: "Invalid GSTIN format (15 chars, e.g. 33DDIPG2441F1Z0)",
      },
    )
    .optional(),
  state: z.string().default("Tamil Nadu"),
  stateCode: z.string().default("33"),
  gstRegistered: z.boolean().optional(),
});

export type CompanyInput = z.infer<typeof companySchema>;
