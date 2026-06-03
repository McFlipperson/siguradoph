export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import type { Plan } from '@/lib/entitlements'
import BillingClient from './BillingClient'

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ upgrade?: string }> }) {
  const { upgrade } = await searchParams
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

  // First-ever payment — the day of month becomes their recurring due date forever
  const firstPayment = await prisma.pendingUpgrade.findFirst({
    where: {
      clinicId: user.clinicId,
      status: { in: ['SELF_REPORTED', 'CONFIRMED'] },
    },
    orderBy: { selfReportedAt: 'asc' },
  })

  // Compute next due date: same day of month as first payment, rolling monthly
  function nextDueDateFromFirstPayment(firstPaidAt: Date): Date {
    const dayOfMonth = firstPaidAt.getDate() // e.g. 13
    const now = new Date()
    // Try this month first
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), dayOfMonth)
    // Clamp to last day of that month (handles e.g. day 31 in a 30-day month)
    const lastDayThisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    thisMonth.setDate(Math.min(dayOfMonth, lastDayThisMonth))

    if (thisMonth > now) return thisMonth

    // Otherwise next month
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth)
    const lastDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0).getDate()
    nextMonth.setDate(Math.min(dayOfMonth, lastDayNextMonth))
    return nextMonth
  }

  const firstPaidAt = firstPayment?.selfReportedAt ?? firstPayment?.confirmedAt ?? null
  const nextDueDate = firstPaidAt
    ? nextDueDateFromFirstPayment(firstPaidAt).toISOString()
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

  const autoOpenPlan = upgrade === 'basic' || upgrade === 'pro' ? upgrade.toUpperCase() as 'BASIC' | 'PRO' : null

  return (
    <BillingClient
      currentPlan={clinic.plan as Plan}
      clinicName={clinic.name}
      gcashNumber={process.env.NEXT_PUBLIC_GCASH_NUMBER ?? ''}
      recentlyConfirmedPlan={recentConfirmed?.plan as Plan | null ?? null}
      nextDueDate={nextDueDate}
      autoOpenPlan={autoOpenPlan}
    />
  )
}
