'use server'

import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { isAdminEmail } from '@/lib/admin'
import { revalidatePath } from 'next/cache'

async function requireAdmin(): Promise<string> {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!isAdminEmail(authUser?.email)) throw new Error('Forbidden')
  return authUser!.email!
}

export type PlatformIncidentInput = {
  incidentDate: string
  discoveryDate: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  description: string
  natureOfData?: string
  clinicsAffected: number
  individualsAffected: number
  measuresTaken?: string
}

export async function createPlatformIncident(data: PlatformIncidentInput): Promise<void> {
  const actor = await requireAdmin()
  if (!data.description?.trim()) throw new Error('Description is required')
  if (!data.incidentDate || !data.discoveryDate) throw new Error('Dates are required')

  await prisma.platformIncident.create({
    data: {
      incidentDate: new Date(data.incidentDate),
      discoveryDate: new Date(data.discoveryDate),
      type: data.type,
      severity: data.severity,
      description: data.description.trim(),
      natureOfData: data.natureOfData?.trim() || null,
      clinicsAffected: Math.max(0, Math.floor(Number(data.clinicsAffected) || 0)),
      individualsAffected: Math.max(0, Math.floor(Number(data.individualsAffected) || 0)),
      measuresTaken: data.measuresTaken?.trim() || null,
      createdBy: actor,
    },
  })
  revalidatePath('/admin/incidents')
}

export async function updatePlatformIncident(data: {
  id: string
  status?: 'OPEN' | 'CONTAINED' | 'RESOLVED'
  reportedToNpc?: boolean
  reportedToSubjects?: boolean
}): Promise<void> {
  await requireAdmin()
  await prisma.platformIncident.update({
    where: { id: data.id },
    data: {
      ...(data.status !== undefined && { status: data.status }),
      ...(data.reportedToNpc !== undefined && { reportedToNpc: data.reportedToNpc }),
      ...(data.reportedToNpc === true && { npcReportDate: new Date() }),
      ...(data.reportedToSubjects !== undefined && { reportedToSubjects: data.reportedToSubjects }),
    },
  })
  revalidatePath('/admin/incidents')
}
