'use server'

import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'

export async function updateClinicLogo(logoUrl: string | null): Promise<{ error: string | null }> {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser?.email) return { error: 'Not authenticated' }

  const user = await prisma.user.findUnique({ where: { email: authUser.email }, include: { clinic: true } })
  if (!user?.clinic) return { error: 'Clinic not found' }

  await prisma.clinic.update({ where: { id: user.clinic.id }, data: { logoUrl } })
  return { error: null }
}

export async function updateClinicSignature(signatureUrl: string | null): Promise<{ error: string | null }> {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser?.email) return { error: 'Not authenticated' }

  const user = await prisma.user.findUnique({ where: { email: authUser.email }, include: { clinic: true } })
  if (!user?.clinic) return { error: 'Clinic not found' }

  await prisma.clinic.update({ where: { id: user.clinic.id }, data: { signatureUrl } })
  return { error: null }
}
