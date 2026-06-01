'use server'

import { revalidatePath } from 'next/cache'
import { getActorDb } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'

export type IncidentType =
  | 'UNAUTHORIZED_ACCESS'
  | 'LOSS'
  | 'UNAUTHORIZED_DISCLOSURE'
  | 'SYSTEM_BREACH'
  | 'RANSOMWARE'
  | 'OTHER'

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH'
export type IncidentStatus = 'OPEN' | 'CONTAINED' | 'RESOLVED'

export type IncidentRow = {
  id: string
  incidentDate: string
  discoveryDate: string
  type: string
  severity: string
  description: string
  natureOfData: string | null
  individualsAffected: number
  measuresTaken: string | null
  reportedToNpc: boolean
  npcReportDate: string | null
  reportedToSubjects: boolean
  status: string
  createdBy: string
  createdAt: string
}

export type CreateIncidentInput = {
  incidentDate: string
  discoveryDate: string
  type: IncidentType
  severity: IncidentSeverity
  description: string
  natureOfData?: string
  individualsAffected: number
  measuresTaken?: string
}

export async function createIncident(data: CreateIncidentInput): Promise<string> {
  const { clinicId, userEmail, db } = await getActorDb()

  if (!data.description?.trim()) throw new Error('Description is required')
  if (!data.incidentDate || !data.discoveryDate) throw new Error('Incident and discovery dates are required')

  const id = await db(async (tx) => {
    const rec = await tx.incidentLog.create({
      data: {
        clinicId,
        incidentDate: new Date(data.incidentDate),
        discoveryDate: new Date(data.discoveryDate),
        type: data.type,
        severity: data.severity,
        description: data.description.trim(),
        natureOfData: data.natureOfData?.trim() || null,
        individualsAffected: Math.max(0, Math.floor(Number(data.individualsAffected) || 0)),
        measuresTaken: data.measuresTaken?.trim() || null,
        createdBy: userEmail,
      },
      select: { id: true },
    })
    return rec.id
  })

  await writeAudit({
    clinicId,
    userEmail,
    action: 'CREATE_INCIDENT',
    resourceType: 'INCIDENT',
    resourceId: id,
    detail: `Logged security incident — ${data.type}, ${data.individualsAffected} individual(s) affected`,
  })

  revalidatePath('/compliance')
  return id
}

export type UpdateIncidentInput = {
  id: string
  status?: IncidentStatus
  reportedToNpc?: boolean
  npcReportDate?: string | null
  reportedToSubjects?: boolean
  measuresTaken?: string
}

export async function updateIncident(data: UpdateIncidentInput): Promise<void> {
  const { clinicId, userEmail, db } = await getActorDb()

  const ok = await db(async (tx) => {
    const inc = await tx.incidentLog.findFirst({ where: { id: data.id, clinicId }, select: { id: true } })
    if (!inc) return false
    await tx.incidentLog.update({
      where: { id: data.id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.reportedToNpc !== undefined && { reportedToNpc: data.reportedToNpc }),
        ...(data.npcReportDate !== undefined && {
          npcReportDate: data.npcReportDate ? new Date(data.npcReportDate) : null,
        }),
        // Auto-stamp the NPC report date when marking reported and none provided
        ...(data.reportedToNpc === true && data.npcReportDate === undefined && { npcReportDate: new Date() }),
        ...(data.reportedToSubjects !== undefined && { reportedToSubjects: data.reportedToSubjects }),
        ...(data.measuresTaken !== undefined && { measuresTaken: data.measuresTaken.trim() || null }),
      },
    })
    return true
  })

  if (!ok) throw new Error('Incident not found')

  await writeAudit({
    clinicId,
    userEmail,
    action: 'UPDATE_INCIDENT',
    resourceType: 'INCIDENT',
    resourceId: data.id,
    detail: data.reportedToNpc === true ? 'Marked incident reported to NPC' : 'Updated incident record',
  })

  revalidatePath('/compliance')
}
