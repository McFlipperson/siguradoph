-- GCash semi-automated billing
-- Adds gcashNumber to Clinic and creates the PendingUpgrade table.

-- 1. GCash number on the clinic (used to match incoming payments by sender phone)
ALTER TABLE "Clinic" ADD COLUMN IF NOT EXISTS "gcashNumber" TEXT;

-- 2. UpgradeStatus enum
DO $$ BEGIN
  CREATE TYPE "UpgradeStatus" AS ENUM ('PENDING', 'CONFIRMED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. PendingUpgrade table
CREATE TABLE IF NOT EXISTS "PendingUpgrade" (
  "id"            TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  "clinicId"      TEXT          NOT NULL,
  "plan"          "Plan"        NOT NULL,
  "referenceCode" TEXT          NOT NULL,
  "amountCents"   INTEGER       NOT NULL,
  "status"        "UpgradeStatus" NOT NULL DEFAULT 'PENDING',
  "gcashTxRef"    TEXT,
  "senderName"    TEXT,
  "createdAt"     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "expiresAt"     TIMESTAMPTZ   NOT NULL,
  "confirmedAt"   TIMESTAMPTZ,
  "confirmedBy"   TEXT,

  CONSTRAINT "PendingUpgrade_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PendingUpgrade_referenceCode_key" UNIQUE ("referenceCode"),
  CONSTRAINT "PendingUpgrade_clinicId_fkey"
    FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "PendingUpgrade_clinicId_status_idx"
  ON "PendingUpgrade"("clinicId", "status");

CREATE INDEX IF NOT EXISTS "PendingUpgrade_referenceCode_idx"
  ON "PendingUpgrade"("referenceCode");

-- Verify
SELECT column_name FROM information_schema.columns
  WHERE table_name = 'Clinic' AND column_name = 'gcashNumber';
SELECT COUNT(*) FROM "PendingUpgrade";
