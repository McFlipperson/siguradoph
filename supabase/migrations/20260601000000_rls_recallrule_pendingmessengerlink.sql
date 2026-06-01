-- ============================================================
-- RLS: close two tenant-isolation gaps
-- ============================================================
-- The original isolation migration (20260530000000) missed two
-- tenant-scoped tables. Both carry a clinicId and must be protected
-- by the same app.clinic_id policy as the rest of the schema.
--
--   RecallRule            — per-clinic reminder templates; read during
--                           confirmPayment. Without RLS (and before the
--                           query was clinic-filtered) this leaked every
--                           clinic's rules into other clinics' reminders.
--   PendingMessengerLink  — clinic → patient intake-link slot (SPI-adjacent).
--
-- Mirrors lib/clinic-db.ts: queries must run inside withClinicDb(), which
-- sets app.clinic_id for the transaction.
-- ============================================================

-- ── RecallRule ───────────────────────────────────────────────
ALTER TABLE "RecallRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecallRule" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "RecallRule";
CREATE POLICY "clinic_isolation" ON "RecallRule"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());

-- ── PendingMessengerLink ─────────────────────────────────────
ALTER TABLE "PendingMessengerLink" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PendingMessengerLink" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "PendingMessengerLink";
CREATE POLICY "clinic_isolation" ON "PendingMessengerLink"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());
