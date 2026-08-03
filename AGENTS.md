# AGENTS.md — Creative Line Graphics Billing App

## Project Overview

Build a billing management web app for **Creative Line Graphics**, a printing press in Tiruppur, Tamil Nadu. It replaces two handwritten paper bill books:

1. **Tax Invoice** — issued to large-scale, GST-registered companies. Includes GSTIN, HSN/SAC codes, CGST/SGST breakdown, round-off, grand total, amount in words, bank details, and optional P.O. Number & P.O. Issue Date.
2. **Labour Bill** — issued to small-scale companies with no GST requirement. Simple particulars/quantity/amount format with optional P.O. details.
3. **Rate Quotation** — official quotation document issued to potential clients with customizable unit quantities, tax badges (`GST TAX 18% EXTRA`), and 1-click conversion to Tax Invoice/Labour Bill.
4. **Monthly Sales Bill Statement** — 10-column physical ledger sheet statement (`SALES BILL [MONTH] [YEAR]`) summarizing all bills issued within any selected month with subtotal, CGST, SGST, and grand total sums in A4 Landscape PDF format.
5. **Financial Year (A.Y.) Sales Statement** — Annual 10-column sales statement for Assessment Years (e.g. `A.Y. 2026-2027`) and custom date ranges, with 1-click A4 Landscape PDF export.

Core principle: **Company-first workflow.** The user selects or creates a Company record first; the document type is auto-suggested, but the user can customize parameters per bill/quotation.

## Tech Stack

- **Next.js (latest, App Router)** — Server Components by default, Client Components only where interactivity is required
- **Tailwind CSS v4** — use the new CSS-first config (`@theme` in globals.css), no `tailwind.config.js` unless a plugin requires it
- **MongoDB + Mongoose** for data persistence
- **Printable HTML / PDF Route** (server-side route) for generating printable PDFs matching physical bill/quotation/statement layouts
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
      page.tsx                  # Filterable invoice ledger (/invoices) with Cancel & Delete actions
      new/page.tsx              # Company-first invoice creation (/invoices/new) with optional PO fields
      [id]/
        page.tsx                # Invoice view, status update, record payment, cancel & delete (/invoices/[id])
        edit/
          page.tsx              # Interactive invoice editor with optional PO fields (/invoices/[id]/edit)
        pdf/
          route.ts              # Printable HTML/PDF letterhead stream (/invoices/[id]/pdf) with B&W print layout
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
      page.tsx                  # Monthly Sales Statement, Financial Year Statement (A.Y.), & GST tax summary (/reports)
      monthly-sales/
        print/
          route.ts              # Printable A4 10-column Monthly Sales Statement PDF stream
      annual-statement/
        print/
          route.ts              # Printable A4 Landscape Financial Year (A.Y. 2026-2027) PDF stream
    settings/
      page.tsx                  # Press company details, GSTIN, & bank account settings (/settings)
  api/
    companies/route.ts          # GET list, POST create
    companies/[id]/route.ts     # GET detail, PUT update, DELETE
    companies/[id]/statement/route.ts # Chronological company account statement API (excludes cancelled bills)
    invoices/route.ts           # GET list, POST create
    invoices/[id]/route.ts      # GET detail, PUT update, DELETE
    invoices/[id]/payments/route.ts # POST record payment transaction
    invoices/next-number/route.ts # Auto-sequence numbering per type per FY
    quotations/route.ts         # GET list, POST create quotation
    quotations/[id]/route.ts    # GET detail, PUT update, DELETE quotation
    quotations/[id]/convert/route.ts # 1-click convert quotation into Tax Invoice/Labour Bill
    reports/route.ts            # Tax & ledger reporting calculations
    reports/monthly-sales/route.ts # Monthly sales bill statement API
    reports/annual-statement/route.ts # Financial Year (A.Y.) sales statement API
    settings/route.ts           # GET and PUT PressProfile company settings
  layout.tsx
  globals.css                   # Tailwind CSS v4 @theme tokens, ParkAvenue font & paper styling
