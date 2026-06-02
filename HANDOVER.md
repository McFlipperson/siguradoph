# Sigurado — Handover & Operations Guide

Last updated: 2026-06-03. Plain-English where possible; technical detail for a developer.

## 0. New session — start here

Recent work since the privacy track (all live on production):
- **Address Line 2** (optional) on Patient — intake + profile + certificate.
- **Subscription plans** (Free/Basic/Pro) + feature gating + `/admin` plan-setter (§3, §4).
- **Dental Certificate generator** — `/patients/[id]/certificate` (§12): auto-fills from
  patient + most recent visit, editable, **Print/Save-PDF**, and **email-to-patient as PDF**.
- **Dentist PRC License No.** + **drawn digital signature** stored on the clinic (§12).

**Requested but NOT yet built (next task) — see §13:**
- **Civil status** as a stored Patient field (currently only an editable field on the cert).
- **Sex (Male/Female)** field on Patient — does **not** exist anywhere yet.
Both should be quick dropdowns asked at intake and editable in the profile, then flow to the certificate.

**Still pending from before:** activate RLS (§6), automated PayMongo billing (§4).

## Verification status (2026-06-02 live click-test on production)

Click-tested end-to-end on the live site (clinic "denty"); test data cleaned up after.

**Verified working:**
- Plan gating — admin sets plan, change logged in activity feed, Pro feature shows
  upgrade screen when Free, **server-side 403** confirmed (export API direct hit), restore.
- Consent capture (P1) — patient created via intake; consent persisted with real
  `npcConsentGiven=true`, `noticeVersion`, method `digital`. Continue button disabled
  without consent.
- Patient delete — happy path (no receipts → deletes + redirects) AND the BIR guard
  (patient with issued receipts → blocked, offered Anonymize).
- Incident logging both layers (clinic Compliance + Sigurado /admin/incidents) — create,
  72-hour countdown, breach banner/red-dot, mark-reported, audit-logged.
- Access logging (P3), all new pages render.

**Bug found & fixed during testing:** delete-guard signaled the block via a thrown
error message, which Next.js redacts in production → showed a generic server error
instead of the anonymize prompt. Fixed to return a structured result. Re-tested: works.

**Not exercised (logic present + type-checked, not click-run):**
- Free-tier 30-patient cap *firing* (would need 30 patients to trigger; under-cap create works).
- Anonymize *execution* (the scrub itself — would permanently alter a real record; only the
  guard→prompt was tested).
- Messenger webhook signature; ConsentRecord immutability trigger (DB-level).

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
- `Patient.addressLine2`
- `Clinic.prcLicenseNo`, `Clinic.signatureUrl`

How migrations get applied here: there is no migration runner on deploy. The pattern used
this whole project is a throwaway Node script that reads `DIRECT_URL` from `vercel env pull`
and runs the SQL file via the `pg` package, then verifies the column/table exists. (Examples
are in the git history.) `prisma db push` is an alternative for plain columns but does NOT
create triggers/RLS — those need the raw SQL.

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

---

## 12. Dental certificates & dentist signature

- **Button:** "Dental Certificate" on the patient profile → `/patients/[id]/certificate`.
- **Builder** (`CertificateBuilder.tsx`): every field editable. Auto-fills issue date (today),
  patient name/age/address, exam date, and pre-checks the procedure(s) + tooth no. + diagnosis
  from the patient's **most recent visit**. Civil status / findings / recommendations are filled
  at issue time. Dentist name, PRC license, clinic address/contact auto-fill from the clinic.
- **Output:** "Print / Save PDF" (browser print, isolated via print CSS) **and** "Email Certificate"
  → server action `emailCertificate` renders a PDF (`lib/certificate-pdf.tsx`, React-PDF, signature
  embedded) and sends it via Resend as an attachment. Emailing is audit-logged.
- **PRC License No.:** `Clinic.prcLicenseNo`, set in Settings → "Dentist Credentials". Prints on every cert.
- **Signature:** drawn with `components/SignaturePad.tsx`, stored as a **base64 data URL in
  `Clinic.signatureUrl`** (deliberately NOT a public storage URL — a signature specimen must not be
  public). Captured at onboarding (Step 1) and editable in Settings → Dentist Credentials.
  Renders above the dentist name on the cert + in the PDF.
- **Verify-by-phone:** the cert/PDF shows "To verify, contact [clinic] at [phone]" — the low-tech
  authenticity check (it's a convenience signature, not a cryptographic e-signature; fine for
  routine certificates, wet-sign for contested ones).
- **Not live-tested:** the actual email *send* (Resend) and the signature appearing in the emailed
  PDF were not click-verified end to end. Worth one test send to a real inbox.

---

## 13. NEXT TASK — Civil status + Sex on the patient (requested, not built)

Currently: there is **no sex/gender field** anywhere, and **civil status** is only an editable
field on the certificate form (not stored on the patient). The ask is to make both proper
**Patient** fields, captured at intake and editable in the profile, then used on the certificate.

To implement (mirror the `addressLine2` change for the wiring pattern):
1. **Schema** `prisma/schema.prisma` — add to `Patient`: `sex String?` (or an enum MALE/FEMALE)
   and `civilStatus String?`. Add a migration SQL file + apply it (see §7).
2. **Intake** `app/(dashboard)/patients/intake/IntakeForm.tsx` + `actions.ts` — add two quick
   dropdowns (Sex: Male/Female; Civil Status: Single/Married/Widowed/Separated/Other). Persist them.
3. **Profile** `app/(dashboard)/patients/[id]/PatientProfile.tsx` + `updatePatientInfo` in
   `patients/actions.ts` + the `FullPatient` type — show + edit both.
4. **Certificate** `certificate/page.tsx` selects them; `CertificateBuilder.tsx` pre-fills civil
   status from the patient (instead of blank); consider showing sex on the cert if useful.
5. **Anonymize** — add `sex`/`civilStatus` to the scrub in `anonymizePatient` (set null).
   (Note: `getPatient` uses `include`, so new scalar fields flow through automatically, but the
   explicit `FullPatient` TYPE must list them or TS won't expose them.)
