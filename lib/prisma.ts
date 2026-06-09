import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

function createPrismaClient(connectionString: string | undefined) {
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaTenant?: PrismaClient
}

/**
 * Elevated client (DATABASE_URL → the `postgres` role, which has BYPASSRLS).
 *
 * Use ONLY for:
 *   - non-tenant tables (Clinic, User, CpaClinicAssignment) used for auth/bootstrap
 *   - trusted system jobs that legitimately span clinics (reminders cron,
 *     quarterly cron) or run without a clinic session (Messenger webhook ingress)
 *   - the audit writer
 *
 * NEVER use this for user-facing per-clinic data access — that must go through
 * withClinicDb() so RLS enforces tenant isolation.
 */
export const prisma = globalForPrisma.prisma ?? createPrismaClient(process.env.DATABASE_URL)

/**
 * Restricted client (TENANT_DATABASE_URL → a dedicated NOBYPASSRLS role).
 *
 * withClinicDb() runs all per-clinic queries through this client inside a
 * transaction that sets app.clinic_id, so the RLS policies actually enforce
 * isolation at the database layer (not just via app-level clinicId filters).
 *
 * Falls back to DATABASE_URL until TENANT_DATABASE_URL is provisioned, so
 * behaviour is unchanged before the restricted role exists. Once the role is
 * created and TENANT_DATABASE_URL is set, RLS goes live for this surface.
 */
export const prismaTenant =
  globalForPrisma.prismaTenant ??
  createPrismaClient(process.env.TENANT_DATABASE_URL ?? process.env.DATABASE_URL)

globalForPrisma.prisma = prisma
globalForPrisma.prismaTenant = prismaTenant
