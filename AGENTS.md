# AGENTS.md — Creative Line Graphics Billing App

## Project Overview

Build a billing management web app for **Creative Line Graphics**, a printing press in Tiruppur, Tamil Nadu. It replaces two handwritten paper bill books:

1. **Tax Invoice** — issued to large-scale, GST-registered companies. Includes GSTIN, HSN/SAC codes, CGST/SGST breakdown, round-off, grand total, amount in words, bank details, and optional P.O. Number & P.O. Issue Date.
2. **Labour Bill** — supports two modes:
   - 💵 **Cash Bill (Counter Sale)**: Instant entry without selecting/creating a company in the database. Enter custom customer name directly into a text box, enter items, no tax (0% GST), and auto-sets status to Paid.
   - 💳 **Credit Bill (Account Ledger)**: Selects client company from directory, tracks billed amounts and outstanding balances in the 8-column client ledger.
3. **Rate Quotation** — official quotation document issued to potential clients with customizable unit quantities, tax badges (`GST TAX 18% EXTRA`), and 1-click conversion to Tax Invoice/Labour Bill.
4. **Monthly Sales Bill Statement** — 10-column physical ledger sheet statement (`SALES BILL [MONTH] [YEAR]`) summarizing all bills issued within any selected month with subtotal, CGST, SGST, and grand total sums in A4 Landscape PDF format.
5. **Financial Year (A.Y.) Sales Statement** — Annual 10-column sales statement for Assessment Years (e.g. `A.Y. 2026-2027`) and custom date ranges, with 1-click A4 Landscape PDF export.

Core principle: **Company-first workflow.** The user selects or creates a Company record first for Tax Invoices and Credit Labour Bills; Cash Labour Bills allow instant counter customer name entry.

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
        page.tsx                # Company profile & 8-column Account Statement ledger with Statement Type filter
        statement/
          print/
            route.ts            # Printable A4 Account Statement letterhead stream with dynamic title & type filter
    invoices/
      page.tsx                  # Filterable invoice ledger (/invoices) with Cancel & Delete actions
      new/page.tsx              # Invoice creation (/invoices/new) with Cash/Credit Labour Bill selector & PO fields
      [id]/
        page.tsx                # Invoice view, status update, record payment, cancel & delete (/invoices/[id])
        edit/
          page.tsx              # Interactive invoice editor with Cash/Credit modes (/invoices/[id]/edit)
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
    companies/[id]/statement/route.ts # Chronological company account statement API with statement type filter
    invoices/route.ts           # GET list, POST create
    invoices/[id]/route.ts      # GET detail, PUT update, DELETE
    invoices/[id]/payments/route.ts # POST record payment transaction
    invoices/next-number/route.ts # Auto-sequence numbering per type per FY
    quotations/route.ts         # GET list, POST create quotation
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
    Invoice.ts                  # Invoice schema with labourCategory, companySnapshot, & optional poNumber/poDate
    Payment.ts                  # Payment transaction schema
    PressProfile.ts             # Printing press profile & bank details schema
    Quotation.ts                # Rate quotation schema with unit quantities & tax note
  validation/
    company.ts                  # Zod schema for company forms
    invoice.ts                  # Zod schema for invoice forms with optional companyId for Cash Labour Bills
  numberToWords.ts              # Indian Rupees amount-in-words converter
components/
  layout/
    Sidebar.tsx                 # Persistent Left Sidebar navigation (mobile & desktop)
  invoices/
    InvoiceForm.tsx             # Interactive billing form with Cash/Credit Labour Bill toggle, PO fields & live GST math
    InvoicePreview.tsx          # Real-time paper bill letterhead replica with B&W print layout
    BillTypeToggle.tsx          # Tax Invoice vs Labour Bill selector
    PaymentModal.tsx            # Payment recording dialog
  quotations/
    QuotationForm.tsx           # Interactive quotation editor
    QuotationPreview.tsx        # Real-time paper quotation letterhead replica
  companies/
    CompanyForm.tsx             # Company input form & non-form container wrapper for inline modals
    CompanyPicker.tsx           # Company fast search & inline creation
