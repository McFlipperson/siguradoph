'use server'

import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { isAdminEmail } from '@/lib/admin'
import { revalidatePath } from 'next/cache'
import type { Plan } from '@/lib/entitlements'

/** Set a clinic's subscription plan. Sigurado-admin only. */
export async function setClinicPlan(clinicId: string, plan: Plan): Promise<void> {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!isAdminEmail(authUser?.email)) throw new Error('Forbidden')

  if (!['FREE', 'BASIC', 'PRO'].includes(plan)) throw new Error('Invalid plan')

  const before = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { name: true, plan: true },
  })
  if (!before) throw new Error('Clinic not found')
  if (before.plan === plan) return // no-op, don't log

  await prisma.clinic.update({ where: { id: clinicId }, data: { plan } })

  // Tamper-evident record of who changed what, when.
  await prisma.adminAuditLog.create({
    data: {
      actorEmail: authUser!.email!,
      action: 'SET_PLAN',
      targetClinicId: clinicId,
      detail: `${before.name}: ${before.plan} → ${plan}`,
    },
  })

  revalidatePath('/admin')
}
