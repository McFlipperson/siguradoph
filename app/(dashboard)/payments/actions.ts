'use server'

import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

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

  // Look up service category
  const serviceEntry = await prisma.serviceCatalog.findFirst({
    where: { clinicId, name: visit.treatment },
    select: { category: true },
  })

  const category = serviceEntry?.category ?? 'OTHER'

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

  return {
    visitData: {
      id: visit.id,
      treatment: visit.treatment,
      diagnosis: visit.diagnosis,
      toothNumber: visit.toothNumber ?? undefined,
      visitDate: visit.visitDate,
      grossAmount: Number(visit.grossAmount),
      netAmount: Number(visit.netAmount),
      vatAmount: Number(visit.vatAmount),
      patientId: visit.patient.id,
      patientName,
      patientEmail: visit.patient.email ?? undefined,
      patientAddress: visit.patient.address,
      pendingLoyaltyCardPurchase: visit.patient.pendingLoyaltyCardPurchase,
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
    },
    loyaltyCard,
    serviceCategory: category,
  }
}

export type ConfirmPaymentData = {
  visitId: string
  paymentMethod: 'CASH' | 'GCASH'
  applyLoyaltyDiscount: boolean
  discountPct: number
  discountCategory?: string   // which card benefit to decrement (replaces server-side lookup)
  loyaltyCardId: string | null
  purchaseNewLoyaltyCard: boolean
  notes?: string
  emailRecipient?: string
}

export type ConfirmPaymentResult = {
  invoiceId: string
  orNumber: string
  totalAmount: number
  newLoyaltyCardId?: string
}

export async function confirmPayment(
  data: ConfirmPaymentData
): Promise<ConfirmPaymentResult> {
  const clinicId = await getClinicId()

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

  // Use the explicitly passed discount category (handles multi-procedure visits
  // where visit.treatment is a comma-joined list that won't match catalog lookup)
  const category = data.discountCategory ?? 'OTHER'

  let treatmentGross: number
  if (data.applyLoyaltyDiscount && category === 'CHECKUP') {
    treatmentGross = 0
  } else if (data.applyLoyaltyDiscount && data.discountPct > 0) {
    treatmentGross =
      Math.round(Number(visit.grossAmount) * (1 - data.discountPct / 100) * 100) / 100
  } else {
    treatmentGross = Number(visit.grossAmount)
  }

  const treatmentNet = Math.round((treatmentGross / 1.12) * 100) / 100
  const treatmentVat = Math.round((treatmentGross - treatmentNet) * 100) / 100

  const cardPrice = Number(clinic.loyaltyCardPrice)
  const cardNet = data.purchaseNewLoyaltyCard
    ? Math.round((cardPrice / 1.12) * 100) / 100
    : 0
  const cardVat = data.purchaseNewLoyaltyCard
    ? Math.round((cardPrice - cardNet) * 100) / 100
    : 0

  const totalNet = Math.round((treatmentNet + cardNet) * 100) / 100
  const totalVat = Math.round((treatmentVat + cardVat) * 100) / 100
  const totalGross = Math.round((treatmentGross + (data.purchaseNewLoyaltyCard ? cardPrice : 0)) * 100) / 100

  const discountAmount =
    data.applyLoyaltyDiscount && data.discountPct > 0
      ? Math.round((Number(visit.grossAmount) - treatmentGross) * 100) / 100
      : 0

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
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        status: 'ISSUED',
      },
    })

    // LoyaltyCardUsage + decrement if discount applied
    if (data.applyLoyaltyDiscount && data.loyaltyCardId && category !== 'CHECKUP') {
      const fieldMap: Record<string, string> = {
        CLEANING_50: 'cleaningUses50',
        CLEANING_25: 'cleaningUses25',
        FILLING_50: 'fillingUses50',
        FILLING_25: 'fillingUses25',
        RCT: 'rctUses',
        DENTURES: 'dentureUses',
        BRACES: 'bracesUses',
        EXTRACTION: 'extractionUses',
        WISDOM_TOOTH: 'wisdomToothUses',
      }

      let fieldKey: string | null = null
      if (category === 'CLEANING') {
        fieldKey = data.discountPct === 50 ? 'CLEANING_50' : 'CLEANING_25'
      } else if (category === 'FILLING') {
        fieldKey = data.discountPct === 50 ? 'FILLING_50' : 'FILLING_25'
      } else if (category === 'RCT') {
        fieldKey = 'RCT'
      } else if (category === 'DENTURES') {
        fieldKey = 'DENTURES'
      } else if (category === 'BRACES') {
        fieldKey = 'BRACES'
      } else if (category === 'EXTRACTION') {
        fieldKey = 'EXTRACTION'
      } else if (category === 'WISDOM_TOOTH') {
        fieldKey = 'WISDOM_TOOTH'
      }

      if (fieldKey && fieldMap[fieldKey]) {
        const dbField = fieldMap[fieldKey]
        await tx.loyaltyCard.update({
          where: { id: data.loyaltyCardId },
          data: { [dbField]: { decrement: 1 } },
        })
      }

      await tx.loyaltyCardUsage.create({
        data: {
          loyaltyCardId: data.loyaltyCardId,
          serviceType: category,
          discountPct: data.discountPct,
          discountAmount,
          invoiceId: invoice.id,
        },
      })
    }

    // Create new loyalty card if purchased
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

      const newCard = await tx.loyaltyCard.create({
        data: {
          clinicId,
          patientId: visit.patient.id,
          cardNumber,
          expiryDate,
        },
      })
      newLoyaltyCardId = newCard.id
    }
  })

  revalidatePath(`/patients/${visit.patient.id}`)
  revalidatePath('/invoices')

  return { invoiceId: (await prisma.invoice.findUnique({ where: { visitId: data.visitId } }))!.id, orNumber, totalAmount: totalGross, newLoyaltyCardId }
}
