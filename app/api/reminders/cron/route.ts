import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN

function buildMessage(reminderType: string, patientFirstName: string, clinicName: string): string {
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

async function sendMessengerMessage(psid: string, text: string): Promise<boolean> {
  if (!PAGE_ACCESS_TOKEN) return false
  try {
    const res = await fetch('https://graph.facebook.com/v19.0/me/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PAGE_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ recipient: { id: psid }, message: { text } }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ─── GET — Vercel Cron endpoint ───────────────────────────────────────────────
// Schedule: "0 0 * * *" (UTC midnight = 8am Manila time, UTC+8)
// Secured by CRON_SECRET header set by Vercel.
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const due = await prisma.scheduledReminder.findMany({
    where: { status: 'PENDING', scheduledFor: { lte: now } },
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
      await prisma.scheduledReminder.update({ where: { id: reminder.id }, data: { status: 'FAILED' } })
      failed++
      continue
    }

    const message = buildMessage(reminder.reminderType, reminder.patient.firstName, reminder.clinic.name)
    const success = await sendMessengerMessage(psid, message)

    await prisma.scheduledReminder.update({
      where: { id: reminder.id },
      data: { status: success ? 'SENT' : 'FAILED', sentAt: success ? new Date() : null },
    })

    if (success) sent++
    else failed++
  }

  return NextResponse.json({ ok: true, processed: due.length, sent, failed })
}
