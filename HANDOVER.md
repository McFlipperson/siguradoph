# Sigurado — Handover & Operations Guide

Last updated: 2026-06-02. Plain-English where possible; technical detail for a developer.

Sigurado is a dental-clinic SaaS for the Philippines (Next.js 14 App Router,
Supabase/Postgres + Prisma, Tailwind, deployed on Vercel). It is multi-tenant:
each dental clinic is a separate "tenant" and must never see another clinic's data.

---

## 1. Where everything lives

| Thing | Where |
|---|---|
| Code | GitHub `McFlipperson/siguradoph` (branch `main`) |
| Hosting | Vercel project `siguradoph` |
| Live app (clinics log in here) | `https://mine.sigurado.xyz` |
| Public landing/marketing | `https://sigurado.xyz` |
| Database | Supabase (Postgres), AWS `ap-south-1` (Mumbai) pooler |
| Email | Resend |
| Messenger reminders | Meta / Facebook Page API |

Deploys are automatic: **push to `main` → Vercel builds & deploys to production.**
Branches get their own preview URLs.

---

## 2. Environment variables (set in Vercel → Project → Settings → Env Vars)

| Var | Purpose | Status |
|---|---|---|
| `DATABASE_URL` | Main DB connection (pooled) | set |
| `DIRECT_URL` | Direct DB connection (migrations) | set |
| `NEXT_PUBLIC_SUPABASE_URL` / `..._ANON_KEY` | Supabase auth | set |
| `SUPABASE_SERVICE_ROLE_KEY` | (present, not actively used in code) | set |
| `RESEND_API_KEY` | Email sending | set |
| `FACEBOOK_APP_ID` / `_SECRET` / `_VERIFY_TOKEN` | Messenger + webhook verification | set |
| `CRON_SECRET` | Secures the daily reminder cron | **set** |
| `ADMIN_EMAILS` | Comma-separated emails allowed into `/admin` | **set (production): `novabrunet@gmail.com`** — NOT set on Preview |
| `TENANT_DATABASE_URL` | Restricted DB role to activate RLS | **NOT set** (see §6) |

`.env.local.example` lists all of these.

---

## 3. Admin tools (Sigurado staff only)

Gated to the `ADMIN_EMAILS` allowlist. If your login email isn't on the list,
these pages redirect you away (this is the intended safety default).

- **`/admin`** — set a clinic's plan (Free/Basic/Pro). Use this to upgrade a
  clinic the moment their GCash/bank payment is confirmed. Every change is
  recorded in a "Recent admin activity" feed (who, what, when).
- **`/admin/incidents`** — **Sigurado's own** DPO incident register + annual
  report (see §5).

To add another admin: add their email to `ADMIN_EMAILS` in Vercel (comma-separated)
and redeploy.

---

## 4. Subscription plans

Source of truth: `lib/entitlements.ts`. Each clinic has a `plan` field
(`FREE` / `BASIC` / `PRO`, default `FREE`). Existing clinics were grandfathered to `PRO`.

| Plan | Price | Gets |
|---|---|---|
| **Free** | ₱0 | Up to **30 patients**, expenses, OR receipts ("try it") |
| **Basic** | ₱499/mo | Unlimited patients, scheduling, reminders, loyalty cards, SC/PWD discounts, reports, data export |
| **Pro** | ₱999/mo | Everything in Basic **+ full privacy/compliance suite** (audit log, consent dashboard, breach/ASIR tools) **+ employees & payroll** |

Gating is enforced two ways: the **nav hides** locked features and gated pages show an
**"Upgrade" screen**; the **server also blocks** the underlying endpoints (so it can't be
bypassed). Consent capture at intake and background audit logging are **never** gated —
they're legally required for any clinic collecting patient data.

**Billing today is manual:** you send a GCash/bank payment link (via PayMongo dashboard),
and when payment lands you flip their plan in `/admin`. Automated PayMongo billing is a
future enhancement (not built).

---

## 5. Data privacy / RA 10173 — the two-DPO structure

There are **two separate legal roles**, each with its own DPO, registration, and annual report:

- **Each clinic = Personal Information Controller (PIC).** They appoint their own DPO,
  register with the NPC, and file their own ASIR. In-app: the clinic records its DPO in
  **Settings → Data Privacy**, and uses its **Compliance page** (Pro) to view its audit
  log, consent records, SC/PWD log, and log patient breaches (72-hour clock + ASIR).
