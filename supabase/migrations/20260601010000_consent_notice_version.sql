-- ============================================================
-- Consent evidence: record WHICH privacy notice the data subject agreed to
-- ============================================================
-- RA 10173 requires consent for Sensitive Personal Information to be
-- demonstrable. Storing the notice version the patient actually agreed to
-- (alongside the real consentDate/method) lets the clinic prove not just
-- that consent was given, but what the patient was consenting to.
--
-- Idempotent so it is safe to apply whether or not `prisma db push`
-- has already added the column.
-- ============================================================

ALTER TABLE "ConsentRecord"
  ADD COLUMN IF NOT EXISTS "noticeVersion" text;
