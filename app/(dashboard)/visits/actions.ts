'use server'

import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getActor } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import {
  type CardTemplateService,
  type LoyaltyBenefitApplication,
  SERVICE_LABELS,
  DEFAULT_TEMPLATE_ROWS,
  resolveServiceKey,
} from '@/lib/loyaltyConfig'

export type { LoyaltyBenefitApplication }

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

// ── Types ────────────────────────────────────────────────────────────────────

export type VisitLoyaltyCard = {
  id: string
  cardNumber: string
  expiryDate: Date
  cleaningUses50: number
  cleaningUses25: number
  fillingUses50: number
  fillingUses25: number
  rctUses: number
  dentureUses: number
  bracesUses: number
  wisdomToothUses: number
  extractionUses: number
}

export type VisitSetup = {
  patient: {
    id: string
    firstName: string
    lastName: string
    phone: string
    pendingLoyaltyCardPurchase: boolean
  }
  serviceCatalog: Array<{
    id: string
    name: string
    category: string
    sortOrder: number
  }>
  clinic: {
    enrollmentDate: Date
    loyaltyCardPrice: number
  }
  loyaltyCard: VisitLoyaltyCard | null
  cardTemplate: CardTemplateService[]
}

// ── getVisitSetup ─────────────────────────────────────────────────────────────

