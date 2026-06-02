-- ============================================================
-- Subscription plans: FREE / BASIC / PRO
-- ============================================================
-- Adds Clinic.plan and grandfathers every EXISTING clinic to PRO so nobody
-- already onboarded loses features. New signups default to FREE.
-- Idempotent.

DO $$ BEGIN
  CREATE TYPE "Plan" AS ENUM ('FREE', 'BASIC', 'PRO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "Clinic"
  ADD COLUMN IF NOT EXISTS "plan" "Plan" NOT NULL DEFAULT 'FREE';

-- Grandfather all clinics that existed before this migration to PRO.
-- (Runs once; new rows created after this default to FREE.)
UPDATE "Clinic" SET "plan" = 'PRO' WHERE "createdAt" < now();
