# Sigurado — Claude Code Context

## What this is
Dental clinic practice management SaaS for the Philippines.
Mobile-first PWA. Touch-optimized for a secretary on a phone 
or tablet. Compliance (BIR VAT, NPC data privacy, payroll) 
is handled invisibly in the background. The clinic uses it 
daily. The CPA handles taxes from the data it generates.

## Stack
Next.js 14 App Router, Supabase (Postgres + Auth + RLS),
Prisma ORM, Tailwind CSS, shadcn/ui, React-PDF,
Meta Messenger API for patient reminders

## Design rules — never break these
- Every screen must work on a 390px wide phone
- Tap targets minimum 48px height
- No table layouts on mobile — use cards
- Forms must be completable with one thumb
- Secretary flow: minimal typing, maximum tapping
- Secretary selects procedures from a tap list, then 
  manually inputs the price per patient at checkout

## Business rules — never break these
- Day One Rule: no data entry permitted before clinic 
  enrollmentDate. Enforce at schema and UI level.
- VAT always computed as: net = gross ÷ 1.12, 
  VAT = gross - net. Never store uncomputed.
- Loyalty card discounts applied before VAT calculation
- All patient data is Sensitive Personal Information 
  under Philippine RA 10173 — handle accordingly
- Multi-tenant: clinics never see each other's data.
  Enforce via Supabase RLS on every table using clinic_id.
- Prices are NOT fixed per service. Secretary selects 
  the procedure name then inputs the price for that 
  specific patient at checkout.

## User roles
- CLINIC_OWNER: sets up account, manages settings
- SECRETARY: daily operations (patients, visits, payments)
- CPA: read-only access to assigned clinics' financial data

## Philippine tax context
- VAT: 12% on all services, quarterly filing (BIR 2550Q)
  due 25th day after quarter end
- Income tax: quarterly (1701Q) and annual (1701)
- Payroll: monthly SSS, PhilHealth, Pag-IBIG, 
  withholding tax (BIR 1601-C)
- SLS (Summary List of Sales) must be exportable 
  as DAT file for BIR eSubmission
- BIR EIS API: architect invoice fields for it from 
  day one even though API submission is not built yet
