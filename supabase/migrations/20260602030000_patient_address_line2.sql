-- Optional second address line (unit/building/barangay) on Patient. Idempotent.
ALTER TABLE "Patient"
  ADD COLUMN IF NOT EXISTS "addressLine2" text;
