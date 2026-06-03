export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import type { Plan } from '@/lib/entitlements'
import BillingClient from './BillingClient'

export default async function BillingPage() {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: authUser.email! },
    select: { clinicId: true },
  })
  if (!user?.clinicId) redirect('/onboarding')

  const clinic = await prisma.clinic.findUnique({
    where: { id: user.clinicId },
    select: { plan: true, name: true, email: true },
  })
  if (!clinic) redirect('/onboarding')

  // Most recent payment (SELF_REPORTED or CONFIRMED) — used to compute next due date
  const lastPayment = await prisma.pendingUpgrade.findFirst({
    where: {
      clinicId: user.clinicId,
      status: { in: ['SELF_REPORTED', 'CONFIRMED'] },
    },
    orderBy: { selfReportedAt: 'desc' },
  })

  // Next due = 30 days after last payment; null if never paid (grandfathered/free)
  const lastPaidAt = lastPayment?.selfReportedAt ?? lastPayment?.confirmedAt ?? null
  const nextDueDate = lastPaidAt
    ? new Date(lastPaidAt.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null

  // Banner for recently auto-verified payments
  const recentConfirmed = await prisma.pendingUpgrade.findFirst({
    where: {
      clinicId: user.clinicId,
      status: 'CONFIRMED',
      confirmedAt: { gt: new Date(Date.now() - 5 * 60 * 1000) },
    },
    orderBy: { confirmedAt: 'desc' },
  })

  return (
    <BillingClient
      currentPlan={clinic.plan as Plan}
      clinicName={clinic.name}
      gcashNumber={process.env.NEXT_PUBLIC_GCASH_NUMBER ?? ''}
      recentlyConfirmedPlan={recentConfirmed?.plan as Plan | null ?? null}
      nextDueDate={nextDueDate}
    />
  )
}
