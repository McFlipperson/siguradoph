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

  const [clinics, activity] = await Promise.all([
    prisma.clinic.findMany({
      select: {
        id: true,
        name: true,
        plan: true,
        email: true,
        createdAt: true,
        _count: { select: { patients: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

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
    />
  )
}
