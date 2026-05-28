'use server'

import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { type CardTemplateService, SERVICE_LABELS, DEFAULT_TEMPLATE_ROWS, resolveServiceKey } from '@/lib/loyaltyConfig'

export type { CardTemplateService }

async function getClinicId() {
  const supabase = createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')
  const user = await prisma.user.findUnique({ where: { email: authUser.email! } })
  if (!user?.clinicId) redirect('/onboarding')
  return user.clinicId
}

export async function getLoyaltyCards() {
  const clinicId = await getClinicId()
  const cards = await prisma.loyaltyCard.findMany({
    where: { clinicId },
    include: {
      patient: true,
      usageHistory: true,
    },
    orderBy: { purchaseDate: 'desc' },
  })

  const now = new Date()

  return cards.map((card) => {
    const isExpired = card.expiryDate <= now
    const allUsed =
      card.cleaningUses50 === 0 &&
      card.cleaningUses25 === 0 &&
      card.fillingUses50 === 0 &&
      card.fillingUses25 === 0 &&
      card.rctUses === 0 &&
      card.dentureUses === 0 &&
      card.bracesUses === 0 &&
      card.wisdomToothUses === 0 &&
      card.extractionUses === 0

    let status: 'ACTIVE' | 'EXPIRED' | 'EXHAUSTED'
    if (isExpired) status = 'EXPIRED'
    else if (allUsed) status = 'EXHAUSTED'
    else status = 'ACTIVE'

    const usageSummary: string[] = []
    if (card.cleaningUses50 > 0) usageSummary.push(`Cleaning 50%: ${card.cleaningUses50}`)
    if (card.cleaningUses25 > 0) usageSummary.push(`Cleaning 25%: ${card.cleaningUses25}`)
    if (card.fillingUses50 > 0) usageSummary.push(`Filling 50%: ${card.fillingUses50}`)
    if (card.fillingUses25 > 0) usageSummary.push(`Filling 25%: ${card.fillingUses25}`)
    if (card.rctUses > 0) usageSummary.push(`RCT: ${card.rctUses}`)
    if (card.dentureUses > 0) usageSummary.push(`Dentures: ${card.dentureUses}`)
    if (card.bracesUses > 0) usageSummary.push(`Braces: ${card.bracesUses}`)
    if (card.wisdomToothUses > 0) usageSummary.push(`Wisdom: ${card.wisdomToothUses}`)
    if (card.extractionUses > 0) usageSummary.push(`Extraction: ${card.extractionUses}`)

    return {
      id: card.id,
      patientId: card.patient.id,
      patientName: `${card.patient.firstName} ${card.patient.lastName}`,
      cardNumber: card.cardNumber,
      purchaseDate: card.purchaseDate.toISOString(),
      expiryDate: card.expiryDate.toISOString(),
      isActive: card.isActive,
      status,
      usageSummary,
      usageHistory: card.usageHistory.map((u) => ({
        id: u.id,
        serviceType: u.serviceType,
        discountPct: Number(u.discountPct),
        discountAmount: Number(u.discountAmount),
        invoiceId: u.invoiceId,
        usedAt: u.usedAt.toISOString(),
      })),
      uses: {
        cleaningUses50: card.cleaningUses50,
        cleaningUses25: card.cleaningUses25,
        fillingUses50: card.fillingUses50,
        fillingUses25: card.fillingUses25,
        rctUses: card.rctUses,
        dentureUses: card.dentureUses,
        bracesUses: card.bracesUses,
        wisdomToothUses: card.wisdomToothUses,
        extractionUses: card.extractionUses,
      },
    }
  })
}

export async function setPendingLoyaltyCard(patientId: string) {
  const clinicId = await getClinicId()
  const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId } })
  if (!patient) throw new Error('Patient not found')
  await prisma.patient.update({
    where: { id: patientId },
    data: { pendingLoyaltyCardPurchase: true },
  })
  revalidatePath('/loyalty')
}

// ---------------------------------------------------------------------------
// Clinic loyalty settings
// ---------------------------------------------------------------------------

