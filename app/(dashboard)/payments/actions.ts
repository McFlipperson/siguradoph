'use server'

import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getActor } from '@/lib/auth'
import { writeAudit } from '@/lib/audit'
import { type CardTemplateService, SERVICE_CARD_FIELDS, SERVICE_LABELS, DEFAULT_TEMPLATE_ROWS } from '@/lib/loyaltyConfig'

export type { CardTemplateService }

async function getClinicId(): Promise<string> {
  const supabase = createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser?.email) throw new Error('Not authenticated')
  const user = await prisma.user.findUnique({
    where: { email: authUser.email },
    select: { clinicId: true },
  })
  if (!user?.clinicId) throw new Error('No clinic')
  return user.clinicId
}

export type CheckoutVisitData = {
  id: string
  treatment: string
  diagnosis: string
  toothNumber?: string
  visitDate: Date
  grossAmount: number
  netAmount: number
  vatAmount: number
  patientId: string
  patientName: string
  patientEmail?: string
  patientAddress: string
  pendingLoyaltyCardPurchase: boolean
  // SC/PWD fields
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
  }
  serviceCategoryName: string
  // Individual procedures parsed from treatment string
  procedures: Array<{ name: string; category: string }>
}

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

export type CheckoutData = {
  visitData: CheckoutVisitData
  loyaltyCard: CheckoutLoyaltyCard | null
  serviceCategory: string
  cardTemplate: CardTemplateService[]
}

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
          email: true,
          address: true,
          pendingLoyaltyCardPurchase: true,
          isSeniorCitizen: true,
          scIdNumber: true,
          isPwd: true,
          pwdIdNumber: true,
          pwdDisabilityType: true,
          loyaltyCards: {
            where: { isActive: true, expiryDate: { gte: new Date() } },
            orderBy: { purchaseDate: 'desc' },
            take: 1,
          },
        },
      },
      clinic: {
        select: {
          id: true,
          name: true,
          street: true,
          city: true,
          province: true,
          zip: true,
          tin: true,
          orSeriesStart: true,
          orSeriesCurrentNumber: true,
        },
      },
      invoice: true,
    },
  })

  if (!visit || visit.clinicId !== clinicId) throw new Error('Visit not found')

  // Deactivate any expired loyalty cards for this patient (cleanup on checkout load)
  await prisma.loyaltyCard.updateMany({
    where: { patientId: visit.patient.id, isActive: true, expiryDate: { lt: new Date() } },
    data: { isActive: false },
  })

  // Parse individual procedures from comma-joined treatment string
  const procedureNames = visit.treatment.split(',').map((s) => s.trim()).filter(Boolean)
  const catalogEntries = await prisma.serviceCatalog.findMany({
    where: { clinicId, name: { in: procedureNames } },
    select: { name: true, category: true },
  })
  const categoryByName = Object.fromEntries(catalogEntries.map((e) => [e.name, e.category]))
  const procedures = procedureNames.map((name) => ({
    name,
    category: categoryByName[name] ?? 'OTHER',
  }))

  // Legacy single-category field (used by non-loyalty paths)
  const category = procedures[0]?.category ?? 'OTHER'

  const patientName = `${visit.patient.firstName} ${visit.patient.lastName}`
  const rawCard = visit.patient.loyaltyCards[0] ?? null

  const loyaltyCard: CheckoutLoyaltyCard | null = rawCard
    ? {
        id: rawCard.id,
        cardNumber: rawCard.cardNumber,
        expiryDate: rawCard.expiryDate,
        isActive: rawCard.isActive,
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

  // Load (or seed) the clinic's card template so checkout uses configured benefits
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
  const cardTemplate: CardTemplateService[] = templateRows.map((r) => ({
    id: r.id,
    serviceKey: r.serviceName,
    label: SERVICE_LABELS[r.serviceName] ?? r.serviceName,
    isFree: r.isFree,
    tier1Uses: r.tier1Uses,
    tier1Discount: Number(r.tier1Discount),
    hasTier2: r.tier2Uses !== null,
    tier2Uses: r.tier2Uses ?? 0,
    tier2Discount: Number(r.tier2Discount ?? 0),
  }))

  return {
    visitData: {
      id: visit.id,
      treatment: visit.treatment,
      diagnosis: visit.diagnosis,
      toothNumber: visit.toothNumber ?? undefined,
      visitDate: visit.visitDate,
      grossAmount: Number(visit.grossAmount),
      netAmount: Number(visit.grossAmount), // dental is VAT-exempt: net = gross
      vatAmount: 0,
      patientId: visit.patient.id,
      patientName,
      patientEmail: visit.patient.email ?? undefined,
      patientAddress: visit.patient.address,
      pendingLoyaltyCardPurchase: visit.patient.pendingLoyaltyCardPurchase,
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
      },
      serviceCategoryName: category,
      procedures,
    },
    loyaltyCard,
    serviceCategory: category,
    cardTemplate,
  }
}

