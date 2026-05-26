'use server'

import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getActor } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'

async function getClinicId(): Promise<string> {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser?.email) throw new Error('Not authenticated')
  const user = await prisma.user.findUnique({
    where: { email: authUser.email },
    select: { clinicId: true },
  })
  if (!user?.clinicId) throw new Error('No clinic')
  return user.clinicId
}

export type VisitSetup = {
  patient: {
    id: string
    firstName: string
    lastName: string
    phone: string
  }
  serviceCatalog: Array<{
    id: string
    name: string
    category: string
    sortOrder: number
  }>
  clinic: {
    enrollmentDate: Date
  }
}

export async function getVisitSetup(patientId: string): Promise<VisitSetup> {
  const clinicId = await getClinicId()

  const [patient, clinic, services] = await Promise.all([
    prisma.patient.findUnique({
      where: { id: patientId },
      select: { id: true, firstName: true, lastName: true, phone: true, clinicId: true },
    }),
    prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { enrollmentDate: true },
    }),
    prisma.serviceCatalog.findMany({
      where: { clinicId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, category: true, sortOrder: true },
    }),
  ])

  if (!patient || patient.clinicId !== clinicId) throw new Error('Patient not found')
  if (!clinic) throw new Error('Clinic not found')

  return {
    patient: {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone,
    },
    serviceCatalog: services,
    clinic: {
      enrollmentDate: clinic.enrollmentDate,
    },
  }
}

export type SaveVisitData = {
  patientId: string
  visitDate: string
  diagnosis: string
  toothNumber?: string
  treatment: string
  notes: string
  grossAmount: number
  isBracesReminder?: boolean
  reminderWeeks?: number
  isCleaningService?: boolean
  appointmentId?: string
}

export async function saveVisit(data: SaveVisitData): Promise<string> {
  const { clinicId, userEmail } = await getActor()

  // Dental services are VAT-exempt (NIRC §109). Net = gross, VAT = 0.
  const gross = data.grossAmount
  const net = gross
  const vat = 0

  // Interpret visitDate as PHT (UTC+8) — append offset so it's stored correctly in UTC
  const visitDate = new Date(data.visitDate + ':00+08:00')

  const visit = await prisma.visit.create({
    data: {
      clinicId,
      patientId: data.patientId,
      visitDate,
      diagnosis: data.diagnosis,
      toothNumber: data.toothNumber || null,
      treatment: data.treatment,
      notes: data.notes,
      grossAmount: gross,
      netAmount: net,
      vatAmount: vat,
      intervalWeeks: data.reminderWeeks ?? null,
    },
  })

  if (data.isBracesReminder && data.reminderWeeks) {
    const scheduledFor = new Date(data.visitDate)
    scheduledFor.setDate(scheduledFor.getDate() + data.reminderWeeks * 7)
    await prisma.scheduledReminder.create({
      data: {
        clinicId,
        patientId: data.patientId,
        visitId: visit.id,
        reminderType: 'BRACES_ALIGNMENT',
        scheduledFor,
      },
    })
  }

  if (data.isCleaningService) {
    const scheduledFor = new Date(data.visitDate)
    scheduledFor.setMonth(scheduledFor.getMonth() + 6)
    await prisma.scheduledReminder.create({
      data: {
        clinicId,
        patientId: data.patientId,
        visitId: visit.id,
        reminderType: 'CLEANING_RECALL',
        scheduledFor,
      },
    })
  }

  if (data.appointmentId) {
    await prisma.appointment.update({
      where: { id: data.appointmentId },
      data: { status: 'COMPLETED' },
    })
  }

  await writeAudit({
    clinicId,
    userEmail,
    action: 'CREATE_VISIT',
    resourceType: 'VISIT',
    resourceId: visit.id,
    detail: `Recorded visit for patient ${data.patientId}: ${data.treatment}`,
  })

  revalidatePath(`/patients/${data.patientId}`)
  return visit.id
}

export type UpdateVisitData = {
  visitId: string
  treatment: string
  diagnosis: string
  toothNumber?: string
  notes: string
  // Only editable when no invoice has been issued yet
  grossAmount?: number
  visitDate?: string
}

export async function updateVisit(data: UpdateVisitData): Promise<void> {
  const { clinicId, userEmail } = await getActor()

  const visit = await prisma.visit.findUnique({
    where: { id: data.visitId },
    include: { invoice: { select: { id: true } } },
  })
  if (!visit || visit.clinicId !== clinicId) throw new Error('Visit not found')
  if (visit.status === 'VOID') throw new Error('Cannot edit a voided visit')

  const hasInvoice = !!visit.invoice

  // Build the update payload — clinical fields are always editable
  // Financial + date fields are locked once an invoice is issued
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {
    treatment: data.treatment.trim(),
    diagnosis: data.diagnosis.trim(),
    toothNumber: data.toothNumber?.trim() || null,
    notes: data.notes.trim(),
  }

  if (!hasInvoice) {
    if (data.grossAmount !== undefined && data.grossAmount > 0) {
      updateData.grossAmount = data.grossAmount
      updateData.netAmount = data.grossAmount  // dental is VAT-exempt
      updateData.vatAmount = 0
    }
    if (data.visitDate) {
      updateData.visitDate = new Date(data.visitDate + ':00+08:00')
    }
  }

  await prisma.visit.update({
    where: { id: data.visitId },
    data: updateData,
  })

  await writeAudit({
    clinicId,
    userEmail,
    action: 'UPDATE_VISIT',
    resourceType: 'VISIT',
    resourceId: data.visitId,
    detail: `Edited visit: ${data.treatment}${hasInvoice ? ' (clinical fields only — invoice locked)' : ''}`,
  })

  revalidatePath(`/patients/${visit.patientId}`)
}

export async function voidVisit(visitId: string): Promise<void> {
  const { clinicId, userEmail } = await getActor()

  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: { invoice: { select: { id: true, orNumber: true, status: true } } },
  })
  if (!visit || visit.clinicId !== clinicId) throw new Error('Visit not found')
  if (visit.status === 'VOID') throw new Error('Already voided')

  await prisma.$transaction(async (tx) => {
    await tx.visit.update({ where: { id: visitId }, data: { status: 'VOID' } })
    // Also void the linked invoice if it hasn't been voided already
    if (visit.invoice && visit.invoice.status !== 'VOID') {
      await tx.invoice.update({ where: { id: visit.invoice.id }, data: { status: 'VOID' } })
    }
  })

  await writeAudit({
    clinicId,
    userEmail,
    action: 'VOID_INVOICE',
    resourceType: 'VISIT',
    resourceId: visitId,
    detail: `Voided visit${visit.invoice ? ` and OR #${visit.invoice.orNumber}` : ''}: ${visit.treatment}`,
  })

  revalidatePath(`/patients/${visit.patientId}`)
  revalidatePath('/invoices')
}
