import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { withClinicDb } from '@/lib/clinic-db'
import { redirect } from 'next/navigation'
import RemindersClient from './RemindersClient'
import type { RecallRuleRow } from './actions'

export const dynamic = 'force-dynamic'

export default async function RemindersPage() {
  const user = await getSessionUser()
  if (!user?.clinicId) redirect('/login')

  const clinicId = user.clinicId

  const [clinic, reminders, channelCounts, unlinkedMessages, recallRules, catalogServices] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId },
      select: {
        name: true,
        facebookPageUrl: true,
        messengerPageId: true,
        messengerToken: true,   // presence only — value never sent to client
      },
    }),
    prisma.scheduledReminder.findMany({
      where: { clinicId },
      include: { patient: { select: { firstName: true, lastName: true } } },
      orderBy: { scheduledFor: 'asc' },
    }),
    prisma.patient.groupBy({
      by: ['reminderChannel'],
      where: { clinicId },
      _count: true,
    }),
    prisma.unlinkedMessenger.findMany({
      where: { clinicId, isLinked: false },
      orderBy: { receivedAt: 'desc' },
    }),
    withClinicDb(clinicId, (tx) =>
      tx.recallRule.findMany({ orderBy: { serviceCategory: 'asc' } })
    ),
    withClinicDb(clinicId, (tx) =>
      tx.serviceCatalog.findMany({
        where: { isActive: true },
        select: { name: true, category: true },
        orderBy: { sortOrder: 'asc' },
      })
    ),
  ])

  const channelStats = { MESSENGER: 0, EMAIL: 0, SMS: 0, NONE: 0 }
  for (const row of channelCounts) {
    const ch = row.reminderChannel as keyof typeof channelStats
    if (ch in channelStats) channelStats[ch] = row._count
  }

  const recallRuleRows: RecallRuleRow[] = recallRules.map((r) => ({
    id: r.id,
    serviceName: r.serviceName,
    serviceCategory: r.serviceCategory,
    daysAfter: r.daysAfter,
    messageTemplate: r.messageTemplate,
    isActive: r.isActive,
  }))

  return (
    <RemindersClient
      clinic={{
        name: clinic?.name ?? '',
        facebookPageUrl: clinic?.facebookPageUrl ?? '',
        messengerPageId: clinic?.messengerPageId ?? '',
        hasMessengerToken: Boolean(clinic?.messengerToken),
        // env-var fallback still counts as configured
        messengerConfigured: Boolean(clinic?.messengerToken ?? process.env.FACEBOOK_PAGE_ACCESS_TOKEN),
      }}
      reminders={reminders.map((r) => ({
        id: r.id,
        patientName: `${r.patient.firstName} ${r.patient.lastName}`,
        reminderType: r.reminderType,
        scheduledFor: r.scheduledFor.toISOString(),
        status: r.status,
        sentAt: r.sentAt?.toISOString() ?? null,
      }))}
      channelStats={channelStats}
      unlinkedMessages={unlinkedMessages.map((u) => ({
        id: u.id,
        psid: u.psid,
        createdAt: u.receivedAt.toISOString(),
      }))}
      recallRules={recallRuleRows}
      catalogServices={catalogServices.map((s) => ({ name: s.name, category: s.category }))}
    />
  )
}
