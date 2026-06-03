# Sigurado — Handover & Operations Guide

Last updated: 2026-06-03. Plain-English where possible; technical detail for a developer.

## 0. New session — start here

Recent work this session (all live on production unless noted):

- **Dental certificate logo fix** — clinic logo now appears top-left on the on-screen preview AND in the emailed PDF (`lib/certificate-pdf.tsx`, `CertificateBuilder.tsx`).
- **GCash semi-automated billing system** — full billing infrastructure built (§14).
- **Honor-system payment flow** — clinics tap "I've paid" → instant access, Gmail agent verifies in background (§14).
- **Admin overhaul** — `/admin` now has Needs Attention / Awaiting Verification / Recently Verified buckets + one-click manual confirm + downgrade (§3).
- **Onboarding redesign** — 8-year-old-navigable: fat animated progress bar, 96px bouncing emoji, slide-up content card, big ON/OFF loyalty toggle, chunky service chips with pop animation, GCash field added to identity step (§15).
- **Plan intent capture** — landing page passes `?plan=basic/pro` → register stores in localStorage → after onboarding confetti redirects to `/billing?upgrade=plan` → payment panel auto-opens (§16).
- **Login/register redesign** — full-screen background image (`public/images/login-image.png`), transparent form overlay positioned over image, Google + Apple OAuth buttons wired to Supabase (need providers enabled in Supabase dashboard), password show/hide, duplicate email detection (§17).
- **Auth layout stripped** — login/register manage their own full-screen layout; reset-password has self-contained card.
- **Duplicate email detection on register** — Supabase silently succeeds for duplicate emails; now detected via `identities.length === 0` and shows clear error.

**Still pending (not yet built):**
- **Civil status + Sex** on Patient model — see §13 (unchanged).
- **Activate RLS** — see §6 (unchanged).
- **Gmail MCP connector** for the billing agent — Nova needs to connect Gmail at https://claude.ai/customize/connectors, then the hourly billing verification agent can be set up via the `schedule` skill.
- **Google/Apple OAuth** — buttons exist but providers need enabling in Supabase dashboard → Authentication → Providers.
- **Login overlay fine-tuning** — positions are calculated from image coordinates (22.5vh top padding etc.) — may need px adjustments after testing on real phone (§17).
- **Empty states** as feature discovery / conversion nudges — discussed but not built.

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
| GCash payments | Wife's personal GCash `09616634838` (Joey B.) |

Deploys are automatic: **push to `main` → Vercel builds & deploys to production.**

Note: there are **two siguradoph folders** on Nova's machine. The live one is `/Users/grumples/Documents/siguradoph/`. The other (`/Users/grumples/siguradoOG/`) is a stale copy — don't edit it.

---

## 2. Environment variables (set in Vercel → Project → Settings → Env Vars)

| Var | Purpose | Status |
|---|---|---|
| `DATABASE_URL` | Main DB connection (pooled) | set |
| `DIRECT_URL` | Direct DB connection (migrations) | set |
| `NEXT_PUBLIC_SUPABASE_URL` / `..._ANON_KEY` | Supabase auth | set |
| `SUPABASE_SERVICE_ROLE_KEY` | (present, not actively used in code) | set |
| `RESEND_API_KEY` | Email sending | set |
| `RESEND_FROM_EMAIL` | From address for emails | set |
| `FACEBOOK_APP_ID` / `_SECRET` / `_VERIFY_TOKEN` | Messenger + webhook verification | set |
| `CRON_SECRET` | Secures the daily reminder cron | set |
| `ADMIN_EMAILS` | Comma-separated emails allowed into `/admin` | set (production): `novabrunet@gmail.com` — NOT set on Preview |
| `TENANT_DATABASE_URL` | Restricted DB role to activate RLS | **NOT set** (see §6) |
| `NEXT_PUBLIC_GCASH_NUMBER` | GCash number shown on billing page | **set: `09616634838`** |
| `BILLING_WEBHOOK_SECRET` | Secures `/api/billing/confirm` endpoint | **set** |

---

## 3. Admin tools (`/admin` — Sigurado staff only)

Gated to `ADMIN_EMAILS`. Redesigned with three payment buckets at top:

- **🔴 Needs Attention** — self-reported payments >24h ago with no GCash email match. Shows clinic name, plan, amount, reference code. Actions: **Verify** (manual confirm + email clinic) or **Downgrade** (revert to Free).
- **🟡 Awaiting Verification** — self-reported <24h ago. Gmail agent will auto-verify within the hour. Can also manually verify.
- **🟢 Recently Verified** — confirmed in last 7 days (auto or manual).
- **All Clinics** (collapsible) — set any clinic's plan manually.
- **Activity Log** (collapsible) — tamper-evident record of all plan changes.

`/admin/incidents` — Sigurado's own DPO incident register (unchanged).

---

## 4. Subscription plans

Source of truth: `lib/entitlements.ts`. Plans: `FREE` / `BASIC` / `PRO`.

