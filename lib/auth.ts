import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { withClinicDb, type TxClient } from '@/lib/clinic-db'
import { planAllows, type Plan, type Feature } from '@/lib/entitlements'

/** Current subscription plan for a clinic (defaults to FREE). */
export async function getClinicPlan(clinicId: string): Promise<Plan> {
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { plan: true },
  })
  return (clinic?.plan as Plan) ?? 'FREE'
}

/**
 * Server-side feature gate. Throws if the clinic's plan doesn't include the
 * feature. UI hiding is cosmetic — this is the real enforcement.
 */
export async function assertFeature(clinicId: string, feature: Feature): Promise<void> {
  const plan = await getClinicPlan(clinicId)
  if (!planAllows(plan, feature)) {
    throw new Error(`UPGRADE_REQUIRED:${feature}`)
  }
}

export async function getSessionUser() {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser?.email) return null
  const user = await prisma.user.findUnique({
    where: { email: authUser.email },
    select: { id: true, email: true, role: true, clinicId: true },
  })
  return user
}

/**
 * Returns the authenticated user's clinicId and email in a single DB call.
 * Use this in server actions that need both for audit logging.
 */
export async function getActor(): Promise<{ clinicId: string; userEmail: string }> {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser?.email) throw new Error('Not authenticated')
  const user = await prisma.user.findUnique({
    where: { email: authUser.email },
    select: { clinicId: true },
  })
  if (!user?.clinicId) throw new Error('No clinic')
  return { clinicId: user.clinicId, userEmail: authUser.email }
}

/**
 * Like getActor() but also returns `db` — a function that runs queries
 * inside a transaction with app.clinic_id set (required by RLS policies).
 *
 * @example
 * const { clinicId, userEmail, db } = await getActorDb()
 * const patients = await db((tx) => tx.patient.findMany())
 */
export async function getActorDb(): Promise<{
  clinicId: string
  userEmail: string
  db: <T>(fn: (tx: TxClient) => Promise<T>) => Promise<T>
}> {
  const actor = await getActor()
  return {
    ...actor,
    db: <T>(fn: (tx: TxClient) => Promise<T>) => withClinicDb(actor.clinicId, fn),
  }
}
