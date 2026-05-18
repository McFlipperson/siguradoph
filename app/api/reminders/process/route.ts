import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sigurado.xyz'

// ─── Build reminder message ───────────────────────────────────────────────────
function buildMessage(
  reminderType: string,
  patientFirstName: string,
  clinicName: string
): string {
  switch (reminderType) {
    case 'APPOINTMENT':
      return `Hi ${patientFirstName}! This is a reminder from ${clinicName} that you have an appointment tomorrow. See you then! Reply to this message if you need to reschedule.`
    case 'CLEANING_RECALL':
      return `Hi ${patientFirstName}! It's been 6 months since your last cleaning at ${clinicName}. Time for your next visit! Reply to book an appointment.`
    case 'BRACES_ALIGNMENT':
      return `Hi ${patientFirstName}! It's time for your next braces adjustment at ${clinicName}. Please book your next appointment at your earliest convenience.`
    default:
      return `Hi ${patientFirstName}! You have an upcoming reminder from ${clinicName}.`
  }
}

// ─── Send via Facebook Graph API ─────────────────────────────────────────────
async function sendMessengerMessage(psid: string, text: string): Promise<boolean> {
  if (!PAGE_ACCESS_TOKEN) return false
  try {
    const res = await fetch('https://graph.facebook.com/v19.0/me/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PAGE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        recipient: { id: psid },
        message: { text },
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ─── POST — process all due pending reminders ─────────────────────────────────
// Called manually from the reminders UI or by the cron route.
// When called manually, user must be authenticated.
// When called from cron, the cron route handles auth itself.
export async function POST(req: NextRequest) {
  // Allow direct call from cron route (internal) or authenticated user
  const internalSecret = req.headers.get('x-internal-secret')
  const isInternal = internalSecret === process.env.CRON_SECRET

  if (!isInternal) {
    const user = await getSessionUser()
    if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  // Fetch all due pending reminders with patient + clinic info
  const due = await prisma.scheduledReminder.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: { lte: now },
    },
    include: {
      patient: { select: { firstName: true, messengerUserId: true } },
      clinic:  { select: { name: true } },
    },
  })

  let sent = 0
  let failed = 0

  for (const reminder of due) {
    const psid = reminder.patient.messengerUserId

    if (!psid) {
      await prisma.scheduledReminder.update({
        where: { id: reminder.id },
        data: { status: 'FAILED' },
      })
      failed++
      continue
    }

    const message = buildMessage(
      reminder.reminderType,
      reminder.patient.firstName,
      reminder.clinic.name
    )

    const success = await sendMessengerMessage(psid, message)

    await prisma.scheduledReminder.update({
      where: { id: reminder.id },
      data: {
        status: success ? 'SENT' : 'FAILED',
        sentAt: success ? new Date() : null,
      },
    })

    if (success) sent++
    else failed++
  }

  return NextResponse.json({
    processed: due.length,
    sent,
    failed,
  })
}