| Plan | Price | Gets |
|---|---|---|
| **Free** | ₱0 | Up to 30 patients, expenses, receipts |
| **Basic** | ₱499/mo | Unlimited patients, scheduling, reminders, loyalty, SC/PWD, reports, data export |
| **Pro** | ₱999/mo | Everything in Basic + full privacy/compliance suite + employees & payroll |

**Billing is now semi-automated via GCash** — see §14.

---

## 5. Data privacy / RA 10173 — the two-DPO structure

(Unchanged — see previous handover for full detail.)

- Each clinic = PIC, appoints own DPO, registers with NPC.
- Sigurado = PIP, has one company DPO (`lib/dpo.ts`), uses `/admin/incidents`.

---

## 6. ⚠️ Important: RLS is built but NOT yet active

App-level `clinicId` filters protect tenants today. RLS policies are written but inert (app connects as `postgres` superuser). Follow `docs/RLS_ACTIVATION_RUNBOOK.md` to activate. **Test on preview DB first.**

---

## 7. Database migrations

All migrations through 2026-06-03 have been applied to production.

**Previously applied migrations of note:**
- `20260603010000_billing.sql` — adds `Clinic.gcashNumber`, creates `PendingUpgrade` table + `UpgradeStatus` enum.
- `20260603020000_billing_self_report.sql` — adds `SELF_REPORTED` to enum + `PendingUpgrade.selfReportedAt`.
- RLS policies, ConsentRecord immutability trigger
- `Clinic.dpoName/dpoEmail/dpoPhone/npcRegistrationNumber/npcRegistrationDate`
- `Patient.anonymizedAt`, `Clinic.plan` enum, `IncidentLog/PlatformIncident/AdminAuditLog`
- `Patient.addressLine2`, `Clinic.prcLicenseNo`, `Clinic.signatureUrl`

---

## 8. Patient deletion vs anonymization (BIR)

Unchanged. Patient with issued receipts → cannot delete → offer Anonymize (scrubs PII, keeps financial records). In patient profile "Danger Zone".

---

## 9. Security posture

- `/admin` gated server-side to `ADMIN_EMAILS`. Strong password + 2FA on that Gmail.
- `/api/billing/confirm` gated by `BILLING_WEBHOOK_SECRET` header.
- Messenger webhook verifies Meta signature; cron endpoints require `CRON_SECRET`.

---

## 10. Known gaps / future work

- **Activate RLS** (§6) — biggest pending hardening.
- **Gmail MCP connector** — needed for the hourly billing verification agent. Connect at https://claude.ai/customize/connectors then use the `schedule` skill.
- **Civil status + Sex** on Patient — see §13.
- **Google/Apple OAuth** — Supabase dashboard → Authentication → Providers → enable Google/Apple, paste credentials.
- **Login overlay pixel-tuning** — test on real phone, adjust `paddingTop` and `marginTop` values in `app/(auth)/login/page.tsx` if alignment is off.
- **Empty states as feature discovery** — discussed, not built.
- **Email drip** — Day 3/7/14 after signup spotlighting unused features. Not built.
- **Tax/CPA module** — hidden (`lib/features.ts` `TAX_MODULE = false`); routes need access-control hardening before unhiding.
- **`ADMIN_EMAILS` on Preview** — only set on Production.

---

## 11. Common tasks

- **Manually upgrade a clinic:** `/admin` → All Clinics → change plan.
- **Manually confirm a GCash payment:** `/admin` → Needs Attention or Awaiting Verification → Verify button.
- **Downgrade a non-paying clinic:** `/admin` → Needs Attention → Downgrade.
- **Add an admin:** add email to `ADMIN_EMAILS` in Vercel → redeploy.
- **File Sigurado's annual breach report:** `/admin/incidents` → pick year → Download ASIR.
- **Apply a new DB migration:** run SQL in Supabase SQL Editor (split enum changes into separate queries).
- **Roll back a deploy:** Vercel dashboard → Deployments → promote previous build.

---

## 12. Dental certificates & dentist signature

- **Clinic logo** now shows top-left on both the on-screen preview and the emailed PDF. Uses `Clinic.logoUrl`.
- **Certificate builder** (`CertificateBuilder.tsx`): editable fields, auto-fills from patient + most recent visit.
- **Email:** server action `emailCertificate` → React-PDF → Resend attachment. Audit-logged.
- **PRC License No.:** `Clinic.prcLicenseNo`, set in Settings → Dentist Credentials.
- **Signature:** base64 data URL in `Clinic.signatureUrl` (not public storage — security).
- **Not live-tested:** email send end-to-end. Worth one test to a real inbox.

---

## 13. PENDING TASK — Civil status + Sex on the patient

Not yet built. `civilStatus` is only an editable field on the certificate form (not stored). `sex` doesn't exist anywhere.

To implement:
1. **Schema** — add `sex String?` and `civilStatus String?` to `Patient`. Migration SQL.
2. **Intake** `IntakeForm.tsx` + `actions.ts` — two dropdowns (Sex: Male/Female; Civil Status: Single/Married/Widowed/Separated/Other).
3. **Profile** `PatientProfile.tsx` + `updatePatientInfo` + `FullPatient` type.
4. **Certificate** — pre-fill civil status from patient; show sex if useful.
5. **Anonymize** — scrub both fields (set null).

