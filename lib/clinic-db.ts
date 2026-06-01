/**
 * clinic-db.ts
 *
 * Every table that contains patient or clinic data is protected by Postgres
 * Row Level Security (FORCE ROW LEVEL SECURITY — applies even to the postgres
 * superuser that Prisma connects as).
 *
 * The RLS policy on each table is:
 *   USING ("clinicId" = current_setting('app.clinic_id', TRUE))
 *
 * This means ANY query against those tables will return zero rows (or fail on
 * writes) unless app.clinic_id has been set for the current transaction via:
 *   SELECT set_config('app.clinic_id', $clinicId, TRUE)
 *
 * Use withClinicDb() for ALL queries that touch tenant-scoped tables.
 * The plain `prisma` client is only for auth-level lookups (User, Clinic by id).
 */

import { prismaTenant } from './prisma'
import type { PrismaClient } from '@prisma/client'

// The transaction client type Prisma exposes inside $transaction callbacks
export type TxClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

/**
 * Wraps `fn` in a Prisma transaction that first sets `app.clinic_id`
 * as a transaction-local Postgres setting. The RLS policies on all
 * tenant tables enforce this setting at the database level.
 *
 * @example
 * const patients = await withClinicDb(clinicId, (db) =>
 *   db.patient.findMany({ where: { isActive: true } })
 * )
 */
export async function withClinicDb<T>(
  clinicId: string,
  fn: (db: TxClient) => Promise<T>,
): Promise<T> {
  return prismaTenant.$transaction(async (tx) => {
    // TRUE = transaction-local (safe with connection pooling)
    await tx.$executeRaw`SELECT set_config('app.clinic_id', ${clinicId}, TRUE)`
    return fn(tx)
  })
}
