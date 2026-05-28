'use server'

import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getActor } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import {
  type LoyaltyBenefitApplication,
  SERVICE_CARD_FIELDS,
  SERVICE_LABELS,
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CheckoutLoyaltyCard = {
  id: string
  cardNumber: string
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
}

export type FamilyCardResult = {
  patientId: string
  holderName: string
  card: CheckoutLoyaltyCard
}

export type CheckoutVisitData = {
  id: string
  treatment: string
  diagnosis: string
  toothNumber?: string
  visitDate: Date
  grossAmount: number
  patientId: string
  patientName: string
  patientAddress: string
  // SC/PWD
  isSeniorCitizen: boolean
  scIdNumber: string | null
  isPwd: boolean
  pwdIdNumber: string | null
  pwdDisabilityType: string | null
  clinic: {
    id: string
    name: string
    street: string
    city: string
    province: string
    zip: string
    tin: string
    orSeriesStart: string
    orSeriesCurrentNumber: number
    loyaltyCardPrice: number
  }
  // Per-procedure amounts for breakdown display
  procedures: Array<{ name: string; category: string; amount?: number }>
  // Pre-applied loyalty discounts (set at visit-recording time)
  loyaltyInfo: {
    discountLines: Array<{ label: string; discountAmount: number }>
    totalDiscount: number
    purchaseNewCard: boolean
    waiveCardFee: boolean
  } | null
}

export type CheckoutData = {
  visitData: CheckoutVisitData
}

// ---------------------------------------------------------------------------
// getCheckoutData
// ---------------------------------------------------------------------------

export async function getCheckoutData(visitId: string): Promise<CheckoutData> {
  const clinicId = await getClinicId()

  const visit = await prisma.visit.findUnique({
    where: { id: visitId },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          address: true,
          isSeniorCitizen: true,
          scIdNumber: true,
          isPwd: true,
          pwdIdNumber: true,
          pwdDisabilityType: true,
        },
      },
      clinic: {
        select: {
          id: true, name: true, street: true, city: true, province: true,
          zip: true, tin: true, orSeriesStart: true, orSeriesCurrentNumber: true,
          loyaltyCardPrice: true,
        },
      },
      invoice: true,
    },
  })

  if (!visit || visit.clinicId !== clinicId) throw new Error('Visit not found')

  // Parse procedures
  const procedureNames = visit.treatment.split(',').map((s) => s.trim()).filter(Boolean)
  const catalogEntries = await prisma.serviceCatalog.findMany({
    where: { clinicId, name: { in: procedureNames } },
    select: { name: true, category: true },
  })
  const categoryByName = Object.fromEntries(catalogEntries.map((e) => [e.name, e.category]))
  type StoredProcAmount = { name: string; amount: number }
  const storedAmounts = Array.isArray(visit.procedureAmounts)
    ? (visit.procedureAmounts as StoredProcAmount[])
    : []
  const amountByName = Object.fromEntries(storedAmounts.map((e) => [e.name, e.amount]))

  const procedures = procedureNames.map((name) => ({
    name,
    category: categoryByName[name] ?? 'OTHER',
    amount: amountByName[name] ?? undefined,
  }))

  // Build loyalty display lines from stored benefits
  const storedBenefits = Array.isArray(visit.loyaltyBenefits)
    ? (visit.loyaltyBenefits as LoyaltyBenefitApplication[])
    : []

  let loyaltyInfo: CheckoutVisitData['loyaltyInfo'] = null
  if (storedBenefits.length > 0 || visit.purchaseNewLoyaltyCard) {
    const discountLines = storedBenefits.map((b) => {
      const discountAmount = b.discountPct >= 100
        ? b.serviceAmount
        : Math.round(b.serviceAmount * (b.discountPct / 100) * 100) / 100
      const svcLabel = SERVICE_LABELS[b.category] ?? b.category
      const label = b.discountPct >= 100 ? `Free ${svcLabel}` : `${b.discountPct}% off ${svcLabel}`
      return { label, discountAmount }
    }).filter((l) => l.discountAmount > 0)

    const totalDiscount = discountLines.reduce((s, l) => s + l.discountAmount, 0)

    loyaltyInfo = {
      discountLines,
      totalDiscount,
      purchaseNewCard: visit.purchaseNewLoyaltyCard,
      waiveCardFee: visit.waiveCardFee,
    }
  }

  const patientName = `${visit.patient.firstName} ${visit.patient.lastName}`

  return {
    visitData: {
      id: visit.id,
      treatment: visit.treatment,
      diagnosis: visit.diagnosis,
      toothNumber: visit.toothNumber ?? undefined,
      visitDate: visit.visitDate,
      grossAmount: Number(visit.grossAmount),
      patientId: visit.patient.id,
      patientName,
      patientAddress: visit.patient.address,
      isSeniorCitizen: visit.patient.isSeniorCitizen,
      scIdNumber: visit.patient.scIdNumber,
      isPwd: visit.patient.isPwd,
      pwdIdNumber: visit.patient.pwdIdNumber,
      pwdDisabilityType: visit.patient.pwdDisabilityType,
      clinic: {
        id: visit.clinic.id,
        name: visit.clinic.name,
        street: visit.clinic.street,
        city: visit.clinic.city,
        province: visit.clinic.province,
        zip: visit.clinic.zip,
        tin: visit.clinic.tin,
        orSeriesStart: visit.clinic.orSeriesStart,
        orSeriesCurrentNumber: visit.clinic.orSeriesCurrentNumber,
        loyaltyCardPrice: Number(visit.clinic.loyaltyCardPrice),
      },
      procedures,
      loyaltyInfo,
    },
  }
}

