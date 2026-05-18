import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { sendReminderEmail } from '@/lib/email'

const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN

// ─── Message builders ─────────────────────────────────────────────────────────

function buildMessageText(reminderType: string, firstName: string, clinicName: string): string {
  switch (reminderType) {
    case 'APPOINTMENT':
      return `Hi ${firstName}! This is a reminder from ${clinicName} that you have an appointment tomorrow. See you then! Reply to this message if you need to reschedule.`
    case 'CLEANING_RECALL':
      return `Hi ${firstName}! It's been 6 months since your last cleaning at ${clinicName}. Time for your next visit! Reply to book an appointment.`
    case 'BRACES_ALIGNMENT':
      return `Hi ${firstName}! It's time for your next braces adjustment at ${clinicName}. Please book your next appointment at your earliest convenience.`
    default:
      return `Hi ${firstName}! You have an upcoming reminder from ${clinicName}.`
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
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
        <tr><td>
          <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">${clinicName}</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">${text}</p>
          <p style="margin:0;font-size:12px;color:#9ca3af;">Powered by Sigurado</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Send via Facebook Messenger ──────────────────────────────────────────────
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

// ─── POST — process all due pending reminders ─────────────────────────────────
// Called manually from the reminders UI or internally by the cron route.
export async function POST(req: NextRequest) {
  // Allow internal call from cron with secret, or authenticated user
  const internalSecret = req.headers.get('x-internal-secret')
  const isInternal = !!internalSecret && internalSecret === process.env.CRON_SECRET

  if (!isInternal) {
    const user = await getSessionUser()
    if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  const due = await prisma.scheduledReminder.findMany({
    where: { status: 'PENDING', scheduledFor: { lte: now } },
    include: {
      patient: {
        select: {
          firstName: true,
          email: true,
          phone: true,
          messengerUserId: true,
          reminderChannel: true,
        },
      },
      clinic: { select: { name: true } },
    },
  })

  let sent = 0
  let failed = 0

  for (const reminder of due) {
    const { patient, clinic } = reminder
    const channel = patient.reminderChannel
    const firstName = patient.firstName
    const clinicName = clinic.name
    let success = false

    switch (channel) {
      case 'MESSENGER': {
        const psid = patient.messengerUserId
        if (!psid) {
          // No PSID yet — patient hasn't messaged the page
          await prisma.scheduledReminder.update({
            where: { id: reminder.id },
            data: { status: 'FAILED' },
          })
          failed++
          continue
        }
        const text = buildMessageText(reminder.reminderType, firstName, clinicName)
        success = await sendMessengerMessage(psid, text)
        break
      }

      case 'EMAIL': {
        const to = patient.email
        if (!to) {
          await prisma.scheduledReminder.update({
            where: { id: reminder.id },
            data: { status: 'FAILED' },
          })
          failed++
          continue
        }
        const subject = buildEmailSubject(reminder.reminderType, clinicName)
        const html = buildEmailHtml(reminder.reminderType, firstName, clinicName)
        const result = await sendReminderEmail(to, subject, html)
        success = result.ok
        break
      }

      case 'SMS': {
        // TODO Phase 2: integrate Semaphore SMS API
        console.log(`[reminders] SMS not yet implemented — skipping reminder ${reminder.id}`)
        await prisma.scheduledReminder.update({
          where: { id: reminder.id },
          data: { status: 'FAILED' },
        })
        failed++
        continue
      }

      case 'NONE':
      default: {
        // Patient opted out of reminders
        await prisma.scheduledReminder.update({
          where: { id: reminder.id },
          data: { status: 'FAILED' },
        })
        failed++
        continue
      }
    }

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

  return NextResponse.json({ processed: due.length, sent, failed })
}
