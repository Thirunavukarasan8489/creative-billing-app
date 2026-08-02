# AGENTS.md — Creative Line Graphics Billing App

## Project Overview

Build a billing management web app for **Creative Line Graphics**, a printing press in Tiruppur, Tamil Nadu. It replaces two handwritten paper bill books:

1. **Tax Invoice** — issued to large-scale, GST-registered companies. Includes GSTIN, HSN/SAC codes, CGST/SGST breakdown, round-off, grand total, amount in words, bank details.
2. **Labour Bill** — issued to small-scale companies with no GST requirement. Simple particulars/quantity/amount format.
3. **Rate Quotation** — official quotation document issued to potential clients with customizable unit quantities, tax badges (`GST TAX 18% EXTRA`), and 1-click conversion to Tax Invoice/Labour Bill.

Core principle: **Company-first workflow.** The user selects or creates a Company record first; the document type is auto-suggested, but the user can customize parameters per bill/quotation.

## Tech Stack

- **Next.js (latest, App Router)** — Server Components by default, Client Components only where interactivity is required
- **Tailwind CSS v4** — use the new CSS-first config (`@theme` in globals.css), no `tailwind.config.js` unless a plugin requires it
- **MongoDB + Mongoose** for data persistence
- **Printable HTML / PDF Route** (server-side route) for generating printable PDFs matching physical bill/quotation layouts
- **Zod** for schema validation on forms and API routes
- Deploy target: **Vercel** (matches existing Creative Line Graphics site)

## Design Direction

Professional Dashboard layout with persistent Left Sidebar navigation (open by default on mobile and desktop for fast counter-side billing).

- **Palette**:
  - Deep Slate Navy `#0F172A` — primary brand header, Tax Invoice border & sidebar theme
  - Indigo Accent `#3B82F6` — interactive elements, search focus rings & active nav pills
  - Rose `#E11D48` — Labour Bill accent & primary CTA actions
  - Teal `#0D9488` — GST status badges & positive balances
  - Warm Slate Paper `#F8FAFC` — background stock
- **Typography**: Georgia serif & ParkAvenue cursive for official headings/letterhead, Inter sans-serif for UI forms, Monospace for invoice numbers & currency figures.
- **Signature Element**: Real-time paper bill preview pane mirroring actual letterheads.

---

## Folder Structure (Implemented & Consolidated)

```
app/
  (dashboard)/
    layout.tsx                  # Dashboard wrapper with persistent Left Sidebar
    page.tsx                    # Overview dashboard: metrics, recent bills, outstanding dues
    companies/
      page.tsx                  # Client directory & creation modal
      [id]/
        page.tsx                # Company profile & 8-column Account Statement ledger
        statement/
          print/
            route.ts            # Printable A4 Account Statement letterhead stream
    invoices/
      page.tsx                  # Filterable invoice ledger (/invoices)
      new/page.tsx              # Company-first invoice creation (/invoices/new)
      [id]/
        page.tsx                # Invoice view, status update, record payment (/invoices/[id])
        edit/
          page.tsx              # Interactive invoice editor to add/modify items (/invoices/[id]/edit)
        pdf/
          route.ts              # Printable HTML/PDF letterhead stream (/invoices/[id]/pdf)
    quotations/
      page.tsx                  # Rate quotations ledger & 1-click invoice converter (/quotations)
      new/page.tsx              # Create new rate quotation (/quotations/new)
      [id]/
        page.tsx                # Quotation detail view (/quotations/[id])
        edit/
          page.tsx              # Interactive quotation editor (/quotations/[id]/edit)
        pdf/
          route.ts              # Printable A4 Rate Quotation stream (/quotations/[id]/pdf)
    reports/
      page.tsx                  # GST tax summary (CGST/SGST) & company outstanding ledgers (/reports)
    settings/
      page.tsx                  # Press company details, GSTIN, & bank account settings (/settings)
  api/
    companies/route.ts          # GET list, POST create
    companies/[id]/route.ts     # GET detail, PUT update, DELETE
    companies/[id]/statement/route.ts # Chronological company account statement API
    invoices/route.ts           # GET list, POST create
    invoices/[id]/route.ts      # GET detail, PUT update, DELETE
    invoices/[id]/payments/route.ts # POST record payment transaction
    invoices/next-number/route.ts # Auto-sequence numbering per type per FY
    quotations/route.ts         # GET list, POST create quotation
    quotations/[id]/route.ts    # GET detail, PUT update, DELETE quotation
    quotations/[id]/convert/route.ts # 1-click convert quotation into Tax Invoice/Labour Bill
    reports/route.ts            # Tax & ledger reporting calculations
    settings/route.ts           # GET and PUT PressProfile company settings
  layout.tsx
  globals.css                   # Tailwind CSS v4 @theme tokens, ParkAvenue font & paper styling
lib/
  db.ts                         # Mongoose connection singleton
  models/
    Company.ts                  # Company schema & GSTIN detection
    Invoice.ts                  # Invoice schema with historic company snapshot
    Payment.ts                  # Payment transaction schema
    PressProfile.ts             # Printing press profile & bank details schema
    Quotation.ts                # Rate quotation schema with unit quantities & tax note
  validation/
    company.ts                  # Zod schema for company forms
    invoice.ts                  # Zod schema for invoice forms with z.coerce.number()
  numberToWords.ts              # Indian Rupees amount-in-words converter
components/
  layout/
    Sidebar.tsx                 # Persistent Left Sidebar navigation (mobile & desktop)
  invoices/
    InvoiceForm.tsx             # Interactive billing form with live GST math
    InvoicePreview.tsx          # Real-time paper bill letterhead replica
    BillTypeToggle.tsx          # Tax Invoice vs Labour Bill selector
    PaymentModal.tsx            # Payment recording dialog
  quotations/
    QuotationForm.tsx           # Interactive quotation editor
    QuotationPreview.tsx        # Real-time paper quotation letterhead replica
  companies/
    CompanyForm.tsx             # Company input form
    CompanyPicker.tsx           # Company fast search & inline creation
```

