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

export async function submitIntake(data: IntakeFormData): Promise<IntakeResult> {
  try {
    const clinicId = await getClinicId()

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { enrollmentDate: true },
    })

    if (!clinic) return { success: false, error: 'invalid_clinic' }

    // Day One Rule
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
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        dateOfBirth: new Date(data.dateOfBirth),
        address: data.address.trim(),
        phone: data.phone.trim(),
        email: data.email?.trim() || null,
        medicalHistory: data.medicalHistory.trim(),
        medications: data.medications.trim(),
        allergies: data.allergies.trim(),
        enrolledAt: new Date(),
      },
    })

    // Record consent (RA 10173)
    await prisma.consentRecord.create({
      data: {
        patientId: patient.id,
        clinicId,
        npcConsentGiven: true,
        truthfulnessDeclaration: true,
        surgicalConsentGiven: false,
        isMinor: data.isMinor,
        guardianName: data.isMinor ? data.guardianName?.trim() || null : null,
        guardianRelationship: data.isMinor ? data.guardianRelationship?.trim() || null : null,
        consentMethod: 'digital',
      },
    })

    revalidatePath('/patients')
    return { success: true, firstName: data.firstName }
  } catch (err) {
    console.error('submitIntake error:', err)
    return { success: false, error: 'server_error' }
  }
}
