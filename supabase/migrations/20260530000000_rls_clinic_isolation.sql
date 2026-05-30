-- ============================================================
-- RLS: Clinic-level tenant isolation
-- ============================================================
-- All tables containing patient or clinic data are protected by
-- Row Level Security. Policies require the session variable
-- app.clinic_id to be set via set_config() before any query.
--
-- FORCE ROW LEVEL SECURITY means this applies even to the
-- postgres superuser (the role Prisma connects as).
--
-- In application code, use withClinicDb(clinicId, fn) from
-- lib/clinic-db.ts which wraps every transaction with:
--   SELECT set_config('app.clinic_id', $clinicId, TRUE)
-- ============================================================

-- Helper function so policies stay readable
CREATE OR REPLACE FUNCTION app_clinic_id() RETURNS text
  LANGUAGE sql STABLE
  AS $$ SELECT current_setting('app.clinic_id', TRUE) $$;

-- ── Patient (core SPI table) ─────────────────────────────────
ALTER TABLE "Patient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Patient" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "Patient";
CREATE POLICY "clinic_isolation" ON "Patient"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());

-- ── ConsentRecord ────────────────────────────────────────────
ALTER TABLE "ConsentRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConsentRecord" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "ConsentRecord";
CREATE POLICY "clinic_isolation" ON "ConsentRecord"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());

-- ── Visit ────────────────────────────────────────────────────
ALTER TABLE "Visit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Visit" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "Visit";
CREATE POLICY "clinic_isolation" ON "Visit"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());

-- ── Invoice ──────────────────────────────────────────────────
ALTER TABLE "Invoice" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Invoice" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "Invoice";
CREATE POLICY "clinic_isolation" ON "Invoice"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());

-- ── LoyaltyCard ──────────────────────────────────────────────
ALTER TABLE "LoyaltyCard" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoyaltyCard" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "LoyaltyCard";
CREATE POLICY "clinic_isolation" ON "LoyaltyCard"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());

-- ── LoyaltyCardUsage (no clinicId — protected via LoyaltyCard) ──
ALTER TABLE "LoyaltyCardUsage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoyaltyCardUsage" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "LoyaltyCardUsage";
CREATE POLICY "clinic_isolation" ON "LoyaltyCardUsage"
  USING (
    EXISTS (
      SELECT 1 FROM "LoyaltyCard" lc
      WHERE lc.id = "LoyaltyCardUsage"."loyaltyCardId"
        AND lc."clinicId" = app_clinic_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "LoyaltyCard" lc
      WHERE lc.id = "LoyaltyCardUsage"."loyaltyCardId"
        AND lc."clinicId" = app_clinic_id()
    )
  );

-- ── LoyaltyCardTemplate ──────────────────────────────────────
ALTER TABLE "LoyaltyCardTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LoyaltyCardTemplate" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "LoyaltyCardTemplate";
CREATE POLICY "clinic_isolation" ON "LoyaltyCardTemplate"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());

-- ── Appointment ──────────────────────────────────────────────
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "Appointment";
CREATE POLICY "clinic_isolation" ON "Appointment"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());

-- ── Expense ──────────────────────────────────────────────────
ALTER TABLE "Expense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Expense" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "Expense";
CREATE POLICY "clinic_isolation" ON "Expense"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());

-- ── RecurringExpense ─────────────────────────────────────────
ALTER TABLE "RecurringExpense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecurringExpense" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "RecurringExpense";
CREATE POLICY "clinic_isolation" ON "RecurringExpense"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());

-- ── Supplier ─────────────────────────────────────────────────
ALTER TABLE "Supplier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Supplier" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "Supplier";
CREATE POLICY "clinic_isolation" ON "Supplier"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());

-- ── Employee ─────────────────────────────────────────────────
ALTER TABLE "Employee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Employee" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "Employee";
CREATE POLICY "clinic_isolation" ON "Employee"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());

-- ── SalaryHistory (no clinicId — protected via Employee) ─────
ALTER TABLE "SalaryHistory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SalaryHistory" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "SalaryHistory";
CREATE POLICY "clinic_isolation" ON "SalaryHistory"
  USING (
    EXISTS (
      SELECT 1 FROM "Employee" e
      WHERE e.id = "SalaryHistory"."employeeId"
        AND e."clinicId" = app_clinic_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Employee" e
      WHERE e.id = "SalaryHistory"."employeeId"
        AND e."clinicId" = app_clinic_id()
    )
  );

-- ── AttendanceRecord ─────────────────────────────────────────
ALTER TABLE "AttendanceRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AttendanceRecord" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "AttendanceRecord";
CREATE POLICY "clinic_isolation" ON "AttendanceRecord"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());

-- ── PayrollRecord ────────────────────────────────────────────
ALTER TABLE "PayrollRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PayrollRecord" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "PayrollRecord";
CREATE POLICY "clinic_isolation" ON "PayrollRecord"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());

-- ── ThirteenthMonthRecord ────────────────────────────────────
ALTER TABLE "ThirteenthMonthRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ThirteenthMonthRecord" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "ThirteenthMonthRecord";
CREATE POLICY "clinic_isolation" ON "ThirteenthMonthRecord"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());

-- ── Equipment ────────────────────────────────────────────────
ALTER TABLE "Equipment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Equipment" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "Equipment";
CREATE POLICY "clinic_isolation" ON "Equipment"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());

-- ── ServiceCatalog ───────────────────────────────────────────
ALTER TABLE "ServiceCatalog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceCatalog" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "ServiceCatalog";
CREATE POLICY "clinic_isolation" ON "ServiceCatalog"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());

-- ── ScheduledReminder ────────────────────────────────────────
ALTER TABLE "ScheduledReminder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ScheduledReminder" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "ScheduledReminder";
CREATE POLICY "clinic_isolation" ON "ScheduledReminder"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());

-- ── UnlinkedMessenger ────────────────────────────────────────
ALTER TABLE "UnlinkedMessenger" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UnlinkedMessenger" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "UnlinkedMessenger";
CREATE POLICY "clinic_isolation" ON "UnlinkedMessenger"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());

-- ── QuarterlyReportLog ───────────────────────────────────────
ALTER TABLE "QuarterlyReportLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QuarterlyReportLog" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "QuarterlyReportLog";
CREATE POLICY "clinic_isolation" ON "QuarterlyReportLog"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());

-- ── AuditLog ─────────────────────────────────────────────────
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "AuditLog";
CREATE POLICY "clinic_isolation" ON "AuditLog"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());

-- ── ScPwdAuditLog ────────────────────────────────────────────
ALTER TABLE "ScPwdAuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ScPwdAuditLog" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "ScPwdAuditLog";
CREATE POLICY "clinic_isolation" ON "ScPwdAuditLog"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());
