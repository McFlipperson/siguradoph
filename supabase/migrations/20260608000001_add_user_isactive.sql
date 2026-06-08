-- Add isActive to User table.
-- Existing users (CLINIC_OWNER, CPA, any SECRETARY) default to true — no disruption.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
