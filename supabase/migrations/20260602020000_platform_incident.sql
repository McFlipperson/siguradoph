-- ============================================================
-- Sigurado's own (PIP) security incident register
-- ============================================================
-- Company-level incidents for Sigurado as Personal Information Processor.
-- Matches the Prisma PlatformIncident model. No RLS — admin-only via /admin.
-- Idempotent.

CREATE TABLE IF NOT EXISTS "PlatformIncident" (
  "id"                  text PRIMARY KEY,
  "incidentDate"        timestamp(3) NOT NULL,
  "discoveryDate"       timestamp(3) NOT NULL,
  "type"                text NOT NULL,
  "severity"            text NOT NULL DEFAULT 'LOW',
  "description"         text NOT NULL,
  "natureOfData"        text,
  "clinicsAffected"     integer NOT NULL DEFAULT 0,
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

CREATE INDEX IF NOT EXISTS "PlatformIncident_discoveryDate_idx" ON "PlatformIncident" ("discoveryDate");
