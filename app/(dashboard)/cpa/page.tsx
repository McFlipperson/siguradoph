export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import CpaClient from './CpaClient'

function nextSendDate(): { date: string; quarter: number; year: number; label: string } {
  const now = new Date()
  const m = now.getMonth()
  const y = now.getFullYear()
  if (m < 3)  return { date: new Date(y, 3,  1).toISOString(), quarter: 1, year: y,     label: `Q1 ${y}` }
  if (m < 6)  return { date: new Date(y, 6,  1).toISOString(), quarter: 2, year: y,     label: `Q2 ${y}` }
  if (m < 9)  return { date: new Date(y, 9,  1).toISOString(), quarter: 3, year: y,     label: `Q3 ${y}` }
  return           { date: new Date(y + 1, 0, 1).toISOString(), quarter: 4, year: y,     label: `Q4 ${y}` }
}

export default async function CpaPage() {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: authUser.email! },
    select: { clinicId: true },
  })
  if (!user?.clinicId) redirect('/onboarding')

  const [clinic, assignment, logs] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: user.clinicId },
      select: { accountantEmail: true },
    }),
    prisma.cpaClinicAssignment.findFirst({
      where: { clinicId: user.clinicId },
      include: { cpa: { select: { email: true } } },
    }),
    prisma.quarterlyReportLog.findMany({
      where: { clinicId: user.clinicId },
      orderBy: { sentAt: 'desc' },
      take: 20,
    }),
  ])

  const next = nextSendDate()

  return (
    <CpaClient
      accountantEmail={clinic?.accountantEmail ?? null}
      assignedCpaEmail={assignment?.cpa.email ?? null}
      nextSend={next}
      logs={logs.map((l) => ({
        id: l.id,
        quarter: l.quarter,
        year: l.year,
        sentAt: l.sentAt.toISOString(),
        sentTo: l.sentTo,
        status: l.status,
        errorMessage: l.errorMessage ?? null,
      }))}
    />
  )
}
