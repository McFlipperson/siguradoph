'use server'

import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function getClinicId() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const user = await prisma.user.findUnique({ where: { email: session.user.email! } })
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
