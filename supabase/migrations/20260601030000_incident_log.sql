-- ============================================================
-- P4: Security incident & data-breach register (RA 10173)
-- ============================================================
-- Backs the 72-hour NPC breach notification clock and the Annual Security
-- Incident Report (ASIR). Created to match the Prisma IncidentLog model
-- (camelCase, quoted identifiers). Idempotent.

CREATE TABLE IF NOT EXISTS "IncidentLog" (
  "id"                  text PRIMARY KEY,
  "clinicId"            text NOT NULL REFERENCES "Clinic"("id"),
  "incidentDate"        timestamp(3) NOT NULL,
  "discoveryDate"       timestamp(3) NOT NULL,
  "type"                text NOT NULL,
  "severity"            text NOT NULL DEFAULT 'LOW',
  "description"         text NOT NULL,
  "natureOfData"        text,
  "individualsAffected" integer NOT NULL DEFAULT 0,
  "measuresTaken"       text,
  "reportedToNpc"       boolean NOT NULL DEFAULT false,
  "npcReportDate"       timestamp(3),
  "reportedToSubjects"  boolean NOT NULL DEFAULT false,
  "status"              text NOT NULL DEFAULT 'OPEN',
  "createdBy"           text NOT NULL,
  "createdAt"           timestamp(3) NOT NULL DEFAULT now(),
  "updatedAt"           timestamp(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "IncidentLog_clinicId_discoveryDate_idx"
  ON "IncidentLog" ("clinicId", "discoveryDate");

-- RLS: same tenant isolation as the rest of the schema.
ALTER TABLE "IncidentLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IncidentLog" FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "clinic_isolation" ON "IncidentLog";
CREATE POLICY "clinic_isolation" ON "IncidentLog"
  USING ("clinicId" = app_clinic_id())
  WITH CHECK ("clinicId" = app_clinic_id());