---

## 14. GCash semi-automated billing

**How it works:**
1. Clinic visits `/billing` → taps "Upgrade to Basic/Pro" → payment panel opens.
2. Panel shows Joey's real GCash InstaPay QR (`public/gcash-qr.jpeg`), amount, copyable reference code (e.g. `SIG-BSC-AB3X`), note that recipient shows as **JO*****E B.**
3. Clinic pays via GCash → taps **"I've paid — activate my plan"**.
4. Plan upgrades **instantly** (honor system). Status = `SELF_REPORTED`. Confirmation email sent.
5. Gmail agent (hourly) searches for GCash notification emails → matches by reference code (first) or sender phone number (fallback) → calls `/api/billing/confirm` → status = `CONFIRMED`.
6. If unverified after 24h → appears in `/admin` Needs Attention bucket.

**Key files:**
- `app/(dashboard)/billing/` — billing page + BillingClient + actions
- `app/api/billing/confirm/route.ts` — webhook endpoint (auth: `x-billing-secret` header)
- `lib/billing-constants.ts` — plan prices (BASIC: 49900, PRO: 99900 centavos)
- `public/gcash-qr.jpeg` — Joey's real InstaPay QR

**Due date logic:** anchors to the DAY OF MONTH of the clinic's first-ever payment. Computed in `billing/page.tsx`.

**Gmail agent setup (PENDING):**
- Requires Gmail MCP connected at https://claude.ai/customize/connectors
- Then use `schedule` skill to create hourly agent (min interval is 1 hour)
- Agent: searches Gmail `from:gcash.com is:unread`, extracts sender phone + amount + reference, POSTs to `https://mine.sigurado.xyz/api/billing/confirm` with `x-billing-secret` header, marks email as read

**Admin `/admin` payment flow:**
- 🔴 Needs Attention = SELF_REPORTED > 24h (possible non-payment) → Verify or Downgrade
- 🟡 Awaiting Verification = SELF_REPORTED < 24h → Gmail agent will auto-verify
- 🟢 Recently Verified = CONFIRMED last 7 days

---

## 15. Onboarding redesign (8-year-old navigable)

**6-step flow:**
1. DPA — full-color promise cards (blue/green/amber), animated agree button
2. Clinic Identity — big logo upload zone, emoji labels, GCash number field (below phone)
3. Services — selected-count badge, category emoji headers, chips pop-bounce on tap
4. Loyalty Cards — big ON/OFF toggle buttons (green/red), card settings below
5. Messenger — giant Facebook logo, benefit cards, big connect button
6. 🎉 Celebration — full-screen PH flag video, confetti, gold CTA

**Shell (`OnboardingShell.tsx`):**
- Fat animated progress bar (fills with bounce on each step)
- 96px emoji pops in and floats on each step change
- Content card slides up from below
- CSS animations embedded inline (no Framer Motion dependency)

**Plan intent → payment flow:**
- Landing "Get Basic/Pro" buttons link to `/register?plan=basic/pro`
- Register stores plan in `localStorage` (`sigurado_selected_plan`)
- After confetti CTA → redirects to `/billing?upgrade=plan` instead of patients/intake
- Billing page auto-opens the correct plan's payment panel

---

## 16. Login / Register redesign

**Design approach:**
- Full-screen background: `public/images/login-image.png` (1024×1536, 1.4MB)
- No white card wrapper — form elements float transparently over the image
- All text labels removed — image provides the visual design
- Interactive elements (inputs, buttons) positioned using `vh`-based measurements to align with image coordinates

**Key files:**
- `app/(auth)/login/page.tsx` — full rewrite, transparent overlay
- `app/(auth)/register/page.tsx` — same treatment + plan intent logic
- `app/(auth)/reset-password/page.tsx` — self-contained card (no layout dependency)
- `app/(auth)/layout.tsx` — stripped to bare `<>{children}</>` passthrough

**Alignment math (login page):**
Image is 1024×1536. With `background-size: cover` on 390×844 mobile, scale=0.549.
- Email input top: `padding-top: 22.5vh`
- Password gap: `margin-top: 4.4vh`
- Remember me: `margin-top: 2.9vh`
- Login button: `margin-top: 2.4vh`
- Divider: `margin-top: 2.9vh`
- Google/Apple: `margin-top: 1.5vh`
- Security badge: `margin-top: 2.4vh`
If off on real device, adjust these values in `login/page.tsx`.

**Google/Apple OAuth:** buttons call `supabase.auth.signInWithOAuth`. Need providers enabled in Supabase dashboard → Authentication → Providers before they work.

**Duplicate email on register:** detected via `data.user.identities?.length === 0` — Supabase silently "succeeds" otherwise.

---

## 17. Clinic logo on certificates

`Clinic.logoUrl` (uploaded at onboarding / Settings → Clinic Logo) now appears:
- Top-left of the on-screen certificate preview (80×80px)
- Top-left of the emailed PDF (72pt)

No migration needed — `logoUrl` was already in the schema.
