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

  await prisma.clinic.update({ where: { id: clinicId }, data: { plan } })
  revalidatePath('/admin')
}