// ---------------------------------------------------------------------------
// searchPatientLoyaltyCard  (used by NewVisitForm for family card search)
// ---------------------------------------------------------------------------

export async function searchPatientLoyaltyCard(
  query: string,
  excludePatientId: string
): Promise<FamilyCardResult[]> {
  if (!query || query.trim().length < 2) return []
  const clinicId = await getClinicId()

  const patients = await prisma.patient.findMany({
    where: {
      clinicId,
      id: { not: excludePatientId },
      OR: [
        { firstName: { contains: query.trim(), mode: 'insensitive' } },
        { lastName: { contains: query.trim(), mode: 'insensitive' } },
        { phone: { contains: query.trim() } },
      ],
      loyaltyCards: { some: { isActive: true, expiryDate: { gte: new Date() } } },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      loyaltyCards: {
        where: { isActive: true, expiryDate: { gte: new Date() } },
        orderBy: { purchaseDate: 'desc' },
        take: 1,
      },
    },
    take: 5,
  })

  return patients
    .filter((p) => p.loyaltyCards.length > 0)
    .map((p) => {
      const c = p.loyaltyCards[0]
      return {
        patientId: p.id,
        holderName: `${p.firstName} ${p.lastName}`,
        card: {
          id: c.id,
          cardNumber: c.cardNumber,
          expiryDate: c.expiryDate,
          isActive: c.isActive,
          cleaningUses50: c.cleaningUses50,
          cleaningUses25: c.cleaningUses25,
          fillingUses50: c.fillingUses50,
          fillingUses25: c.fillingUses25,
          rctUses: c.rctUses,
          dentureUses: c.dentureUses,
          bracesUses: c.bracesUses,
          wisdomToothUses: c.wisdomToothUses,
          extractionUses: c.extractionUses,
        },
      }
    })
}

// ---------------------------------------------------------------------------
// confirmPayment — loyalty data is now read from the Visit record
// ---------------------------------------------------------------------------

export type ConfirmPaymentData = {
  visitId: string
  paymentMethod: 'CASH' | 'GCASH'
  applyScPwdDiscount: boolean
  scPwdType: 'SC' | 'PWD' | null
  scPwdIdNumber: string | null
  notes?: string
}

