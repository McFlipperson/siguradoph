'use server'

import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

async function getClinicId(): Promise<string> {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user?.email) throw new Error('Not authenticated')
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { clinicId: true },
  })
  if (!user?.clinicId) throw new Error('No clinic')
  return user.clinicId
}

export type PatientSummary = {
  id: string
  firstName: string
  lastName: string
  phone: string
  dateOfBirth: Date
  enrolledAt: Date
  lastVisitDate: Date | null
  hasActiveLoyaltyCard: boolean
}

export async function getPatients(): Promise<PatientSummary[]> {
  const clinicId = await getClinicId()
  const patients = await prisma.patient.findMany({
    where: { clinicId },
    orderBy: { createdAt: 'desc' },
    include: {
      visits: {
        orderBy: { visitDate: 'desc' },
        take: 1,
        select: { visitDate: true },
      },
      loyaltyCards: {
        where: { isActive: true },
        take: 1,
        select: { id: true },
      },
    },
  })

  return patients.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    phone: p.phone,
    dateOfBirth: p.dateOfBirth,
    enrolledAt: p.enrolledAt,
    lastVisitDate: p.visits[0]?.visitDate ?? null,
    hasActiveLoyaltyCard: p.loyaltyCards.length > 0,
  }))
}

export type CreatePatientData = {
  firstName: string
  lastName: string
  dateOfBirth: string
  address: string
  phone: string
  email?: string
  medicalHistory: string
  medications: string
  allergies: string
  isMinor: boolean
  guardianName?: string
  guardianRelationship?: string
  guardianPhone?: string
}

export async function createPatient(data: CreatePatientData): Promise<string> {
  const clinicId = await getClinicId()
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { enrollmentDate: true },
  })
  if (!clinic) throw new Error('Clinic not found')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const enrollmentDate = new Date(clinic.enrollmentDate)
  enrollmentDate.setHours(0, 0, 0, 0)
  if (today < enrollmentDate) {
    throw new Error('DAY_ONE: This clinic is not yet accepting records.')
  }

  const enrolledAt = today

  const patient = await prisma.patient.create({
    data: {
      clinicId,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: new Date(data.dateOfBirth),
      address: data.address,
      phone: data.phone,
      email: data.email || null,
      medicalHistory: data.medicalHistory,
      medications: data.medications,
      allergies: data.allergies,
      enrolledAt,
      consentRecords: {
        create: {
          clinicId,
          npcConsentGiven: true,
          truthfulnessDeclaration: true,
          surgicalConsentGiven: true,
          isMinor: data.isMinor,
          guardianName: data.guardianName || null,
          guardianRelationship: data.guardianRelationship || null,
          consentMethod: 'verbal',
        },
      },
    },
  })

  return patient.id
}

export type FullPatient = {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: Date
  address: string
  phone: string
  email: string | null
  medicalHistory: string | null
  medications: string | null
  allergies: string | null
  enrolledAt: Date
  bracesComplete: boolean
  reminderChannel: string
  messengerPsid: string | null
  consentRecords: Array<{
    id: string
    consentDate: Date
    consentMethod: string
    isMinor: boolean
    guardianName: string | null
    guardianRelationship: string | null
  }>
  visits: Array<{
    id: string
    visitDate: Date
    diagnosis: string
    toothNumber: string | null
    treatment: string
    notes: string | null
    grossAmount: number
    netAmount: number
    vatAmount: number
    invoice: {
      orNumber: string
    } | null
  }>
  loyaltyCards: Array<{
    id: string
    cardNumber: string
    purchaseDate: Date
    expiryDate: Date
    isActive: boolean
    cleaningUses50: number
    cleaningUses25: number
    fillingUses50: number
    fillingUses25: number
    rctUses: number
    dentureUses: number
    bracesUses: number
    wisdomToothUses: number
    extractionUses: number
  }>
}

export async function getPatient(patientId: string): Promise<FullPatient> {
  const clinicId = await getClinicId()
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    include: {
      consentRecords: {
        orderBy: { consentDate: 'desc' },
      },
      visits: {
        orderBy: { visitDate: 'desc' },
        include: {
          invoice: {
            select: { orNumber: true },
          },
        },
      },
      loyaltyCards: {
        where: { isActive: true },
        orderBy: { purchaseDate: 'desc' },
      },
    },
  })

  if (!patient || patient.clinicId !== clinicId) {
    throw new Error('Patient not found')
  }

  return {
    ...patient,
    visits: patient.visits.map((v) => ({
      ...v,
      grossAmount: Number(v.grossAmount),
      netAmount: Number(v.netAmount),
      vatAmount: Number(v.vatAmount),
    })),
  }
}

