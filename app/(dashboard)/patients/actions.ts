'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getActorDb } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'

export type PatientSummary = {
  id: string
  firstName: string
  middleName: string | null
  lastName: string
  phone: string
  dateOfBirth: Date
  enrolledAt: Date
  lastVisitDate: Date | null
  hasActiveLoyaltyCard: boolean
}

export async function getPatients(): Promise<PatientSummary[]> {
  const { clinicId, db } = await getActorDb()
  const patients = await db((tx) => tx.patient.findMany({
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
  }))

  return patients.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    middleName: p.middleName ?? null,
    lastName: p.lastName,
    phone: p.phone,
    dateOfBirth: p.dateOfBirth,
    enrolledAt: p.enrolledAt,
    lastVisitDate: p.visits[0]?.visitDate ?? null,
    hasActiveLoyaltyCard: p.loyaltyCards.length > 0,
  }))
}

// NOTE: The legacy createPatient() action was removed. It fabricated consent
// (npcConsentGiven/truthfulnessDeclaration hardcoded true, method 'verbal') and
// had no callers. The only supported intake path is submitIntakeStep1
// (app/(dashboard)/patients/intake/actions.ts), which records the data subject's
// actual consent action. Do not reintroduce a path that asserts consent.

export type FullPatient = {
  id: string
  firstName: string
  middleName: string | null
  lastName: string
  dateOfBirth: Date
  address: string
  phone: string
  email: string | null
  medicalHistory: string | null
  medications: string | null
  allergies: string | null
  enrolledAt: Date
  anonymizedAt: Date | null
  bracesComplete: boolean
  reminderChannel: string
  messengerPsid: string | null
  // SC/PWD
  isSeniorCitizen: boolean
  scIdNumber: string | null
  isPwd: boolean
  pwdIdNumber: string | null
  pwdDisabilityType: string | null
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
    status: string
    invoice: {
      id: string
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
  const { clinicId, userEmail, db } = await getActorDb()
  const patient = await db((tx) => tx.patient.findUnique({
    where: { id: patientId },
    include: {
      consentRecords: {
        orderBy: { consentDate: 'desc' },
      },
      visits: {
        orderBy: { visitDate: 'desc' },
        include: {
          invoice: {
            select: { id: true, orNumber: true },
          },
        },
      },
      loyaltyCards: {
        where: { isActive: true },
        orderBy: { purchaseDate: 'desc' },
      },
    },
  }))

  if (!patient || patient.clinicId !== clinicId) {
    throw new Error('Patient not found')
  }

  await writeAudit({
    clinicId,
    userEmail,
    action: 'VIEW_PATIENT',
    resourceType: 'PATIENT',
    resourceId: patientId,
    detail: `Viewed patient record: ${patient.firstName} ${patient.lastName}`,
  })

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

export async function updatePatientInfo(
  patientId: string,
  data: {
    firstName: string
    middleName?: string
    lastName: string
    dateOfBirth: string
    phone: string
    email: string
    address: string
  }
) {
  const { clinicId, userEmail, db } = await getActorDb()
  const patient = await db((tx) => tx.patient.findUnique({
    where: { id: patientId },
    select: { clinicId: true, firstName: true, lastName: true },
  }))
  if (!patient || patient.clinicId !== clinicId) throw new Error('Patient not found')

  await db((tx) => tx.patient.update({
    where: { id: patientId },
    data: {
      firstName: data.firstName.trim(),
      middleName: data.middleName?.trim() || null,
      lastName: data.lastName.trim(),
      dateOfBirth: new Date(data.dateOfBirth),
      phone: data.phone.trim(),
      email: data.email.trim() || null,
      address: data.address.trim(),
    },
  }))

  await writeAudit({
    clinicId,
    userEmail,
    action: 'EDIT_PATIENT_MEDICAL',
    resourceType: 'PATIENT',
    resourceId: patientId,
    detail: `Updated profile info for: ${data.firstName} ${data.lastName}`,
  })

  revalidatePath(`/patients/${patientId}`)
}

export async function updatePatientMedical(
  patientId: string,
  data: { medicalHistory: string; medications: string; allergies: string }
) {
  const { clinicId, userEmail, db } = await getActorDb()
  const patient = await db((tx) => tx.patient.findUnique({
    where: { id: patientId },
    select: { clinicId: true, firstName: true, lastName: true },
  }))
  if (!patient || patient.clinicId !== clinicId) throw new Error('Patient not found')

  await db((tx) => tx.patient.update({
    where: { id: patientId },
    data: {
      medicalHistory: data.medicalHistory,
      medications: data.medications,
      allergies: data.allergies,
    },
  }))

  await writeAudit({
    clinicId,
    userEmail,
    action: 'EDIT_PATIENT_MEDICAL',
    resourceType: 'PATIENT',
    resourceId: patientId,
    detail: `Updated medical history for: ${patient.firstName} ${patient.lastName}`,
  })

  revalidatePath(`/patients/${patientId}`)
}

export async function updatePatientScPwd(
  patientId: string,
  data: {
    isSeniorCitizen: boolean
    scIdNumber: string
    isPwd: boolean
    pwdIdNumber: string
    pwdDisabilityType: string
  }
) {
  const { clinicId, userEmail, db } = await getActorDb()
  const patient = await db((tx) => tx.patient.findUnique({
    where: { id: patientId },
    select: { clinicId: true, firstName: true, lastName: true },
  }))
  if (!patient || patient.clinicId !== clinicId) throw new Error('Patient not found')

  await db((tx) => tx.patient.update({
    where: { id: patientId },
    data: {
      isSeniorCitizen: data.isSeniorCitizen,
      scIdNumber: data.isSeniorCitizen && data.scIdNumber.trim() ? data.scIdNumber.trim() : null,
      isPwd: data.isPwd,
      pwdIdNumber: data.isPwd && data.pwdIdNumber.trim() ? data.pwdIdNumber.trim() : null,
      pwdDisabilityType: data.isPwd && data.pwdDisabilityType ? data.pwdDisabilityType : null,
    },
  }))

  await writeAudit({
    clinicId,
    userEmail,
    action: 'EDIT_PATIENT_SCPWD',
    resourceType: 'PATIENT',
    resourceId: patientId,
    detail: `Updated SC/PWD status for: ${patient.firstName} ${patient.lastName}`,
  })

  revalidatePath(`/patients/${patientId}`)
}

export async function issueLoyaltyCard(patientId: string): Promise<string> {
  const { clinicId, db } = await getActorDb()
  const patient = await db((tx) => tx.patient.findUnique({
    where: { id: patientId },
    select: { clinicId: true, firstName: true, lastName: true },
  }))
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

  const loyaltyCardId = await db(async (tx) => {
    const loyaltyCard = await tx.loyaltyCard.create({
      data: {
        clinicId,
        patientId,
        cardNumber,
        expiryDate,
      },
    })

    await tx.invoice.create({
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

    return loyaltyCard.id
  })

  await prisma.clinic.update({
    where: { id: clinicId },
    data: { orSeriesCurrentNumber: { increment: 1 } },
  })

  revalidatePath(`/patients/${patientId}`)
  return loyaltyCardId
}

export async function markBracesComplete(patientId: string): Promise<void> {
  const { clinicId, db } = await getActorDb()
  const patient = await db((tx) => tx.patient.findFirst({ where: { id: patientId, clinicId }, select: { id: true } }))
  if (!patient) throw new Error('Patient not found')

  await db(async (tx) => {
    await tx.patient.update({ where: { id: patientId }, data: { bracesComplete: true } })

    // Cancel all pending BRACES_ALIGNMENT reminders for this patient
    await tx.scheduledReminder.updateMany({
      where: { patientId, clinicId, reminderType: 'BRACES_ALIGNMENT', status: 'PENDING' },
      data: { status: 'FAILED' },
    })
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
  const { clinicId, db } = await getActorDb()
  return db((tx) => tx.serviceCatalog.findMany({
    where: { clinicId, isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, category: true, sortOrder: true },
  }))
}

// NOTE: The legacy createVisit() action was removed — it had no callers and
// applied 12% VAT (net = gross/1.12), contradicting the supported saveVisit()
// path (app/(dashboard)/visits/actions.ts) which treats dental services as
// VAT-exempt. saveVisit is the single source of truth for visit creation.

// ---------------------------------------------------------------------------
// Delete patient — permanently removes all associated records
// ---------------------------------------------------------------------------

export async function deletePatient(patientId: string): Promise<void> {
  const { clinicId, userEmail, db } = await getActorDb()

  const patient = await db((tx) => tx.patient.findUnique({
    where: { id: patientId },
    select: { clinicId: true, firstName: true, middleName: true, lastName: true },
  }))
  if (!patient || patient.clinicId !== clinicId) throw new Error('Patient not found')

  const fullName = [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ')

  // BIR retention: a patient with issued official receipts must NOT be hard-deleted,
  // because that destroys mandated financial records and breaks the OR sequence.
  // The caller must anonymize instead (scrub PII, keep invoices).
  const issuedInvoices = await db((tx) => tx.invoice.count({
    where: { clinicId, status: 'ISSUED', visit: { patientId } },
  }))
  if (issuedInvoices > 0) {
    throw new Error('HAS_ISSUED_INVOICES: This patient has issued official receipts (BIR records). Anonymize the patient instead of deleting.')
  }

  await db(async (tx) => {
    // 1. Delete LoyaltyCardUsage (references LoyaltyCard + Invoice)
    const cards = await tx.loyaltyCard.findMany({
      where: { patientId },
      select: { id: true },
    })
    const cardIds = cards.map((c) => c.id)
    if (cardIds.length > 0) {
      await tx.loyaltyCardUsage.deleteMany({ where: { loyaltyCardId: { in: cardIds } } })
    }

    // 2. Delete ScPwdAuditLog (references Patient + Invoice)
    await tx.scPwdAuditLog.deleteMany({ where: { patientId } })

    // 3. Delete Invoices linked to this patient's visits
    const visits = await tx.visit.findMany({
      where: { patientId },
      select: { id: true },
    })
    const visitIds = visits.map((v) => v.id)
    if (visitIds.length > 0) {
      await tx.invoice.deleteMany({ where: { visitId: { in: visitIds } } })
    }

    // 4. Delete standalone invoices linked to loyalty cards (e.g. card purchase receipt)
    if (cardIds.length > 0) {
      await tx.invoice.deleteMany({ where: { loyaltyCardId: { in: cardIds } } })
    }

    // 5. Delete LoyaltyCards
    await tx.loyaltyCard.deleteMany({ where: { patientId } })

    // 6. Delete Visits
    await tx.visit.deleteMany({ where: { patientId } })

    // 7. Delete ConsentRecords
    await tx.consentRecord.deleteMany({ where: { patientId } })

    // 8. Delete Appointments
    await tx.appointment.deleteMany({ where: { patientId } })

    // 9. Delete ScheduledReminders
    await tx.scheduledReminder.deleteMany({ where: { patientId } })

    // 10. Delete the Patient
    await tx.patient.delete({ where: { id: patientId } })
  })

  await writeAudit({
    clinicId,
    userEmail,
    action: 'DELETE_PATIENT',
    resourceType: 'PATIENT',
    resourceId: patientId,
    detail: `Permanently deleted patient record: ${fullName}`,
  })

  revalidatePath('/patients')
}

// ---------------------------------------------------------------------------
// Anonymize patient — RA 10173 erasure while retaining BIR financial records.
// Scrubs personal data and stamps anonymizedAt; keeps invoices + visits so
// official receipts remain intact. Use this when deletePatient is blocked.
// ---------------------------------------------------------------------------

export async function anonymizePatient(patientId: string): Promise<void> {
  const { clinicId, userEmail, db } = await getActorDb()

  const patient = await db((tx) => tx.patient.findUnique({
    where: { id: patientId },
    select: { clinicId: true, firstName: true, middleName: true, lastName: true, anonymizedAt: true },
  }))
  if (!patient || patient.clinicId !== clinicId) throw new Error('Patient not found')
  if (patient.anonymizedAt) throw new Error('Patient is already anonymized')

  const fullName = [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ')

  await db(async (tx) => {
    // Scrub identifying personal data; keep clinical/financial records linked to
    // retained invoices. Future-only, non-financial items are removed.
    await tx.patient.update({
      where: { id: patientId },
      data: {
        firstName: '[Anonymized]',
        middleName: null,
        lastName: `#${patientId.slice(-6)}`,
        address: '[erased]',
        phone: '[erased]',
        email: null,
        philsysId: null,
        medicalHistory: null,
        medications: null,
        allergies: null,
        scIdNumber: null,
        pwdIdNumber: null,
        messengerPsid: null,
        reminderChannel: 'NONE',
        anonymizedAt: new Date(),
      },
    })

    // Remove future-facing, non-evidentiary data.
    await tx.scheduledReminder.deleteMany({ where: { patientId, status: 'PENDING' } })
    await tx.appointment.deleteMany({ where: { patientId, status: { in: ['SCHEDULED', 'CONFIRMED'] } } })
    await tx.loyaltyCard.updateMany({ where: { patientId }, data: { isActive: false } })

    // Clear any pending messenger-link slot pointing at this patient.
    await tx.pendingMessengerLink.deleteMany({ where: { clinicId, patientId } })
  })

  await writeAudit({
    clinicId,
    userEmail,
    action: 'ANONYMIZE_PATIENT',
    resourceType: 'PATIENT',
    resourceId: patientId,
    detail: `Anonymized patient PII (RA 10173 erasure); financial records retained: ${fullName}`,
  })

  revalidatePath('/patients')
  revalidatePath(`/patients/${patientId}`)
}

// ─── Messenger intake linking ─────────────────────────────────────────────────

// Opens a 10-minute pending slot for this clinic.
// Any first-time message received on the clinic Page auto-links to this patient.
// Only one slot per clinic — replaces any previous pending link.
export async function startMessengerLink(patientId: string): Promise<void> {
  const { clinicId, db } = await getActorDb()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
  await db((tx) => tx.pendingMessengerLink.upsert({
    where: { clinicId },
    create: { clinicId, patientId, expiresAt },
    update: { patientId, expiresAt },
  }))
}

// Cancels the pending slot (e.g. staff tapped Cancel).
export async function cancelMessengerLink(): Promise<void> {
  const { clinicId, db } = await getActorDb()
  await db((tx) => tx.pendingMessengerLink.deleteMany({ where: { clinicId } }))
}

// Polls whether a patient has been linked yet.
// Returns { linked: true } once the PSID is saved, { linked: false } while waiting,
// or { linked: false, expired: true } if the slot timed out.
export async function checkMessengerLink(
  patientId: string
): Promise<{ linked: boolean; expired?: boolean }> {
  const { clinicId, db } = await getActorDb()

  const patient = await db((tx) =>
    tx.patient.findFirst({
      where: { id: patientId, clinicId },
      select: { messengerPsid: true },
    })
  )
  if (patient?.messengerPsid) return { linked: true }

  // Check if the pending slot is still alive
  const pending = await db((tx) => tx.pendingMessengerLink.findUnique({
    where: { clinicId },
  }))
  if (!pending || pending.patientId !== patientId) return { linked: false, expired: true }
  if (pending.expiresAt < new Date()) return { linked: false, expired: true }

  return { linked: false }
}
