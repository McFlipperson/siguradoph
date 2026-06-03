'use server'

import { prisma } from '@/lib/prisma'
import { getActor } from '@/lib/auth'
import { PLAN_PRICES } from '@/lib/billing-constants'

// Unambiguous alphanumeric chars (no 0/O, 1/I/L confusion)
const REF_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateRefCode(plan: 'BASIC' | 'PRO'): string {
  let suffix = ''
  for (let i = 0; i < 4; i++) {
    suffix += REF_CHARS[Math.floor(Math.random() * REF_CHARS.length)]
  }
  return `SIG-${plan === 'BASIC' ? 'BSC' : 'PRO'}-${suffix}`
}

/**
 * Returns an existing non-expired PENDING upgrade for this clinic+plan,
 * or creates a fresh one. Called when the clinic opens the payment panel.
 */
export async function getOrCreatePendingUpgrade(
  plan: 'BASIC' | 'PRO',
): Promise<{ referenceCode: string; amountCents: number; expiresAt: string }> {
  const { clinicId } = await getActor()

  // Reuse a still-valid pending upgrade
  const existing = await prisma.pendingUpgrade.findFirst({
    where: {
      clinicId,
      plan,
      status: 'PENDING',
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (existing) {
    return {
      referenceCode: existing.referenceCode,
      amountCents: existing.amountCents,
      expiresAt: existing.expiresAt.toISOString(),
    }
  }

  // Generate a unique reference code (retry on collision, extremely unlikely)
  let referenceCode = generateRefCode(plan)
  let attempts = 0
  while (attempts < 5) {
    const clash = await prisma.pendingUpgrade.findUnique({ where: { referenceCode } })
    if (!clash) break
    referenceCode = generateRefCode(plan)
    attempts++
  }

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const upgrade = await prisma.pendingUpgrade.create({
    data: {
      clinicId,
      plan,
      referenceCode,
      amountCents: PLAN_PRICES[plan],
      expiresAt,
    },
  })

  return {
    referenceCode: upgrade.referenceCode,
    amountCents: upgrade.amountCents,
    expiresAt: upgrade.expiresAt.toISOString(),
  }
}