export async function getVisitSetup(patientId: string): Promise<VisitSetup> {
  const clinicId = await getClinicId()

  const [patient, clinic, services] = await Promise.all([
    prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true, firstName: true, lastName: true, phone: true,
        clinicId: true, pendingLoyaltyCardPurchase: true,
        loyaltyCards: {
          where: { isActive: true, expiryDate: { gte: new Date() } },
          orderBy: { purchaseDate: 'desc' },
          take: 1,
        },
      },
    }),
    prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { enrollmentDate: true, loyaltyCardPrice: true },
    }),
    prisma.serviceCatalog.findMany({
      where: { clinicId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, category: true, sortOrder: true },
    }),
  ])

  if (!patient || patient.clinicId !== clinicId) throw new Error('Patient not found')
  if (!clinic) throw new Error('Clinic not found')

  // Deactivate any expired cards for this patient
  await prisma.loyaltyCard.updateMany({
    where: { patientId, isActive: true, expiryDate: { lt: new Date() } },
    data: { isActive: false },
  })

  const rawCard = patient.loyaltyCards[0] ?? null
  const loyaltyCard: VisitLoyaltyCard | null = rawCard
    ? {
        id: rawCard.id,
        cardNumber: rawCard.cardNumber,
        expiryDate: rawCard.expiryDate,
        cleaningUses50: rawCard.cleaningUses50,
        cleaningUses25: rawCard.cleaningUses25,
        fillingUses50: rawCard.fillingUses50,
        fillingUses25: rawCard.fillingUses25,
        rctUses: rawCard.rctUses,
        dentureUses: rawCard.dentureUses,
        bracesUses: rawCard.bracesUses,
        wisdomToothUses: rawCard.wisdomToothUses,
        extractionUses: rawCard.extractionUses,
      }
    : null

  // Seed and load clinic's card template
  let templateRows = await prisma.loyaltyCardTemplate.findMany({
    where: { clinicId, isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
  if (templateRows.length === 0) {
    await prisma.loyaltyCardTemplate.createMany({
      data: DEFAULT_TEMPLATE_ROWS.map((r) => ({ ...r, clinicId })),
    })
    templateRows = await prisma.loyaltyCardTemplate.findMany({
      where: { clinicId, isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
  }
  const cardTemplate: CardTemplateService[] = templateRows.map((r) => {
    const serviceKey = resolveServiceKey(r.serviceName)
    return {
      id: r.id,
      serviceKey,
      label: SERVICE_LABELS[serviceKey] ?? r.serviceName,
      isFree: r.isFree,
      tier1Uses: r.tier1Uses,
      tier1Discount: Number(r.tier1Discount),
      hasTier2: r.tier2Uses !== null,
      tier2Uses: r.tier2Uses ?? 0,
      tier2Discount: Number(r.tier2Discount ?? 0),
    }
  })

  return {
    patient: {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      phone: patient.phone,
      pendingLoyaltyCardPurchase: patient.pendingLoyaltyCardPurchase,
    },
    serviceCatalog: services,
    clinic: { enrollmentDate: clinic.enrollmentDate, loyaltyCardPrice: Number(clinic.loyaltyCardPrice) },
    loyaltyCard,
    cardTemplate,
  }
}

// ── saveVisit ─────────────────────────────────────────────────────────────────

export type SaveVisitData = {
  patientId: string
  visitDate: string
  diagnosis: string
  toothNumber?: string
  treatment: string
  notes: string
  grossAmount: number
  procedureAmounts?: Array<{ name: string; amount: number }>
  isBracesReminder?: boolean
  reminderWeeks?: number
  isCleaningService?: boolean
  appointmentId?: string
  // Loyalty (decided at visit-recording time, applied at confirm-payment time)
  appliedLoyaltyCardId?: string
  purchaseNewLoyaltyCard?: boolean
  waiveCardFee?: boolean
  loyaltyBenefits?: LoyaltyBenefitApplication[]
}

export async function saveVisit(data: SaveVisitData): Promise<string> {
  const { clinicId, userEmail } = await getActor()

  const gross = data.grossAmount
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
      netAmount: gross, // dental VAT-exempt
      vatAmount: 0,
      procedureAmounts: data.procedureAmounts ?? undefined,
      appliedLoyaltyCardId: data.appliedLoyaltyCardId ?? null,
      purchaseNewLoyaltyCard: data.purchaseNewLoyaltyCard ?? false,
      waiveCardFee: data.waiveCardFee ?? false,
      loyaltyBenefits: data.loyaltyBenefits ?? undefined,
      intervalWeeks: data.reminderWeeks ?? null,
    },
  })

  if (data.isBracesReminder && data.reminderWeeks) {
    const scheduledFor = new Date(data.visitDate)
    scheduledFor.setDate(scheduledFor.getDate() + data.reminderWeeks * 7)
    await prisma.scheduledReminder.create({
      data: { clinicId, patientId: data.patientId, visitId: visit.id, reminderType: 'BRACES_ALIGNMENT', scheduledFor },
    })
  }

  if (data.isCleaningService) {
    const scheduledFor = new Date(data.visitDate)
    scheduledFor.setMonth(scheduledFor.getMonth() + 6)
    await prisma.scheduledReminder.create({
      data: { clinicId, patientId: data.patientId, visitId: visit.id, reminderType: 'CLEANING_RECALL', scheduledFor },
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

// ── updateVisit ───────────────────────────────────────────────────────────────

export type UpdateVisitData = {
  visitId: string
  treatment: string
  diagnosis: string
  toothNumber?: string
  notes: string
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {
    treatment: data.treatment.trim(),
    diagnosis: data.diagnosis.trim(),
    toothNumber: data.toothNumber?.trim() || null,
    notes: data.notes.trim(),
  }
  if (!hasInvoice) {
    if (data.grossAmount && data.grossAmount > 0) {
      updateData.grossAmount = data.grossAmount
      updateData.netAmount = data.grossAmount
      updateData.vatAmount = 0
    }
    if (data.visitDate) updateData.visitDate = new Date(data.visitDate + ':00+08:00')
  }

  await prisma.visit.update({ where: { id: data.visitId }, data: updateData })

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

// ── voidVisit ─────────────────────────────────────────────────────────────────

export async function voidVisit(visitId: string): Promise<void> {
  const { clinicId, userEmail } = await getActor()

  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: { invoice: { select: { id: true, orNumber: true, status: true } } },
  })
  if (!visit || visit.clinicId !== clinicId) throw new Error('Visit not found')
  if (visit.status === 'VOID') throw new Error('Already voided')

  // Field map for restoring loyalty card uses (benefit key → card field name)
  const benefitFieldMap: Record<string, string> = {
    CLEANING_50: 'cleaningUses50', CLEANING_25: 'cleaningUses25',
    FILLING_50:  'fillingUses50',  FILLING_25:  'fillingUses25',
    RCT:         'rctUses',        DENTURES:    'dentureUses',
    BRACES:      'bracesUses',     EXTRACTION:  'extractionUses',
    WISDOM_TOOTH:'wisdomToothUses',
  }

  const loyaltyBenefits = Array.isArray(visit.loyaltyBenefits)
    ? (visit.loyaltyBenefits as LoyaltyBenefitApplication[])
    : []

  await prisma.$transaction(async (tx) => {
    await tx.visit.update({ where: { id: visitId }, data: { status: 'VOID' } })
    if (visit.invoice && visit.invoice.status !== 'VOID') {
      await tx.invoice.update({ where: { id: visit.invoice.id }, data: { status: 'VOID' } })
    }

    // Reverse loyalty card changes only when payment was already confirmed (invoice exists)
    if (visit.invoice) {
      // Find usage records to get the card ID and clean them up
      const usageRecords = await tx.loyaltyCardUsage.findMany({
        where: { invoiceId: visit.invoice.id },
      })

      // Determine which card was affected
      const cardId = usageRecords[0]?.loyaltyCardId ?? visit.appliedLoyaltyCardId ?? null

      // Restore decremented use counts using the benefits stored on the visit
      if (cardId && loyaltyBenefits.length > 0) {
        for (const benefit of loyaltyBenefits) {
          const field = benefit.category !== 'CHECKUP' ? benefitFieldMap[benefit.benefitKey] : null
          if (field) {
            await tx.loyaltyCard.update({
              where: { id: cardId },
              data: { [field]: { increment: 1 } },
            })
          }
        }
      }

      // Delete usage history records for this invoice
      if (usageRecords.length > 0) {
        await tx.loyaltyCardUsage.deleteMany({ where: { invoiceId: visit.invoice.id } })
      }

      // If this visit included a new card purchase, deactivate that card
      if (visit.purchaseNewLoyaltyCard) {
        const targetCardId = cardId ?? (
          // No usage records (no discounts applied) — fall back to patient's most recent card
          (await tx.loyaltyCard.findFirst({
            where: { patientId: visit.patientId, clinicId, isActive: true },
            orderBy: { purchaseDate: 'desc' },
            select: { id: true },
          }))?.id ?? null
        )
        if (targetCardId) {
          await tx.loyaltyCard.update({
            where: { id: targetCardId },
            data: { isActive: false },
          })
        }
      }
    }
  })

  const cardNote = visit.purchaseNewLoyaltyCard && visit.invoice ? ' (loyalty card voided)' : ''
  const benefitNote = !visit.purchaseNewLoyaltyCard && loyaltyBenefits.length > 0 && visit.invoice
    ? ' (card uses restored)'
    : ''

  await writeAudit({
    clinicId,
    userEmail,
    action: 'VOID_INVOICE',
    resourceType: 'VISIT',
    resourceId: visitId,
    detail: `Voided visit${visit.invoice ? ` and OR #${visit.invoice.orNumber}` : ''}${cardNote}${benefitNote}: ${visit.treatment}`,
  })

  revalidatePath(`/patients/${visit.patientId}`)
  revalidatePath('/loyalty')
  revalidatePath('/invoices')
}