- **Sigurado / AI Matters = Personal Information Processor (PIP).** Has **one** company DPO
  (you — `lib/dpo.ts`). Uses **`/admin/incidents`** to log platform-side breaches (which can
  affect many clinics at once) and file Sigurado's own company ASIR.

What the app does for compliance:
- **Consent** is captured from the patient's actual tap at intake (never assumed), records
  the notice version, and is immutable once saved.
- **Audit log** records who viewed/edited/exported patient data; bulk exports are logged.
- **SC/PWD discounts** are recorded immutably.
- **Breach tools**: 72-hour NPC notification clock + ASIR generator, on both layers.

**The DPO's recurring job:** (1) keep the access log, (2) log + report breaches within 72h,
(3) file the ASIR every **March 31** for the prior year. The app provides the tooling for all three.

---

## 6. ⚠️ Important: RLS is built but NOT yet active

Multi-tenant isolation has two layers:
1. **App-level `clinicId` filters** — active now; the real protection today.
2. **Database Row-Level Security (RLS)** — policies are written, but **inert** because
   the app connects to Postgres as the `postgres` superuser role, which bypasses RLS.

To make RLS actually enforce (so the database itself blocks cross-clinic access), follow
**`docs/RLS_ACTIVATION_RUNBOOK.md`**: create a restricted `sigurado_app` Postgres role and
set `TENANT_DATABASE_URL`. **Test on a preview/branch DB first** — the runbook has a
verification step. Until then, do not assume DB-level isolation; the code filters are
what's protecting tenants.

Note: the signed Data Processing Agreement tells clinics their data is isolated at the DB
layer — activating RLS is what makes that statement fully true.

---

## 7. Database migrations

Schema is Prisma (`prisma/schema.prisma`). RLS policies, triggers, and some columns are
applied via SQL files in `supabase/migrations/`. These are **not** auto-applied on deploy —
they're run manually against the database (Supabase SQL Editor, or a script using `DIRECT_URL`).
All migrations through 2026-06-02 have been applied to production. If you add a new column/
model, you must apply it to the DB before (or with) the deploy that uses it, or those pages
will error.

Applied migrations of note:
- RLS policies for all tenant tables (+ RecallRule, PendingMessengerLink, IncidentLog)
- `ConsentRecord.noticeVersion` + UPDATE-immutability trigger
- `Clinic.dpoName/dpoEmail/dpoPhone/npcRegistrationNumber/npcRegistrationDate`
- `Patient.anonymizedAt`
- `Clinic.plan` enum (existing clinics → PRO)
- `IncidentLog`, `PlatformIncident`, `AdminAuditLog` tables

---

## 8. Patient deletion vs anonymization (BIR)

A patient with **issued official receipts cannot be hard-deleted** (BIR requires keeping
receipts). The app blocks it and offers **Anonymize** instead: it scrubs personal data
(name, contact, medical history) but keeps the financial records. A mistake entry with no
receipts deletes normally. This is in the patient profile "Danger Zone".

---

## 9. Security posture (quick reference)

- `/admin` is gated server-side to `ADMIN_EMAILS`; the only way in is to be logged in as an
  allowlisted email. Protect that login with a **strong unique password + 2FA**, and protect
  the Gmail it's tied to.
- A compromised admin could change plans but **cannot read patient medical data** through
  `/admin`, and every plan change is logged.
- Messenger webhook verifies Meta's signature; cron endpoints require `CRON_SECRET`.

---

## 10. Known gaps / future work

- **Activate RLS** (§6) — the biggest pending hardening.
- **Automated billing** — currently manual via `/admin`; PayMongo automation not built.
- **`ADMIN_EMAILS` on Preview** — only set on Production.
- **Runtime testing** — the recent feature work is type-checked and deployed but was not
  all click-tested. Worth a manual pass: intake + consent, plan gating (flip a clinic to
  Free and confirm features lock), incident logging on both DPO layers, patient anonymize.
- **Tax/CPA module** — intentionally hidden (`lib/features.ts` `TAX_MODULE = false`); its
  routes still need access-control hardening before it's ever unhidden.

---

## 11. Common tasks

- **Upgrade a clinic after payment:** `/admin` → find clinic → set plan.
- **Add an admin:** add email to `ADMIN_EMAILS` in Vercel → redeploy.
- **File Sigurado's annual breach report:** `/admin/incidents` → pick year → Download ASIR.
- **Apply a new DB migration:** run the SQL in `supabase/migrations/` against the DB
  (Supabase SQL Editor or a script using `DIRECT_URL`).
- **Roll back a deploy:** Vercel dashboard → Deployments → promote a previous build.
