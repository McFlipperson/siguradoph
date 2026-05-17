'use server'

import { prisma } from '@/lib/prisma'

export type IntakeFormData = {
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
}

export type IntakeResult =
  | { success: true; firstName: string }
  | { success: false; error: string }

export async function submitIntake(
  clinicId: string,
  data: IntakeFormData
): Promise<IntakeResult> {
  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { id: true, enrollmentDate: true },
    })

    if (!clinic) {
      return { success: false, error: 'invalid_clinic' }
    }

    // Day One Rule: block if today is before enrollmentDate
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const enrollmentDate = new Date(clinic.enrollmentDate)
    enrollmentDate.setHours(0, 0, 0, 0)
    if (today < enrollmentDate) {
      return { success: false, error: 'day_one' }
    }

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
        messengerLinked: false,
        enrolledAt: new Date(),
      },
    })

    await prisma.consentRecord.create({
      data: {
        patientId: patient.id,
        clinicId,
        npcConsentGiven: true,
        truthfulnessDeclaration: true,
        surgicalConsentGiven: true,
        isMinor: data.isMinor,
        guardianName: data.guardianName || null,
        guardianRelationship: data.guardianRelationship || null,
        consentDate: new Date(),
        consentMethod: 'digital',
      },
    })

    return { success: true, firstName: data.firstName }
  } catch {
    return { success: false, error: 'server_error' }
  }
}