```

---

## Route Verification Matrix

All routes verified active and functional:

| Route Path | File Location | Purpose & Status |
| :--- | :--- | :--- |
| `/` | `app/(dashboard)/page.tsx` | **Verified**: Dashboard overview, metrics & recent ledger |
| `/invoices` | `app/(dashboard)/invoices/page.tsx` | **Verified**: Searchable invoice list with Cancel & Delete actions |
| `/invoices/new` | `app/(dashboard)/invoices/new/page.tsx` | **Verified**: New bill creation with Cash/Credit Labour Bill modes & live paper preview |
| `/invoices/[id]` | `app/(dashboard)/invoices/[id]/page.tsx` | **Verified**: Invoice details with optional PO fields, Edit, Payment modal, & Cancel/Delete actions |
| `/invoices/[id]/edit` | `app/(dashboard)/invoices/[id]/edit/page.tsx` | **Verified**: Invoice editing with Cash/Credit Labour Bill modes |
| `/invoices/[id]/pdf` | `app/(dashboard)/invoices/[id]/pdf/route.ts` | **Verified**: Printable HTML/PDF stream with B&W print layout |
| `/quotations` | `app/(dashboard)/quotations/page.tsx` | **Verified**: Rate Quotation ledger with 1-click invoice converter |
| `/quotations/new` | `app/(dashboard)/quotations/new/page.tsx` | **Verified**: Create rate quotation with live preview |
| `/quotations/[id]` | `app/(dashboard)/quotations/[id]/page.tsx` | **Verified**: Quotation detail view, Edit & Convert buttons |
| `/quotations/[id]/edit` | `app/(dashboard)/quotations/[id]/edit/page.tsx` | **Verified**: Quotation interactive editor |
| `/quotations/[id]/pdf` | `app/(dashboard)/quotations/[id]/pdf/route.ts` | **Verified**: Printable A4 Rate Quotation stream |
| `/companies` | `app/(dashboard)/companies/page.tsx` | **Verified**: Client company directory & ledgers |
| `/companies/[id]` | `app/(dashboard)/companies/[id]/page.tsx` | **Verified**: 8-column Account Statement with Statement Type filter (`ALL BILLS`, `TAX INVOICES ONLY`, `LABOUR BILLS ONLY`) |
| `/companies/[id]/statement/print` | `app/(dashboard)/companies/[id]/statement/print/route.ts` | **Verified**: Printable A4 Account Statement with type filtering & dynamic header title |
| `/reports` | `app/(dashboard)/reports/page.tsx` | **Verified**: Monthly Sales Statement, Financial Year Statement (A.Y.) & GST tax summary |
| `/reports/monthly-sales/print` | `app/(dashboard)/reports/monthly-sales/print/route.ts` | **Verified**: Printable A4 10-column Monthly Sales Statement PDF stream |
| `/reports/annual-statement/print` | `app/(dashboard)/reports/annual-statement/print/route.ts` | **Verified**: Printable A4 Landscape Financial Year (A.Y. 2026-2027) Statement PDF stream |
| `/settings` | `app/(dashboard)/settings/page.tsx` | **Verified**: Edit press company details, GSTIN, & bank account |

---

## Completed Works & Implementation Log

### 1. Client Company Statement Type Filtering
- **[app/api/companies/[id]/statement/route.ts](file:///d:/projects/creative-billing-app/app/api/companies/\[id\]/statement/route.ts)**: Added `type` parameter filtering (`tax_invoice` / `labour_bill`).
- **[app/(dashboard)/companies/[id]/page.tsx](file:///d:/projects/creative-billing-app/app/\(dashboard\)/companies/\[id\]/page.tsx)**: Added **Statement Type** filter dropdown (`ALL BILLS (Tax + Labour)`, `TAX INVOICES ONLY`, `LABOUR BILLS ONLY`) in the filter bar with live state update.
- **[app/(dashboard)/companies/[id]/statement/print/route.ts](file:///d:/projects/creative-billing-app/app/\(dashboard\)/companies/\[id\]/statement/print/route.ts)**: Added type parameter filtering and dynamic statement header titles (`TAX INVOICE ACCOUNT STATEMENT` / `LABOUR BILL ACCOUNT STATEMENT` / `ACCOUNT STATEMENT`).

### 2. Cancelled Bill Visibility in Monthly & Annual Sales Statements
- **[app/api/reports/monthly-sales/route.ts](file:///d:/projects/creative-billing-app/app/api/reports/monthly-sales/route.ts)**: Removed `status: { $ne: 'cancelled' }` filter to return all sequence bills; mapped `isCancelled` & `status`; turnover and tax totals strictly sum active bills (`activeBillsCount` and `cancelledBillsCount` tracked in summary response).
- **[app/(dashboard)/reports/monthly-sales/print/route.ts](file:///d:/projects/creative-billing-app/app/\(dashboard\)/reports/monthly-sales/print/route.ts)**: Rendered cancelled bills with light rose background, `BILL CANCELLED` badge in Particulars, struck-through amounts, and summary label displaying active and cancelled bill counts.
- **[app/api/reports/annual-statement/route.ts](file:///d:/projects/creative-billing-app/app/api/reports/annual-statement/route.ts)** & **[app/(dashboard)/reports/annual-statement/print/route.ts](file:///d:/projects/creative-billing-app/app/\(dashboard\)/reports/annual-statement/print/route.ts)**: Aligned annual / assessment year statement with cancelled bill tracking.
- **[app/(dashboard)/reports/page.tsx](file:///d:/projects/creative-billing-app/app/\(dashboard\)/reports/page.tsx)**:
  - Added warning notice banner when cancelled bills exist in the statement period.
  - Rendered `⚠️ BILL CANCELLED` badge, rose highlight row, and strikethrough styling for cancelled bills in both Monthly and Annual interactive paper replica grids.
  - Enhanced responsive layout with mobile horizontal scroll hints, responsive paddings, and flexible text wrapping.
- **[app/api/reports/route.ts](file:///d:/projects/creative-billing-app/app/api/reports/route.ts)**: Ensured cancelled bills are excluded from active GST liability and company ledger calculations.

### 3. Invoices Ledger Sorting (Default Descending & Bill No. Header Toggle)
- **[app/api/invoices/route.ts](file:///d:/projects/creative-billing-app/app/api/invoices/route.ts)**: Added `sortOrder` parameter support (`desc` default, `asc` supported) with natural sequence number and alphanumeric bill number sorting.
- **[app/(dashboard)/invoices/page.tsx](file:///d:/projects/creative-billing-app/app/\(dashboard\)/invoices/page.tsx)**:
  - Default bill sorting set to **descending** (`desc`) so newest invoices appear first.
  - Interactive **BILL NO.** table header button with visual indicator (`DESC ↓` or `ASC ↑`), subtle icon rotation, hover animations, and instant client-side + server-side sort toggle.

### 4. Cancelled Bill Amounts Masking Across Views
- **[app/(dashboard)/invoices/page.tsx](file:///d:/projects/creative-billing-app/app/\(dashboard\)/invoices/page.tsx)**: When a bill status is `cancelled`, Grand Total (₹) and Balance Due (₹) display muted em-dashes (`—`) instead of financial amounts, preventing cancelled totals from appearing active.
- **[app/(dashboard)/invoices/[id]/page.tsx](file:///d:/projects/creative-billing-app/app/\(dashboard\)/invoices/\[id\]/page.tsx)**: Added a top banner warning for cancelled bills and masked Grand Total, Received, and Balance cards with `—`.
- **[app/(dashboard)/page.tsx](file:///d:/projects/creative-billing-app/app/\(dashboard\)/page.tsx)**: Mapped cancelled bills in the recent bills overview with `—` totals and a Cancelled badge.

---

## Verification & Build Status

- TypeScript compilation and Next.js route validation verified via `npm run build`.
- All 23 routes active and verified without errors.