// One entry per procedure that uses a loyalty benefit.
// serviceAmount is the portion of the visit total this procedure accounts for.
export type LoyaltyBenefitApplication = {
  benefitKey: string    // e.g. CLEANING_50, EXTRACTION
  category: string      // e.g. CLEANING, EXTRACTION
  discountPct: number   // 0–100; 100 = free (CHECKUP)
  serviceAmount: number // the price of this individual procedure
}

export type ConfirmPaymentData = {
  visitId: string
  paymentMethod: 'CASH' | 'GCASH'
  loyaltyCardId: string | null
  loyaltyBenefits: LoyaltyBenefitApplication[]  // empty = no loyalty discount
  purchaseNewLoyaltyCard: boolean
  // SC/PWD
  applyScPwdDiscount: boolean
  scPwdType: 'SC' | 'PWD' | null
  scPwdIdNumber: string | null
  notes?: string
  emailRecipient?: string
}

export type ConfirmPaymentResult = {
  invoiceId: string
  orNumber: string
  totalAmount: number
  newLoyaltyCardId?: string
}

// ---------------------------------------------------------------------------
// Family card search
// ---------------------------------------------------------------------------

export type FamilyCardResult = {
  patientId: string
  holderName: string
  card: CheckoutLoyaltyCard
}

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
      loyaltyCards: {
        some: { isActive: true, expiryDate: { gte: new Date() } },
      },
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

