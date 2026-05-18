import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import RemindersClient from './RemindersClient'

export const dynamic = 'force-dynamic'

export default async function RemindersPage() {
  const user = await getSessionUser()
  if (!user?.clinicId) redirect('/login')

  const [clinic, unlinked, reminders] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: user.clinicId },
      select: { name: true, facebookPageUrl: true, messengerPageId: true },
    }),
    prisma.unlinkedMessenger.findMany({
      where: { clinicId: user.clinicId, isLinked: false },
      orderBy: { receivedAt: 'desc' },
    }),
    prisma.scheduledReminder.findMany({
      where: { clinicId: user.clinicId },
      include: { patient: { select: { firstName: true, lastName: true } } },
      orderBy: { scheduledFor: 'asc' },
    }),
  ])

  const patients = await prisma.patient.findMany({
    where: { clinicId: user.clinicId },
    select: { id: true, firstName: true, lastName: true },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  })

  const messengerConfigured = Boolean(process.env.FACEBOOK_PAGE_ACCESS_TOKEN)

  return (
    <RemindersClient
      clinic={{
        name: clinic?.name ?? '',
        facebookPageUrl: clinic?.facebookPageUrl ?? null,
        messengerConfigured,
      }}
      unlinked={unlinked.map((u) => ({
        id: u.id,
        psid: u.psid,
        receivedAt: u.receivedAt.toISOString(),
      }))}
      reminders={reminders.map((r) => ({
        id: r.id,
        patientName: `${r.patient.firstName} ${r.patient.lastName}`,
        reminderType: r.reminderType,
        scheduledFor: r.scheduledFor.toISOString(),
        status: r.status,
        sentAt: r.sentAt?.toISOString() ?? null,
      }))}
      patients={patients}
    />
  )
}