export async function getClinicLoyaltySettings() {
  const clinicId = await getClinicId()
  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: {
      loyaltyCardEnabled: true,
      loyaltyCardPrice: true,
      loyaltyValidityMonths: true,
    },
  })
  if (!clinic) throw new Error('Clinic not found')
  return {
    loyaltyCardEnabled: clinic.loyaltyCardEnabled,
    loyaltyCardPrice: Number(clinic.loyaltyCardPrice),
    loyaltyValidityMonths: clinic.loyaltyValidityMonths,
  }
}

export async function updateClinicLoyaltySettings(data: {
  loyaltyCardPrice: number
  loyaltyValidityMonths: number
  loyaltyCardEnabled: boolean
}) {
  const clinicId = await getClinicId()
  await prisma.clinic.update({
    where: { id: clinicId },
    data: {
      loyaltyCardPrice: data.loyaltyCardPrice,
      loyaltyValidityMonths: data.loyaltyValidityMonths,
      loyaltyCardEnabled: data.loyaltyCardEnabled,
    },
  })
  revalidatePath('/loyalty')
}

// ---------------------------------------------------------------------------
// Edit a patient's loyalty card uses / expiry
// ---------------------------------------------------------------------------

export async function updateLoyaltyCard(
  cardId: string,
  data: {
    cleaningUses50: number
    cleaningUses25: number
    fillingUses50: number
    fillingUses25: number
    rctUses: number
    dentureUses: number
    bracesUses: number
    wisdomToothUses: number
    extractionUses: number
    expiryDate: string
  }
) {
  const clinicId = await getClinicId()
  const card = await prisma.loyaltyCard.findFirst({
    where: { id: cardId, clinicId },
  })
  if (!card) throw new Error('Card not found')

  await prisma.loyaltyCard.update({
    where: { id: cardId },
    data: {
      cleaningUses50: Math.max(0, data.cleaningUses50),
      cleaningUses25: Math.max(0, data.cleaningUses25),
      fillingUses50: Math.max(0, data.fillingUses50),
      fillingUses25: Math.max(0, data.fillingUses25),
      rctUses: Math.max(0, data.rctUses),
      dentureUses: Math.max(0, data.dentureUses),
      bracesUses: Math.max(0, data.bracesUses),
      wisdomToothUses: Math.max(0, data.wisdomToothUses),
      extractionUses: Math.max(0, data.extractionUses),
      expiryDate: new Date(data.expiryDate),
    },
  })
  revalidatePath('/loyalty')
}

// ---------------------------------------------------------------------------
// Loyalty card template (benefit configuration per clinic)
// ---------------------------------------------------------------------------

async function seedTemplateIfEmpty(clinicId: string) {
  const count = await prisma.loyaltyCardTemplate.count({ where: { clinicId } })
  if (count > 0) return
  await prisma.loyaltyCardTemplate.createMany({
    data: DEFAULT_TEMPLATE_ROWS.map((r) => ({ ...r, clinicId })),
  })
}

export async function getLoyaltyCardTemplate(): Promise<CardTemplateService[]> {
  const clinicId = await getClinicId()
  await seedTemplateIfEmpty(clinicId)

  const rows = await prisma.loyaltyCardTemplate.findMany({
    where: { clinicId, isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  return rows.map((r) => {
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
}

export async function updateLoyaltyCardTemplate(
  rows: Array<{
    id: string
    tier1Uses: number
    tier1Discount: number
    tier2Uses: number | null
    tier2Discount: number | null
  }>
): Promise<void> {
  const clinicId = await getClinicId()

  await Promise.all(
    rows.map((r) =>
      prisma.loyaltyCardTemplate.updateMany({
        where: { id: r.id, clinicId },
        data: {
          tier1Uses: Math.max(0, r.tier1Uses),
          tier1Discount: Math.min(100, Math.max(0, r.tier1Discount)),
          tier2Uses: r.tier2Uses !== null ? Math.max(0, r.tier2Uses) : null,
          tier2Discount: r.tier2Discount !== null ? Math.min(100, Math.max(0, r.tier2Discount)) : null,
        },
      })
    )
  )
  revalidatePath('/loyalty')
}
