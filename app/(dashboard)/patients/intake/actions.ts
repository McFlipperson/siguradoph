'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getActorDb, getClinicPlan } from '@/lib/auth'
import { patientLimit } from '@/lib/entitlements'

export type ReminderChannel = 'MESSENGER' | 'EMAIL' | 'SMS' | 'NONE'

export type IntakeStep1Data = {
  firstName: string
  middleName?: string
  lastName: string
  dateOfBirth: string
  address: string
  phone: string
  email?: string
  philsysId?: string
  medicalHistory: string
  medications: string
  allergies: string
  isMinor: boolean
  guardianName?: string
  guardianRelationship?: string
  // RA 10173: consent is captured from the data subject's actual action on the
  // intake device — never assumed. noticeVersion records WHICH privacy notice
  // they agreed to, for evidentiary purposes.
  consentGiven: boolean
  noticeVersion: string
}

export type IntakeStep1Result =
  | { success: true; patientId: string; firstName: string }
  | { success: false; error: string }

// ── STEP 1: Save patient + consent (called on "Continue →") ──────────────────
export async function submitIntakeStep1(data: IntakeStep1Data): Promise<IntakeStep1Result> {
  try {
    const { clinicId, db } = await getActorDb()

    // RA 10173: no lawful basis → do not create a Sensitive Personal Information
    // record. Consent must be the data subject's actual action, not assumed.
    if (!data.consentGiven) return { success: false, error: 'consent_required' }

    // Free-tier patient cap. Basic/Pro are unlimited.
    const plan = await getClinicPlan(clinicId)
    const limit = patientLimit(plan)
    if (Number.isFinite(limit)) {
      const count = await db((tx) => tx.patient.count({ where: { clinicId } }))
      if (count >= limit) return { success: false, error: 'patient_limit' }
    }

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
    if (today < enrollmentDate) return { success: false, error: 'day_one' }

    const { patientId, firstName } = await db(async (tx) => {
      const patient = await tx.patient.create({
        data: {
          clinicId,
          firstName: data.firstName.trim(),
          middleName: data.middleName?.trim() || null,
          lastName: data.lastName.trim(),
          dateOfBirth: new Date(data.dateOfBirth),
          address: data.address.trim(),
          phone: data.phone.trim(),
          email: data.email?.trim() || null,
          philsysId: data.philsysId?.trim() || null,
          medicalHistory: data.medicalHistory.trim(),
          medications: data.medications.trim(),
          allergies: data.allergies.trim(),
          enrolledAt: new Date(),
          reminderChannel: 'NONE', // updated in step 2
        },
      })

      await tx.consentRecord.create({
        data: {
          patientId: patient.id,
          clinicId,
          // Persist the data subject's ACTUAL consent action (the single tap on
          // the intake device covers processing consent + truthfulness — see
          // the consent statement in IntakeForm). Never hardcoded.
          npcConsentGiven: data.consentGiven,
          truthfulnessDeclaration: data.consentGiven,
          surgicalConsentGiven: false,
          isMinor: data.isMinor,
          guardianName: data.isMinor ? data.guardianName?.trim() || null : null,
          guardianRelationship: data.isMinor ? data.guardianRelationship?.trim() || null : null,
          consentMethod: 'digital',
          noticeVersion: data.noticeVersion,
        },
      })

      return { patientId: patient.id, firstName: data.firstName }
    })

    revalidatePath('/patients')
    return { success: true, patientId, firstName }
  } catch {
    return { success: false, error: 'server_error' }
  }
}

// ── STEP 2: Update reminder channel (called on "Complete Registration") ───────
export type IntakeStep2Result =
  | { success: true }
  | { success: false; error: string }

export async function submitIntakeStep2(
  patientId: string,
  reminderChannel: ReminderChannel
): Promise<IntakeStep2Result> {
  try {
    const { clinicId, db } = await getActorDb()

    const patient = await db((tx) => tx.patient.findFirst({
      where: { id: patientId, clinicId },
      select: { id: true },
    }))
    if (!patient) return { success: false, error: 'patient_not_found' }

    await db((tx) => tx.patient.update({
      where: { id: patientId },
      data: { reminderChannel },
    }))

    revalidatePath(`/patients/${patientId}`)
    return { success: true }
  } catch {
    return { success: false, error: 'server_error' }
  }
}
