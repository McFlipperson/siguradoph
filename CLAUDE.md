# Sigurado — Claude Code Context

## What this is
Dental clinic practice management SaaS for the Philippines.
Mobile-first PWA. Touch-optimized for a secretary on a phone 
or tablet. Compliance (BIR VAT, NPC data privacy, payroll) 
is handled invisibly in the background. The clinic uses it 
daily. The CPA handles taxes from the data it generates.

## Stack
Next.js 14 App Router, Supabase (Postgres + Auth), Prisma ORM,
Tailwind CSS, shadcn/ui, React-PDF, Resend (email),
Meta Messenger API for patient reminders

## Security architecture — critical to understand before touching DB queries

### Two-layer multi-tenant isolation
1. **Database layer (Postgres RLS):** All 22 patient/clinic data tables have
   `ENABLE ROW LEVEL SECURITY` + `FORCE ROW LEVEL SECURITY`. FORCE means it
   applies even to the postgres superuser Prisma uses. Policy on every table:
   `"clinicId" = current_setting('app.clinic_id', TRUE)`. If not set → 0 rows.
   Migration: `supabase/migrations/20260530000000_rls_clinic_isolation.sql`

2. **Application layer:** Every query to a tenant table MUST go through
   `withClinicDb(clinicId, fn)` from `lib/clinic-db.ts`. This wraps the query
   in a Prisma transaction that runs `SELECT set_config('app.clinic_id', ?, TRUE)`
   first (TRUE = transaction-local, safe with connection pooling).

### The two helpers — always use these in server actions and API routes
```typescript
// In server actions — gets actor AND scoped db in one call
import { getActorDb } from '@/lib/auth'
const { clinicId, userEmail, db } = await getActorDb()
const patients = await db((tx) => tx.patient.findMany())

// In API routes — use withClinicDb directly
import { withClinicDb } from '@/lib/clinic-db'
const clinicId = user.clinicId as string   // narrow from string|null after guard
const patients = await withClinicDb(clinicId, (tx) => tx.patient.findMany())
```

### What bypasses RLS (plain `prisma` is fine for these)
- `prisma.user.findUnique()` — auth lookups
- `prisma.clinic.findUnique/update()` — clinic settings
- `prisma.cpaClinicAssignment.*` — CPA assignments
These tables hold no patient SPI and have no RLS policies.

### NEVER do this — will return empty results or error at DB level
```typescript
// Wrong — no clinic context set, RLS rejects it
const patients = await prisma.patient.findMany({ where: { clinicId } })
```

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
- Multi-tenant: clinics never see each other's data. Enforced at BOTH
  application layer (withClinicDb) AND database layer (Postgres FORCE ROW
  LEVEL SECURITY). See "Security architecture" section above.
- Prices are NOT fixed per service. Secretary selects 
  the procedure name then inputs the price for that 
  specific patient at checkout.

## User roles
- CLINIC_OWNER: sets up account, manages settings
- SECRETARY: daily operations (patients, visits, payments)
- CPA: read-only access to assigned clinics' financial data

## Key project documents — read these before starting any task
- **`philippines-digital-research/siguradoph/ROADMAP.md`** — all pending work.
  The "Security & Code Quality Backlog" section at the bottom lists known bugs
  and security issues ordered by priority. Pick from the top.
- **`docs/AUDIT_2026-06-07.md`** — full security audit with context and reasoning
  behind each roadmap item. Read this before fixing anything in the backlog.
- **`HANDOVER.md`** — ops guide: admin tools, plans, RLS status, known gaps.
- **`docs/RLS_ACTIVATION_RUNBOOK.md`** — steps to activate/verify Postgres RLS.

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
