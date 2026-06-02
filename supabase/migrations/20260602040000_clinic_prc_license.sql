-- Dentist PRC license number (printed on dental certificates). Idempotent.
ALTER TABLE "Clinic"
  ADD COLUMN IF NOT EXISTS "prcLicenseNo" text;
