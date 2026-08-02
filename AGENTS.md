# AGENTS.md — Creative Line Graphics Billing App

## Project Overview

Build a billing management web app for **Creative Line Graphics**, a printing press in Tiruppur, Tamil Nadu. It replaces two handwritten paper bill books:

1. **Tax Invoice** — issued to large-scale, GST-registered companies. Includes GSTIN, HSN/SAC codes, CGST/SGST breakdown, round-off, grand total, amount in words, bank details.
2. **Labour Bill** — issued to small-scale companies with no GST requirement. Simple particulars/quantity/amount format.

Core principle: **Company-first workflow.** The user selects or creates a Company record first; the bill type (Tax Invoice vs Labour Bill) is auto-suggested from whether the company has a GSTIN on file, but the user can override it per-bill.

## Tech Stack

- **Next.js (latest, App Router)** — Server Components by default, Client Components only where interactivity is required
- **Tailwind CSS v4** — use the new CSS-first config (`@theme` in globals.css), no `tailwind.config.js` unless a plugin requires it
- **MongoDB + Mongoose** for data persistence
- **Printable HTML / PDF Route** (server-side route) for generating printable PDFs matching the two existing bill layouts
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
- **Typography**: Georgia serif for official headings/letterhead, Inter sans-serif for UI forms, Monospace for invoice numbers & currency figures.
- **Signature Element**: Real-time paper bill preview pane mirroring actual letterheads (Slate Navy border for Tax Invoice, Rose border for Labour Bill).

---

## Folder Structure (Implemented & Consolidated)

```
app/
  (dashboard)/
    layout.tsx                  # Dashboard wrapper with persistent Left Sidebar
    page.tsx                    # Overview dashboard: metrics, recent bills, outstanding dues
    companies/
      page.tsx                  # Client directory & creation modal
      [id]/page.tsx             # Company profile & historical ledger
    invoices/
      page.tsx                  # Filterable invoice ledger (/invoices)
      new/page.tsx              # Company-first invoice creation (/invoices/new)
      [id]/
        page.tsx                # Invoice view, status update, record payment (/invoices/[id])
        pdf/
          route.ts              # Printable HTML/PDF letterhead stream (/invoices/[id]/pdf)
    reports/
      page.tsx                  # GST tax summary (CGST/SGST) & company outstanding ledgers (/reports)
    settings/
      page.tsx                  # Press company details, GSTIN, & bank account settings (/settings)
  api/
    companies/route.ts          # GET list, POST create
    companies/[id]/route.ts     # GET detail, PUT update, DELETE
    invoices/route.ts           # GET list, POST create
    invoices/[id]/route.ts      # GET detail, PUT update, DELETE
    invoices/[id]/payments/route.ts # POST record payment transaction
    invoices/next-number/route.ts # Auto-sequence numbering per type per FY
    reports/route.ts            # Tax & ledger reporting calculations
    settings/route.ts           # GET and PUT PressProfile company settings
  layout.tsx
  globals.css                   # Tailwind CSS v4 @theme tokens & paper styling
lib/
  db.ts                         # Mongoose connection singleton
  models/
    Company.ts                  # Company schema & GSTIN detection
    Invoice.ts                  # Invoice schema with historic company snapshot
    Payment.ts                  # Payment transaction schema
    PressProfile.ts             # Printing press profile & bank details schema
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
| `/invoices` | `app/(dashboard)/invoices/page.tsx` | **Verified**: Searchable & filterable invoice list |
| `/invoices/new` | `app/(dashboard)/invoices/new/page.tsx` | **Verified**: New bill creation with live paper preview |
| `/invoices/[id]` | `app/(dashboard)/invoices/[id]/page.tsx` | **Verified**: Invoice details & payment modal |
| `/invoices/[id]/pdf` | `app/(dashboard)/invoices/[id]/pdf/route.ts` | **Verified**: Printable HTML/PDF stream with dynamic press info |
| `/companies` | `app/(dashboard)/companies/page.tsx` | **Verified**: Client company directory |
| `/companies/[id]` | `app/(dashboard)/companies/[id]/page.tsx` | **Verified**: Company profile & lifetime bill ledger |
| `/reports` | `app/(dashboard)/reports/page.tsx` | **Verified**: GST tax summary (CGST/SGST) & company ledgers |
| `/settings` | `app/(dashboard)/settings/page.tsx` | **Verified**: Edit press company details, GSTIN, & bank account |

---

## Completed Works & Implementation Log

### 1. Database & Models (`lib/`)
- **[lib/db.ts](file:///d:/projects/creative-billing-app/lib/db.ts)**: Mongoose singleton connection manager with global caching.
- **[lib/models/Company.ts](file:///d:/projects/creative-billing-app/lib/models/Company.ts)**: Company schema (`name`, `address`, `phone`, `email`, `gstin`, `state`, `stateCode`, `gstRegistered`).
- **[lib/models/Invoice.ts](file:///d:/projects/creative-billing-app/lib/models/Invoice.ts)**: Invoice schema for `tax_invoice` and `labour_bill`.
- **[lib/models/Payment.ts](file:///d:/projects/creative-billing-app/lib/models/Payment.ts)**: Payment schema for recording transactions.
- **[lib/models/PressProfile.ts](file:///d:/projects/creative-billing-app/lib/models/PressProfile.ts)**: Press company settings schema (`name`, `tagline`, `address`, `phone`, `email`, `gstin`, `state`, `stateCode`, `bankName`, `accountNo`, `ifscCode`, `branchName`, `terms`).

### 2. Press Settings & Navigation
- **[app/(dashboard)/settings/page.tsx](file:///d:/projects/creative-billing-app/app/\(dashboard\)/settings/page.tsx)**: Dedicated, responsive Settings page for updating Creative Line Graphics company info, GSTIN, bank details, and footer terms with live side-by-side letterhead preview.
- **[app/api/settings/route.ts](file:///d:/projects/creative-billing-app/app/api/settings/route.ts)**: API endpoint for retrieving and updating press profile settings.
- **[components/layout/Sidebar.tsx](file:///d:/projects/creative-billing-app/components/layout/Sidebar.tsx)**: Updated Left Sidebar navigation with a dedicated **"Press Settings"** menu item.

### 3. Dynamic Letterhead Integration
- **[components/invoices/InvoicePreview.tsx](file:///d:/projects/creative-billing-app/components/invoices/InvoicePreview.tsx)** & **[app/(dashboard)/invoices/[id]/pdf/route.ts](file:///d:/projects/creative-billing-app/app/\(dashboard\)/invoices/[id]/pdf/route.ts)**: Dynamically loads the saved PressProfile to populate company letterhead headers, GSTIN, and bank account footers in real time across invoice previews and printable PDFs.

---

## Verification & Build Status

- TypeScript compilation and Next.js route validation verified via `npm run build`.
- All routes and components adhere to the non-negotiables: mobile-responsive counter billing with persistent left sidebar, overridable bill types, GST field scoping, physical bill replica styling, and dynamic press settings.