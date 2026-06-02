-- ============================================================
-- Admin action log (Sigurado super-admin activity, e.g. plan changes)
-- ============================================================
-- Matches the Prisma AdminAuditLog model. Idempotent. No RLS — it is
-- cross-clinic and only ever read through the admin-gated /admin route.

CREATE TABLE IF NOT EXISTS "AdminAuditLog" (
  "id"             text PRIMARY KEY,
  "actorEmail"     text NOT NULL,
  "action"         text NOT NULL,
  "targetClinicId" text NOT NULL,
  "detail"         text NOT NULL,
  "createdAt"      timestamp(3) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "AdminAuditLog_createdAt_idx" ON "AdminAuditLog" ("createdAt");