export async function updatePatientMedical(
  patientId: string,
  data: { medicalHistory: string; medications: string; allergies: string }
) {
  const clinicId = await getClinicId()
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { clinicId: true },
  })
  if (!patient || patient.clinicId !== clinicId) throw new Error('Patient not found')

  await prisma.patient.update({
    where: { id: patientId },
    data: {
      medicalHistory: data.medicalHistory,
      medications: data.medications,
      allergies: data.allergies,
    },
  })

  revalidatePath(`/patients/${patientId}`)
}

export async function issueLoyaltyCard(patientId: string): Promise<string> {
  const clinicId = await getClinicId()
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { clinicId: true, firstName: true, lastName: true },
  })
  if (!patient || patient.clinicId !== clinicId) throw new Error('Patient not found')

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: {
      name: true,
      tin: true,
      street: true,
      city: true,
      orSeriesStart: true,
      orSeriesCurrentNumber: true,
    },
  })
  if (!clinic) throw new Error('Clinic not found')

  const cardNumber = `LC-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  const today = new Date()
  const expiryDate = new Date(today)
  expiryDate.setFullYear(expiryDate.getFullYear() + 2)

  const grossAmount = 500
  const netAmount = parseFloat((grossAmount / 1.12).toFixed(2))
  const vatAmount = parseFloat((grossAmount - netAmount).toFixed(2))

  const padded = String(clinic.orSeriesCurrentNumber).padStart(clinic.orSeriesStart.length, '0')
  const orNumber = padded

  const loyaltyCard = await prisma.loyaltyCard.create({
    data: {
      clinicId,
      patientId,
      cardNumber,
      expiryDate,
    },
  })

  await prisma.invoice.create({
    data: {
      clinicId,
      visitId: null,
      orNumber,
      sellerName: clinic.name,
      sellerTin: clinic.tin,
      sellerAddress: `${clinic.street}, ${clinic.city}`,
      buyerName: `${patient.firstName} ${patient.lastName}`,
      serviceDescription: 'Loyalty Card',
      grossAmount,
      netAmount,
      vatAmount,
      paymentMethod: 'CASH',
      loyaltyCardId: loyaltyCard.id,
    },
  })

  await prisma.clinic.update({
    where: { id: clinicId },
    data: { orSeriesCurrentNumber: { increment: 1 } },
  })

  revalidatePath(`/patients/${patientId}`)
  return loyaltyCard.id
}

export async function markBracesComplete(patientId: string): Promise<void> {
  const clinicId = await getClinicId()
  const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId }, select: { id: true } })
  if (!patient) throw new Error('Patient not found')

  await prisma.patient.update({ where: { id: patientId }, data: { bracesComplete: true } })

  // Cancel all pending BRACES_ALIGNMENT reminders for this patient
  await prisma.scheduledReminder.updateMany({
    where: { patientId, clinicId, reminderType: 'BRACES_ALIGNMENT', status: 'PENDING' },
    data: { status: 'FAILED' },
  })

  revalidatePath(`/patients/${patientId}`)
}

export type ServiceCatalogItem = {
  id: string
  name: string
  category: string
  sortOrder: number
}

export async function getServiceCatalog(): Promise<ServiceCatalogItem[]> {
  const clinicId = await getClinicId()
  return prisma.serviceCatalog.findMany({
    where: { clinicId, isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, category: true, sortOrder: true },
  })
}

export type CreateVisitData = {
  patientId: string
  visitDate: string
  diagnosis: string
  toothNumber?: string
  treatment: string
  notes: string
  grossAmount: number
  isBracesReminder?: boolean
  reminderWeeks?: number
}

export async function createVisit(data: CreateVisitData): Promise<string> {
  const clinicId = await getClinicId()

  const grossAmount = data.grossAmount
  const netAmount = parseFloat((grossAmount / 1.12).toFixed(2))
  const vatAmount = parseFloat((grossAmount - netAmount).toFixed(2))

  const visit = await prisma.visit.create({
    data: {
      clinicId,
      patientId: data.patientId,
      visitDate: new Date(data.visitDate),
      diagnosis: data.diagnosis,
      toothNumber: data.toothNumber || null,
      treatment: data.treatment,
      notes: data.notes,
      grossAmount,
      netAmount,
      vatAmount,
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

  revalidatePath(`/patients/${data.patientId}`)
  return visit.id
}
