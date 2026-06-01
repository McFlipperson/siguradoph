-- ============================================================
-- H2: Patient anonymization (RA 10173 erasure vs BIR retention)
-- ============================================================
-- A patient with issued official receipts can no longer be hard-deleted
-- (that would destroy BIR-mandated financial records). Instead their PII is
-- scrubbed and anonymizedAt is stamped, while invoices/visits are retained.
-- Idempotent.

ALTER TABLE "Patient"
  ADD COLUMN IF NOT EXISTS "anonymizedAt" timestamp(3);
