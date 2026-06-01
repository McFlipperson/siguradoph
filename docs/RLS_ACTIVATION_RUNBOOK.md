# RLS Activation Runbook — Dedicated Restricted DB Role

## Why this exists

Our RLS policies (`supabase/migrations/*_rls_*.sql`) are written correctly, but they
are **inert in production** because Prisma connects as the Supabase `postgres`
role, which has the `BYPASSRLS` attribute. `FORCE ROW LEVEL SECURITY` does **not**
override `BYPASSRLS` — a bypass role always bypasses. So today the only thing
isolating one clinic's data from another is the `where: { clinicId }` filters in
application code.

This runbook creates a dedicated **`NOBYPASSRLS`** role for the app's per-clinic
queries so the RLS policies actually enforce isolation at the database layer —
which is what our Data Processing Agreement promises clinics.

## What the code already does (no further code changes needed)

- `lib/prisma.ts` exports two clients:
  - `prisma` — elevated (`DATABASE_URL`, the `postgres` role). Used only by trusted
    system jobs (reminders cron, Messenger webhook ingress, onboarding bootstrap,
    audit writer) and non-tenant tables (Clinic, User).
  - `prismaTenant` — restricted (`TENANT_DATABASE_URL`). Used by `withClinicDb()`.
    **Falls back to `DATABASE_URL` until `TENANT_DATABASE_URL` is set**, so nothing
    changes until you deliberately flip it.
- Every user-facing per-clinic query now flows through `withClinicDb()`.

So activation is purely: **create the role → set `TENANT_DATABASE_URL` → test.**

---

## Step 1 — Create the restricted role (Supabase SQL Editor)

Run this in the Supabase dashboard → SQL Editor (it connects as `postgres`, which
can create roles). Replace the password with a strong generated secret.

```sql
-- 1. Create a login role that is NOT a superuser and does NOT bypass RLS.
CREATE ROLE sigurado_app WITH LOGIN PASSWORD 'REPLACE_WITH_STRONG_SECRET'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;

-- 2. Let it connect and use the schema.
GRANT CONNECT ON DATABASE postgres TO sigurado_app;
GRANT USAGE ON SCHEMA public TO sigurado_app;

-- 3. Table privileges. RLS still constrains every tenant table to the row whose
--    clinicId matches app.clinic_id; non-tenant tables (Clinic, User) have no RLS
--    and remain readable/writable as the app needs (e.g. OR-number increment).
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sigurado_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sigurado_app;

-- 4. Cover future tables/sequences too (so new migrations don't lock the app out).
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO sigurado_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO sigurado_app;
```

> Least-privilege note: this grants DML on all tables including `Clinic`/`User`.
> `confirmPayment` needs `UPDATE` on `Clinic` (OR-series increment) and reads of
> `Clinic` via relations, so a blanket grant is the safe starting point. You can
> tighten later by enumerating tables, and/or by adding an RLS policy to `Clinic`
> (`USING (id = app_clinic_id())`).

## Step 2 — Confirm the role does NOT bypass RLS

```sql
SELECT rolname, rolbypassrls, rolsuper
FROM pg_roles
WHERE rolname = 'sigurado_app';
-- Expect: rolbypassrls = false, rolsuper = false
```

## Step 3 — Prove isolation works BEFORE pointing the app at it

Still in the SQL Editor, simulate what the app does and confirm a clinic only
sees its own rows. Use two real clinic IDs from your data.

```sql
-- Become the restricted role for this test.
SET ROLE sigurado_app;

-- Simulate withClinicDb(clinicA): set the tenant context.
SELECT set_config('app.clinic_id', 'CLINIC_A_ID', false);

-- Should return only clinic A's patients (not clinic B's):
SELECT "clinicId", count(*) FROM "Patient" GROUP BY "clinicId";
-- Expect: a single row for CLINIC_A_ID.

-- Switch context to clinic B:
SELECT set_config('app.clinic_id', 'CLINIC_B_ID', false);
SELECT "clinicId", count(*) FROM "Patient" GROUP BY "clinicId";
-- Expect: a single row for CLINIC_B_ID.

-- With NO context set, a NOBYPASSRLS role should see ZERO rows:
SELECT set_config('app.clinic_id', '', false);
SELECT count(*) FROM "Patient";
-- Expect: 0

RESET ROLE;
```

If any of these return another clinic's rows, **stop** — do not flip the env var;
the policy or grant is wrong. (If you see rows with no context set, the role still
has BYPASSRLS or you're not actually `SET ROLE`d.)

## Step 4 — Build the connection string

Supabase routes custom roles through the Supavisor pooler using the username
format `<role>.<project_ref>`. Your project ref is the suffix already on the
current `postgres.<ref>` username.

```
TENANT_DATABASE_URL=postgresql://sigurado_app.<PROJECT_REF>:<PASSWORD>@<POOLER_HOST>:6543/postgres
```

- `<POOLER_HOST>` — same pooler host as your current `DATABASE_URL`
  (e.g. `aws-1-ap-south-1.pooler.supabase.com`).
- Port `6543` = transaction pooler (match whatever your `DATABASE_URL` uses).
- URL-encode any special characters in the password.

## Step 5 — Set it in Vercel and on a preview first

**Test on a Preview deployment before Production.**

```bash
# Add to Preview, deploy a preview, smoke-test the app end to end.
vercel env add TENANT_DATABASE_URL preview

# Once the preview is verified, add to Production and redeploy.
vercel env add TENANT_DATABASE_URL production
```

Smoke test (logged in as a real clinic): open Patients, Visits, record a payment,
Expenses, Employees/Payroll, Reminders, Compliance. If any list is suddenly empty
or a save fails, the restricted role is missing a privilege — re-check Step 1/3.
You can instantly roll back by removing `TENANT_DATABASE_URL` (the app falls back
to the elevated `DATABASE_URL`).

## Step 6 — Rotate / revoke

- The restricted role's password lives only in `TENANT_DATABASE_URL`. Rotate with
  `ALTER ROLE sigurado_app WITH PASSWORD '...';` then update the env var.
- To fully back out: `vercel env rm TENANT_DATABASE_URL` (app reverts to elevated).

---

## Scope notes (what is and isn't enforced after this)

**Enforced by RLS (runs through `withClinicDb` → restricted role):** all patient,
visit, invoice, payment, loyalty, expense, supplier, employee, payroll, attendance,
13th-month, appointment, service-catalog, reminder, audit-log, SC/PWD-log, recall-rule,
and pending/unlinked-messenger access from user-facing pages and API routes.

**Intentionally still elevated (trusted system code, not user-parameter-driven):**
- `app/api/reminders/process` (cron — spans all clinics by design)
- `app/api/messenger/webhook` (system ingress; resolves clinicId from the verified Page ID)
- `app/(onboarding)/onboarding/actions.ts` (clinic bootstrap)
- `lib/audit.ts` (audit writer)

**Not yet converted (buried tax module — revisit when unburied):**
- `app/(cpa)/**`, `app/api/cpa/**`, `app/api/reports/quarterly/**`
These read other clinics' data via the elevated client today; they must be moved to
`withClinicDb` (or an assignment-scoped path) before the tax/CPA module ships.
