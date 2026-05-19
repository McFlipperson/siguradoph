import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import RemindersClient from './RemindersClient'

export const dynamic = 'force-dynamic'

export default async function RemindersPage() {
  const user = await getSessionUser()
  if (!user?.clinicId) redirect('/login')

  const [clinic, reminders, channelCounts, unlinkedMessages] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: user.clinicId },
      select: { name: true, facebookPageUrl: true, messengerPageId: true },
    }),
    prisma.scheduledReminder.findMany({
      where: { clinicId: user.clinicId },
      include: { patient: { select: { firstName: true, lastName: true } } },
      orderBy: { scheduledFor: 'asc' },
    }),
    prisma.patient.groupBy({
      by: ['reminderChannel'],
      where: { clinicId: user.clinicId },
      _count: true,
    }),
    prisma.unlinkedMessenger.findMany({
      where: { clinicId: user.clinicId, isLinked: false },
      orderBy: { receivedAt: 'desc' },
    }),
  ])

  const messengerConfigured = Boolean(process.env.FACEBOOK_PAGE_ACCESS_TOKEN)

  const channelStats = {
    MESSENGER: 0,
    EMAIL: 0,
    SMS: 0,
    NONE: 0,
  }
  for (const row of channelCounts) {
    const ch = row.reminderChannel as keyof typeof channelStats
    if (ch in channelStats) channelStats[ch] = row._count
  }

  return (
    <RemindersClient
      clinic={{
        name: clinic?.name ?? '',
        facebookPageUrl: clinic?.facebookPageUrl ?? null,
        messengerPageId: clinic?.messengerPageId ?? null,
        messengerConfigured,
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
    />
  )
}
