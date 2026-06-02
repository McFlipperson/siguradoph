import { prisma } from '@/lib/prisma'
import { getSessionUser, getClinicPlan } from '@/lib/auth'
import { planAllows } from '@/lib/entitlements'
import { UpgradeRequired } from '@/components/UpgradeRequired'
import { withClinicDb } from '@/lib/clinic-db'
import { redirect } from 'next/navigation'
import RemindersClient from './RemindersClient'
import type { RecallRuleRow } from './actions'

export const dynamic = 'force-dynamic'

// Silently ensures the clinic's Page is subscribed to the webhook.
// Idempotent — safe to call on every page load.
async function ensureWebhookSubscription(pageId: string, token: string) {
  try {
    await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          subscribed_fields: 'messages,messaging_referrals',
          access_token: token,
        }),
        cache: 'no-store',
      }
    )
  } catch {
    // Non-fatal — don't block page load
  }
}

export default async function RemindersPage() {
  const user = await getSessionUser()
  if (!user?.clinicId) redirect('/login')

  const clinicId = user.clinicId

  const plan = await getClinicPlan(clinicId)
  if (!planAllows(plan, 'reminders')) {
    return <UpgradeRequired
      title="Automated Patient Reminders"
      description="Automatically remind patients about appointments and recalls via Messenger and email, so they never miss a visit."
      planNeeded="BASIC" />
  }

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
    withClinicDb(clinicId, (tx) => tx.scheduledReminder.findMany({
      where: { clinicId },
      include: { patient: { select: { firstName: true, lastName: true } } },
      orderBy: { scheduledFor: 'asc' },
    })),
    withClinicDb(clinicId, (tx) => tx.patient.groupBy({
      by: ['reminderChannel'],
      where: { clinicId },
      _count: true,
    })),
    withClinicDb(clinicId, (tx) => tx.unlinkedMessenger.findMany({
      where: { clinicId, isLinked: false },
      orderBy: { receivedAt: 'desc' },
    })),
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

  // Silently fix webhook subscription for already-connected clinics (e.g. Doc Omega)
  if (clinic?.messengerPageId && clinic?.messengerToken) {
    void ensureWebhookSubscription(clinic.messengerPageId, clinic.messengerToken)
  }

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