---

## Route Verification Matrix

All routes verified active and functional:

| Route Path | File Location | Purpose & Status |
| :--- | :--- | :--- |
| `/` | `app/(dashboard)/page.tsx` | **Verified**: Dashboard overview, metrics & recent ledger |
| `/invoices` | `app/(dashboard)/invoices/page.tsx` | **Verified**: Searchable & filterable invoice list with Edit buttons |
| `/invoices/new` | `app/(dashboard)/invoices/new/page.tsx` | **Verified**: New bill creation with live paper preview |
| `/invoices/[id]` | `app/(dashboard)/invoices/[id]/page.tsx` | **Verified**: Invoice details, Edit button, & payment modal |
| `/invoices/[id]/edit` | `app/(dashboard)/invoices/[id]/edit/page.tsx` | **Verified**: Invoice editing to add/modify items |
| `/invoices/[id]/pdf` | `app/(dashboard)/invoices/[id]/pdf/route.ts` | **Verified**: Printable HTML/PDF stream with dynamic press info |
| `/quotations` | `app/(dashboard)/quotations/page.tsx` | **Verified**: Rate Quotation ledger with 1-click invoice converter |
| `/quotations/new` | `app/(dashboard)/quotations/new/page.tsx` | **Verified**: Create rate quotation with live preview |
| `/quotations/[id]` | `app/(dashboard)/quotations/[id]/page.tsx` | **Verified**: Quotation detail view, Edit & Convert buttons |
| `/quotations/[id]/edit` | `app/(dashboard)/quotations/[id]/edit/page.tsx` | **Verified**: Quotation interactive editor |
| `/quotations/[id]/pdf` | `app/(dashboard)/quotations/[id]/pdf/route.ts` | **Verified**: Printable A4 Rate Quotation stream |
| `/companies` | `app/(dashboard)/companies/page.tsx` | **Verified**: Client company directory & ledgers |
| `/companies/[id]` | `app/(dashboard)/companies/[id]/page.tsx` | **Verified**: 8-column Account Statement & FY date range filter |
| `/companies/[id]/statement/print` | `app/(dashboard)/companies/[id]/statement/print/route.ts` | **Verified**: Printable A4 Account Statement matching paper document |
| `/reports` | `app/(dashboard)/reports/page.tsx` | **Verified**: GST tax summary (CGST/SGST) & company ledgers |
| `/settings` | `app/(dashboard)/settings/page.tsx` | **Verified**: Edit press company details, GSTIN, & bank account |

---

## Completed Works & Implementation Log

### 1. Rate Quotation Feature
- **[lib/models/Quotation.ts](file:///d:/projects/creative-billing-app/lib/models/Quotation.ts)**: Quotation schema supporting unit quantity strings (e.g. `5 PAD`, `10 PAD`, `8 NOS.`), recipient titles, subject lines, and `GST TAX 18% EXTRA` tax note badges.
- **[app/api/quotations/route.ts](file:///d:/projects/creative-billing-app/app/api/quotations/route.ts)**, **[[id]/route.ts](file:///d:/projects/creative-billing-app/app/api/quotations/[id]/route.ts)**, and **[[id]/convert/route.ts](file:///d:/projects/creative-billing-app/app/api/quotations/[id]/convert/route.ts)**: API routes for CRUD operations and 1-click conversion into a live Tax Invoice or Labour Bill.
- **[components/quotations/QuotationPreview.tsx](file:///d:/projects/creative-billing-app/components/quotations/QuotationPreview.tsx)** & **[app/(dashboard)/quotations/[id]/pdf/route.ts](file:///d:/projects/creative-billing-app/app/\(dashboard\)/quotations/\[id\]/pdf/route.ts)**: Recreates the exact physical Rate Quotation letterhead matching the paper document.

---

## Verification & Build Status

- TypeScript compilation and Next.js route validation verified via `npm run build`.
- All routes and components adhere to the non-negotiables: mobile-responsive counter billing with persistent left sidebar, overridable bill types, GST field scoping, physical bill replica styling, dynamic press settings, full invoice editing capability, paper-replica company account statements, and rate quotations with 1-click invoice conversion.