lib/
  db.ts                         # Mongoose connection singleton
  models/
    Company.ts                  # Company schema & GSTIN detection
    Invoice.ts                  # Invoice schema with historic company snapshot, cancelled status, & optional poNumber/poDate
    Payment.ts                  # Payment transaction schema
    PressProfile.ts             # Printing press profile & bank details schema
    Quotation.ts                # Rate quotation schema with unit quantities & tax note
  validation/
    company.ts                  # Zod schema for company forms
    invoice.ts                  # Zod schema for invoice forms with safe companyId object transformer & optional poNumber/poDate
  numberToWords.ts              # Indian Rupees amount-in-words converter
components/
  layout/
    Sidebar.tsx                 # Persistent Left Sidebar navigation (mobile & desktop)
  invoices/
    InvoiceForm.tsx             # Interactive billing form with optional PO fields, live GST math & empty numeric inputs
    InvoicePreview.tsx          # Real-time paper bill letterhead replica with B&W print layout & optional PO fields
    BillTypeToggle.tsx          # Tax Invoice vs Labour Bill selector
    PaymentModal.tsx            # Payment recording dialog
  quotations/
    QuotationForm.tsx           # Interactive quotation editor with empty rate inputs
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
| `/invoices` | `app/(dashboard)/invoices/page.tsx` | **Verified**: Searchable invoice list with Cancel & Delete actions |
| `/invoices/new` | `app/(dashboard)/invoices/new/page.tsx` | **Verified**: New bill creation with optional PO fields & live paper preview |
| `/invoices/[id]` | `app/(dashboard)/invoices/[id]/page.tsx` | **Verified**: Invoice details with optional PO fields, Edit, Payment modal, & Cancel/Delete actions |
| `/invoices/[id]/edit` | `app/(dashboard)/invoices/[id]/edit/page.tsx` | **Verified**: Invoice editing with optional PO fields & object-safe companyId validation |
| `/invoices/[id]/pdf` | `app/(dashboard)/invoices/[id]/pdf/route.ts` | **Verified**: Printable HTML/PDF stream with B&W print layout & PO fields |
| `/quotations` | `app/(dashboard)/quotations/page.tsx` | **Verified**: Rate Quotation ledger with 1-click invoice converter |
| `/quotations/new` | `app/(dashboard)/quotations/new/page.tsx` | **Verified**: Create rate quotation with live preview |
| `/quotations/[id]` | `app/(dashboard)/quotations/[id]/page.tsx` | **Verified**: Quotation detail view, Edit & Convert buttons |
| `/quotations/[id]/edit` | `app/(dashboard)/quotations/[id]/edit/page.tsx` | **Verified**: Quotation interactive editor |
| `/quotations/[id]/pdf` | `app/(dashboard)/quotations/[id]/pdf/route.ts` | **Verified**: Printable A4 Rate Quotation stream |
| `/companies` | `app/(dashboard)/companies/page.tsx` | **Verified**: Client company directory & ledgers |
| `/companies/[id]` | `app/(dashboard)/companies/[id]/page.tsx` | **Verified**: 8-column Account Statement excluding cancelled bills |
| `/companies/[id]/statement/print` | `app/(dashboard)/companies/[id]/statement/print/route.ts` | **Verified**: Printable A4 Account Statement matching paper document |
| `/reports` | `app/(dashboard)/reports/page.tsx` | **Verified**: Monthly Sales Statement, Financial Year Statement (A.Y.) & GST tax summary |
| `/reports/monthly-sales/print` | `app/(dashboard)/reports/monthly-sales/print/route.ts` | **Verified**: Printable A4 10-column Monthly Sales Statement PDF stream |
| `/reports/annual-statement/print` | `app/(dashboard)/reports/annual-statement/print/route.ts` | **Verified**: Printable A4 Landscape Financial Year (A.Y. 2026-2027) Statement PDF stream |
| `/settings` | `app/(dashboard)/settings/page.tsx` | **Verified**: Edit press company details, GSTIN, & bank account |

---

## Completed Works & Implementation Log

