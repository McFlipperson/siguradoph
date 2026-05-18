import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendReminderEmail } from '@/lib/email'

// Schedule: "0 0 * * *" UTC = 8:00 AM Manila time (UTC+8)
// Secured by CRON_SECRET header set automatically by Vercel.

const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN

function buildMessageText(reminderType: string, firstName: string, clinicName: string): string {
  switch (reminderType) {
    case 'APPOINTMENT':    return `Hi ${firstName}! This is a reminder from ${clinicName} that you have an appointment tomorrow. See you then! Reply to this message if you need to reschedule.`
    case 'CLEANING_RECALL': return `Hi ${firstName}! It's been 6 months since your last cleaning at ${clinicName}. Time for your next visit! Reply to book an appointment.`
    case 'BRACES_ALIGNMENT': return `Hi ${firstName}! It's time for your next braces adjustment at ${clinicName}. Please book your next appointment at your earliest convenience.`
    default: return `Hi ${firstName}! You have an upcoming reminder from ${clinicName}.`
  }
}

function buildEmailSubject(reminderType: string, clinicName: string): string {
  switch (reminderType) {
    case 'APPOINTMENT':    return `Reminder: Your appointment at ${clinicName} tomorrow`
    case 'CLEANING_RECALL': return `Time for your 6-month cleaning at ${clinicName}`
    case 'BRACES_ALIGNMENT': return `Time for your next braces adjustment at ${clinicName}`
    default: return `Reminder from ${clinicName}`
  }
}

function buildEmailHtml(reminderType: string, firstName: string, clinicName: string): string {
  const text = buildMessageText(reminderType, firstName, clinicName)
  return `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;padding:24px;background:#f3f4f6;">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;">
      <h2 style="margin:0 0 16px;color:#0f172a;">${clinicName}</h2>
      <p style="font-size:15px;color:#374151;line-height:1.6;">${text}</p>
      <p style="font-size:12px;color:#9ca3af;margin-top:24px;">Powered by Sigurado</p>
    </div>
  </body></html>`
}

async function sendMessengerMessage(psid: string, text: string): Promise<boolean> {
  if (!PAGE_ACCESS_TOKEN) return false
  try {
    const res = await fetch('https://graph.facebook.com/v19.0/me/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${PAGE_ACCESS_TOKEN}` },
      body: JSON.stringify({ recipient: { id: psid }, message: { text } }),
    })
    return res.ok
  } catch { return false }
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const due = await prisma.scheduledReminder.findMany({
    where: { status: 'PENDING', scheduledFor: { lte: now } },
    include: {
      patient: { select: { firstName: true, email: true, messengerUserId: true, reminderChannel: true } },
      clinic:  { select: { name: true } },
    },
  })

  let sent = 0
  let failed = 0

  for (const reminder of due) {
    const { patient, clinic } = reminder
    const channel = patient.reminderChannel
    let success = false

    if (channel === 'MESSENGER') {
      const psid = patient.messengerUserId
      if (!psid) { await prisma.scheduledReminder.update({ where: { id: reminder.id }, data: { status: 'FAILED' } }); failed++; continue }
      success = await sendMessengerMessage(psid, buildMessageText(reminder.reminderType, patient.firstName, clinic.name))
    } else if (channel === 'EMAIL') {
      const to = patient.email
      if (!to) { await prisma.scheduledReminder.update({ where: { id: reminder.id }, data: { status: 'FAILED' } }); failed++; continue }
      const result = await sendReminderEmail(to, buildEmailSubject(reminder.reminderType, clinic.name), buildEmailHtml(reminder.reminderType, patient.firstName, clinic.name))
      success = result.ok
    } else {
      // SMS (Phase 2) or NONE
      await prisma.scheduledReminder.update({ where: { id: reminder.id }, data: { status: 'FAILED' } })
      failed++
      continue
    }

    await prisma.scheduledReminder.update({
      where: { id: reminder.id },
      data: { status: success ? 'SENT' : 'FAILED', sentAt: success ? new Date() : null },
    })
    if (success) sent++; else failed++
  }

  return NextResponse.json({ ok: true, processed: due.length, sent, failed })
}