export type ConfirmPaymentResult = {
  invoiceId: string
  orNumber: string
  totalAmount: number
  newLoyaltyCardId?: string
}

export async function confirmPayment(data: ConfirmPaymentData): Promise<ConfirmPaymentResult> {
  const { clinicId, userEmail } = await getActor()

  const visit = await prisma.visit.findUnique({
    where: { id: data.visitId },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          address: true,
        },
      },
      clinic: {
        select: {
          id: true, name: true, street: true, city: true, province: true, zip: true,
          tin: true, orSeriesStart: true, orSeriesCurrentNumber: true,
          loyaltyCardPrice: true, loyaltyValidityMonths: true,
        },
      },
    },
  })

  if (!visit || visit.clinicId !== clinicId) throw new Error('Visit not found')
  const existing = await prisma.invoice.findUnique({ where: { visitId: data.visitId } })
  if (existing) throw new Error('Invoice already exists for this visit')

  // Read loyalty data stored at visit-recording time
  const loyaltyBenefits = Array.isArray(visit.loyaltyBenefits)
    ? (visit.loyaltyBenefits as LoyaltyBenefitApplication[])
    : []
  const appliedLoyaltyCardId = visit.appliedLoyaltyCardId
  const purchaseNewLoyaltyCard = visit.purchaseNewLoyaltyCard
  const cardFeeWaived = visit.waiveCardFee

  const clinic = visit.clinic
  const orNumber = String(clinic.orSeriesCurrentNumber).padStart(clinic.orSeriesStart.length, '0')
  const originalGross = Number(visit.grossAmount)

  const scPwdDiscountAmount = data.applyScPwdDiscount
    ? Math.round(originalGross * 0.20 * 100) / 100
    : 0

  const loyaltyDiscountAmount = loyaltyBenefits.reduce((sum, b) => {
    const disc = b.discountPct >= 100
      ? b.serviceAmount
      : Math.round(b.serviceAmount * (b.discountPct / 100) * 100) / 100
    return sum + disc
  }, 0)

  const grossAfterLoyalty = Math.max(0, Math.round((originalGross - loyaltyDiscountAmount) * 100) / 100)
  const treatmentGross = Math.max(0, Math.round((grossAfterLoyalty - scPwdDiscountAmount) * 100) / 100)

  const cardPrice = Number(clinic.loyaltyCardPrice)
  const cardNet = purchaseNewLoyaltyCard && !cardFeeWaived ? cardPrice : 0

  const totalNet = Math.round((treatmentGross + cardNet) * 100) / 100
  const totalGross = Math.round((treatmentGross + cardNet) * 100) / 100

  const patientName = `${visit.patient.firstName} ${visit.patient.lastName}`
  const clinicAddress = `${clinic.street}, ${clinic.city}, ${clinic.province} ${clinic.zip}`

  let newLoyaltyCardId: string | undefined

  await prisma.$transaction(async (tx) => {
    await tx.clinic.update({
      where: { id: clinicId },
      data: { orSeriesCurrentNumber: { increment: 1 } },
    })

    const invoice = await tx.invoice.create({
      data: {
        clinicId,
        visitId: data.visitId,
        orNumber,
        sellerName: clinic.name,
        sellerTin: clinic.tin,
        sellerAddress: clinicAddress,
        buyerName: patientName,
        buyerAddress: visit.patient.address,
        serviceDescription: visit.treatment,
        grossAmount: totalGross,
        netAmount: totalNet,
        vatAmount: 0,
        discountAmount: loyaltyDiscountAmount,
        loyaltyCardId: appliedLoyaltyCardId,
        scPwdDiscountType: data.applyScPwdDiscount ? (data.scPwdType ?? null) : null,
        scPwdIdNumber: data.applyScPwdDiscount ? (data.scPwdIdNumber ?? null) : null,
        scPwdDiscountAmount: scPwdDiscountAmount,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        status: 'ISSUED',
      },
    })

    if (data.applyScPwdDiscount && data.scPwdType && data.scPwdIdNumber) {
      await tx.scPwdAuditLog.create({
        data: {
          clinicId,
          patientId: visit.patient.id,
          invoiceId: invoice.id,
          discountType: data.scPwdType,
          idNumber: data.scPwdIdNumber,
          discountPct: 20,
          discountAmount: scPwdDiscountAmount,
        },
      })
    }

    // Create new loyalty card if purchased
    if (purchaseNewLoyaltyCard) {
      const prefix = clinic.name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')
      const count = await tx.loyaltyCard.count({ where: { clinicId } })
      const cardNumber = `${prefix}-${String(count + 1).padStart(4, '0')}`
      const expiryDate = new Date()
      expiryDate.setMonth(expiryDate.getMonth() + clinic.loyaltyValidityMonths)

      const tplRows = await tx.loyaltyCardTemplate.findMany({
        where: { clinicId, isActive: true },
        orderBy: { sortOrder: 'asc' },
      })
      const cardUses: Record<string, number> = {}
      for (const tpl of tplRows) {
        if (tpl.isFree) continue
        const fields = SERVICE_CARD_FIELDS[resolveServiceKey(tpl.serviceName)]
        if (!fields) continue
        cardUses[fields.t1Field] = tpl.tier1Uses
        if (fields.t2Field && tpl.tier2Uses !== null) cardUses[fields.t2Field] = tpl.tier2Uses
      }

      const newCard = await tx.loyaltyCard.create({
        data: { clinicId, patientId: visit.patient.id, cardNumber, expiryDate, ...cardUses },
      })
      newLoyaltyCardId = newCard.id
    }

    // Decrement card uses + create usage records
    const effectiveLoyaltyCardId = appliedLoyaltyCardId ?? newLoyaltyCardId ?? null
    if (loyaltyBenefits.length > 0 && effectiveLoyaltyCardId) {
      const fieldMap: Record<string, string> = {
        CLEANING_50: 'cleaningUses50', CLEANING_25: 'cleaningUses25',
        FILLING_50: 'fillingUses50',   FILLING_25: 'fillingUses25',
        RCT: 'rctUses', DENTURES: 'dentureUses', BRACES: 'bracesUses',
        EXTRACTION: 'extractionUses', WISDOM_TOOTH: 'wisdomToothUses',
      }
      for (const benefit of loyaltyBenefits) {
        if (benefit.category !== 'CHECKUP' && fieldMap[benefit.benefitKey]) {
          await tx.loyaltyCard.update({
            where: { id: effectiveLoyaltyCardId },
            data: { [fieldMap[benefit.benefitKey]]: { decrement: 1 } },
          })
        }
        const discAmt = benefit.discountPct >= 100
          ? benefit.serviceAmount
          : Math.round(benefit.serviceAmount * (benefit.discountPct / 100) * 100) / 100
        await tx.loyaltyCardUsage.create({
          data: {
            loyaltyCardId: effectiveLoyaltyCardId,
            serviceType: benefit.category,
            discountPct: benefit.discountPct,
            discountAmount: discAmt,
            invoiceId: invoice.id,
          },
        })
      }
    }
  })

  const invoiceId = (await prisma.invoice.findUnique({ where: { visitId: data.visitId } }))!.id

  await writeAudit({
    clinicId,
    userEmail,
    action: 'CONFIRM_PAYMENT',
    resourceType: 'INVOICE',
    resourceId: invoiceId,
    detail: `Issued OR #${orNumber} — ₱${totalGross} via ${data.paymentMethod} for patient ${visit.patient.id}${cardFeeWaived ? ' (loyalty card fee waived)' : ''}`,
  })

  revalidatePath(`/patients/${visit.patient.id}`)
  revalidatePath('/invoices')

  return { invoiceId, orNumber, totalAmount: totalGross, newLoyaltyCardId }
}