export async function confirmPayment(
  data: ConfirmPaymentData
): Promise<ConfirmPaymentResult> {
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
          loyaltyCards: {
            where: { isActive: true, expiryDate: { gte: new Date() } },
            orderBy: { purchaseDate: 'desc' },
            take: 1,
          },
        },
      },
      clinic: {
        select: {
          id: true,
          name: true,
          street: true,
          city: true,
          province: true,
          zip: true,
          tin: true,
          orSeriesStart: true,
          orSeriesCurrentNumber: true,
          loyaltyCardPrice: true,
          loyaltyValidityMonths: true,
        },
      },
    },
  })

  if (!visit || visit.clinicId !== clinicId) throw new Error('Visit not found')

  // Check no existing invoice
  const existing = await prisma.invoice.findUnique({ where: { visitId: data.visitId } })
  if (existing) throw new Error('Invoice already exists for this visit')

  const clinic = visit.clinic
  const pad = clinic.orSeriesStart.length
  const orNumber = String(clinic.orSeriesCurrentNumber).padStart(pad, '0')

  const originalGross = Number(visit.grossAmount)

  // SC/PWD discount: 20% off original gross (RA 9994 / RA 10754)
  const scPwdDiscountAmount = data.applyScPwdDiscount
    ? Math.round(originalGross * 0.20 * 100) / 100
    : 0

  // Loyalty discount = sum of per-procedure discounts
  const loyaltyDiscountAmount = data.loyaltyBenefits.reduce((sum, b) => {
    const disc = b.discountPct >= 100
      ? b.serviceAmount                                                      // free (CHECKUP)
      : Math.round(b.serviceAmount * (b.discountPct / 100) * 100) / 100
    return sum + disc
  }, 0)
  const grossAfterLoyalty = Math.max(0, Math.round((originalGross - loyaltyDiscountAmount) * 100) / 100)

  // Treatment gross after both discounts, floored at 0
  const treatmentGross = Math.max(0, Math.round((grossAfterLoyalty - scPwdDiscountAmount) * 100) / 100)

  // Dental is VAT-exempt: net = gross, VAT = 0
  const treatmentNet = treatmentGross

  const cardPrice = Number(clinic.loyaltyCardPrice)
  const cardNet = data.purchaseNewLoyaltyCard ? cardPrice : 0

  const totalNet = Math.round((treatmentNet + cardNet) * 100) / 100
  const totalVat = 0
  const totalGross = Math.round((treatmentGross + (data.purchaseNewLoyaltyCard ? cardPrice : 0)) * 100) / 100

  // Combined loyalty discount amount (stored on invoice.discountAmount)
  const discountAmount = loyaltyDiscountAmount

  const patientName = `${visit.patient.firstName} ${visit.patient.lastName}`
  const clinicAddress = `${clinic.street}, ${clinic.city}, ${clinic.province} ${clinic.zip}`

  let newLoyaltyCardId: string | undefined

  await prisma.$transaction(async (tx) => {
    // Increment OR series
    await tx.clinic.update({
      where: { id: clinicId },
      data: { orSeriesCurrentNumber: { increment: 1 } },
    })

    // Create invoice
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
        vatAmount: totalVat,
        discountAmount,
        loyaltyCardId: data.loyaltyCardId,
        scPwdDiscountType: data.applyScPwdDiscount ? (data.scPwdType ?? null) : null,
        scPwdIdNumber: data.applyScPwdDiscount ? (data.scPwdIdNumber ?? null) : null,
        scPwdDiscountAmount: scPwdDiscountAmount,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        status: 'ISSUED',
      },
    })

    // SC/PWD audit log (immutable compliance record)
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

    // Create new loyalty card first (if purchased) so its ID is available for same-transaction benefit use
    if (data.purchaseNewLoyaltyCard) {
      const prefix = clinic.name
        .slice(0, 3)
        .toUpperCase()
        .replace(/[^A-Z]/g, 'X')
      const count = await tx.loyaltyCard.count({ where: { clinicId } })
      const cardNumber = `${prefix}-${String(count + 1).padStart(4, '0')}`

      const expiryDate = new Date()
      expiryDate.setMonth(
        expiryDate.getMonth() + clinic.loyaltyValidityMonths
      )

      // Build initial uses from the clinic's card template (fall back to schema defaults)
      const tplRows = await tx.loyaltyCardTemplate.findMany({
        where: { clinicId, isActive: true },
        orderBy: { sortOrder: 'asc' },
      })
      const cardUses: Record<string, number> = {}
      for (const tpl of tplRows) {
        if (tpl.isFree) continue
        const fields = SERVICE_CARD_FIELDS[tpl.serviceName]
        if (!fields) continue
        cardUses[fields.t1Field] = tpl.tier1Uses
        if (fields.t2Field && tpl.tier2Uses !== null) {
          cardUses[fields.t2Field] = tpl.tier2Uses
        }
      }

      const newCard = await tx.loyaltyCard.create({
        data: {
          clinicId,
          patientId: visit.patient.id,
          cardNumber,
          expiryDate,
          ...cardUses,
        },
      })
      newLoyaltyCardId = newCard.id
    }

    // Resolve which card to record usage against:
    // existing card passed in, OR the card just purchased in this same transaction
    const effectiveLoyaltyCardId = data.loyaltyCardId ?? newLoyaltyCardId ?? null

    // LoyaltyCardUsage + decrement — one pass per benefit applied
    if (data.loyaltyBenefits.length > 0 && effectiveLoyaltyCardId) {
      const fieldMap: Record<string, string> = {
        CLEANING_50: 'cleaningUses50',
        CLEANING_25: 'cleaningUses25',
        FILLING_50:  'fillingUses50',
        FILLING_25:  'fillingUses25',
        RCT:         'rctUses',
        DENTURES:    'dentureUses',
        BRACES:      'bracesUses',
        EXTRACTION:  'extractionUses',
        WISDOM_TOOTH:'wisdomToothUses',
      }

      for (const benefit of data.loyaltyBenefits) {
        // CHECKUP is free — no field to decrement (unlimited)
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
    detail: `Issued OR #${orNumber} — ₱${totalGross} via ${data.paymentMethod} for patient ${visit.patient.id}`,
  })

  revalidatePath(`/patients/${visit.patient.id}`)
  revalidatePath('/invoices')

  return { invoiceId, orNumber, totalAmount: totalGross, newLoyaltyCardId }
}