### 1. User Authentication & Next.js 16 Edge Route Protection
- **[lib/models/User.ts](file:///f:/Thiru/frontend/Personal/creative-billing-app/lib/models/User.ts)**, **[lib/auth.ts](file:///f:/Thiru/frontend/Personal/creative-billing-app/lib/auth.ts)**, & **[app/api/auth/login/route.ts](file:///f:/Thiru/frontend/Personal/creative-billing-app/app/api/auth/login/route.ts)**: Configured MongoDB user authentication with bcrypt password hashing for `creativetpr@gmail.com`.
- **[lib/session.ts](file:///f:/Thiru/frontend/Personal/creative-billing-app/lib/session.ts)** & **[proxy.ts](file:///f:/Thiru/frontend/Personal/creative-billing-app/proxy.ts)**: Next.js 16 Edge runtime proxy middleware protecting all app routes with `jose` JWT cookies.
- **[app/login/page.tsx](file:///f:/Thiru/frontend/Personal/creative-billing-app/app/login/page.tsx)**: Brand login page with `<Suspense>` wrapper.

### 2. Quotation-to-Bill Conversion Modal & Auto-Sequencing
- **[components/quotations/ConvertModal.tsx](file:///f:/Thiru/frontend/Personal/creative-billing-app/components/quotations/ConvertModal.tsx)** & **[app/api/quotations/[id]/convert/route.ts](file:///f:/Thiru/frontend/Personal/creative-billing-app/app/api/quotations/%5Bid%5D/convert/route.ts)**: Added modal dialog popup on Quotations ledger & detail views to convert rate quotations into Tax Invoices or Labour Bills with live GST tax math and auto-sequence bill numbering.

### 3. Optional Quote Fields (`quoteNumber` & `quoteDate`)
- **[lib/models/Invoice.ts](file:///f:/Thiru/frontend/Personal/creative-billing-app/lib/models/Invoice.ts)** & **[lib/validation/invoice.ts](file:///f:/Thiru/frontend/Personal/creative-billing-app/lib/validation/invoice.ts)**: Added optional `quoteNumber` and `quoteDate` fields.
- **[components/invoices/InvoiceForm.tsx](file:///f:/Thiru/frontend/Personal/creative-billing-app/components/invoices/InvoiceForm.tsx)**, **[components/invoices/InvoicePreview.tsx](file:///f:/Thiru/frontend/Personal/creative-billing-app/components/invoices/InvoicePreview.tsx)**, & **[app/(dashboard)/invoices/[id]/pdf/route.ts](file:///f:/Thiru/frontend/Personal/creative-billing-app/app/%28dashboard%29/invoices/%5Bid%5D/pdf/route.ts)**: Input fields, live preview, and PDF stream support for quote metadata.

### 4. Crisp Bordered Table Layouts (Header Metadata & Bank Account Details)
- **[components/invoices/InvoicePreview.tsx](file:///f:/Thiru/frontend/Personal/creative-billing-app/components/invoices/InvoicePreview.tsx)** & **[app/(dashboard)/invoices/[id]/pdf/route.ts](file:///f:/Thiru/frontend/Personal/creative-billing-app/app/%28dashboard%29/invoices/%5Bid%5D/pdf/route.ts)**: Styled bill metadata block (BILL NO, DATE, QUOTE NO, PO NO) and Bank Account Details (Bank Name, Account No, IFSC Code, Branch) into structured HTML tables with crisp `border: 1px solid #000` cells.

### 5. Separate Tax Invoice vs Labour Bill Monthly Sales Statements
- **[app/(dashboard)/reports/page.tsx](file:///f:/Thiru/frontend/Personal/creative-billing-app/app/%28dashboard%29/reports/page.tsx)**: Added Statement Type filter dropdown (`ALL BILLS`, `TAX INVOICES ONLY`, `LABOUR BILLS ONLY`) for Monthly Sales Statement and Financial Year Statement.
- **[app/api/reports/monthly-sales/route.ts](file:///f:/Thiru/frontend/Personal/creative-billing-app/app/api/reports/monthly-sales/route.ts)** & **[app/(dashboard)/reports/monthly-sales/print/route.ts](file:///f:/Thiru/frontend/Personal/creative-billing-app/app/%28dashboard%29/reports/monthly-sales/print/route.ts)**: API & print routes filter invoices by `type` parameter and generate dynamic statement titles (`TAX INVOICE SALES BILL [MONTH] [YEAR]` / `LABOUR BILL SALES BILL [MONTH] [YEAR]`).

---

## Verification & Build Status

- TypeScript compilation and Next.js route validation verified via `npm run build`.
- All 37 routes active and verified without errors.
- All core requirements met: authentication, edge route protection, company-first workflow, overridable bill types, rate quotation 1-click conversion modal, optional PO & Quote fields, crisp black-bordered PDF & preview table layouts, separate Tax vs Labour monthly sales bill statements, financial year statements, and client account ledgers.