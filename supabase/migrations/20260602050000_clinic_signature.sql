-- Dentist's saved signature image URL (printed on dental certificates). Idempotent.
ALTER TABLE "Clinic"
  ADD COLUMN IF NOT EXISTS "signatureUrl" text;
