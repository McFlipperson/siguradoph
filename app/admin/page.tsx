export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { isAdminEmail } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import AdminClient from './AdminClient'
import type { Plan } from '@/lib/entitlements'

export default async function AdminPage() {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!isAdminEmail(authUser?.email)) redirect('/')

  const now = new Date()
  const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const cutoff7d  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000)

  const [clinics, activity, selfReported, recentlyVerified] = await Promise.all([
    // All clinics for the plan management table
    prisma.clinic.findMany({
      select: {
        id: true, name: true, plan: true, email: true, createdAt: true,
        _count: { select: { patients: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),

    // Admin activity log
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),

    // SELF_REPORTED — needs attention (>24h) or pending verification (<24h)
    prisma.pendingUpgrade.findMany({
      where: { status: 'SELF_REPORTED' },
      include: { clinic: { select: { name: true, email: true, gcashNumber: true } } },
      orderBy: { selfReportedAt: 'desc' },
    }),

    // Recently CONFIRMED (last 7 days)
    prisma.pendingUpgrade.findMany({
      where: { status: 'CONFIRMED', confirmedAt: { gt: cutoff7d } },
      include: { clinic: { select: { name: true, email: true } } },
      orderBy: { confirmedAt: 'desc' },
      take: 20,
    }),

  ])

  // Split self-reported into needs-attention vs awaiting-verification
  const needsAttention = selfReported.filter(
    (u) => u.selfReportedAt && u.selfReportedAt < cutoff24h,
  )
  const awaitingVerification = selfReported.filter(
    (u) => !u.selfReportedAt || u.selfReportedAt >= cutoff24h,
  )

  function mapUpgrade(u: typeof selfReported[number]) {
    return {
      id: u.id,
      clinicId: u.clinicId,
      clinicName: u.clinic.name,
      clinicEmail: u.clinic.email,
      clinicGcashNumber: u.clinic.gcashNumber ?? null,
      plan: u.plan as Plan,
      referenceCode: u.referenceCode,
      amountCents: u.amountCents,
      status: u.status,
      selfReportedAt: u.selfReportedAt?.toISOString() ?? null,
      confirmedAt: u.confirmedAt?.toISOString() ?? null,
      confirmedBy: u.confirmedBy ?? null,
      createdAt: u.createdAt.toISOString(),
      expiresAt: u.expiresAt.toISOString(),
    }
  }

  return (
    <AdminClient
      clinics={clinics.map((c) => ({
        id: c.id,
        name: c.name,
        plan: c.plan as Plan,
        email: c.email,
        patientCount: c._count.patients,
        createdAt: c.createdAt.toISOString(),
      }))}
      activity={activity.map((a) => ({
        id: a.id,
        actorEmail: a.actorEmail,
        action: a.action,
        detail: a.detail,
        createdAt: a.createdAt.toISOString(),
      }))}
      needsAttention={needsAttention.map(mapUpgrade)}
      awaitingVerification={awaitingVerification.map(mapUpgrade)}
      recentlyVerified={recentlyVerified.map((u) => ({
        id: u.id,
        clinicName: u.clinic.name,
        clinicEmail: u.clinic.email,
        plan: u.plan as Plan,
        referenceCode: u.referenceCode,
        amountCents: u.amountCents,
        confirmedAt: u.confirmedAt?.toISOString() ?? null,
        confirmedBy: u.confirmedBy ?? null,
      }))}
    />
  )
}
