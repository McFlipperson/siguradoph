-- Honor-system self-report payment flow
-- Adds SELF_REPORTED to UpgradeStatus enum and selfReportedAt column to PendingUpgrade.

ALTER TYPE "UpgradeStatus" ADD VALUE IF NOT EXISTS 'SELF_REPORTED';

ALTER TABLE "PendingUpgrade"
  ADD COLUMN IF NOT EXISTS "selfReportedAt" TIMESTAMPTZ;

-- Verify
SELECT unnest(enum_range(NULL::"UpgradeStatus"))::text AS status;
