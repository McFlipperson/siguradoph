-- ============================================================
-- P5: Clinic DPO/NPC fields + ConsentRecord immutability
-- ============================================================

-- 1. The CLINIC's own DPO + NPC registration (clinic = PIC under RA 10173).
--    Distinct from Sigurado's company DPO (lib/dpo.ts). Idempotent.
ALTER TABLE "Clinic"
  ADD COLUMN IF NOT EXISTS "dpoName" text,
  ADD COLUMN IF NOT EXISTS "dpoEmail" text,
  ADD COLUMN IF NOT EXISTS "dpoPhone" text,
  ADD COLUMN IF NOT EXISTS "npcRegistrationNumber" text,
  ADD COLUMN IF NOT EXISTS "npcRegistrationDate" timestamp(3);

-- 2. ConsentRecord immutability.
--    A recorded consent is evidence under RA 10173 and must not be altered after
--    the fact. Corrections/withdrawals are made by INSERTing a NEW ConsentRecord,
--    never by editing an existing one. This trigger blocks UPDATE at the database
--    layer and fires for EVERY role (including the BYPASSRLS postgres role), so it
--    holds regardless of which client connects.
--
--    DELETE is intentionally NOT blocked: patient erasure (right to be forgotten)
--    cascades through ConsentRecord. Tamper-resistance applies to mutation of a
--    living record, not to lawful deletion of the whole patient.
CREATE OR REPLACE FUNCTION block_consentrecord_update() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'ConsentRecord is immutable: % not allowed. Insert a new consent record to correct or withdraw.', TG_OP
    USING ERRCODE = 'check_violation';
END;
$$;

DROP TRIGGER IF EXISTS consentrecord_no_update ON "ConsentRecord";
CREATE TRIGGER consentrecord_no_update
  BEFORE UPDATE ON "ConsentRecord"
  FOR EACH ROW EXECUTE FUNCTION block_consentrecord_update();
