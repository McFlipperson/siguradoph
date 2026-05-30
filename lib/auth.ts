import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { withClinicDb, type TxClient } from '@/lib/clinic-db'

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
