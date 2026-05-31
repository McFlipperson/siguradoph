import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { sendReminderEmail } from '@/lib/email'

// ─── Message builders ─────────────────────────────────────────────────────────

function buildText(type: string, firstName: string, clinicName: string): string {
  switch (type) {
    case 'APPOINTMENT':
      return `Hi ${firstName}! This is a reminder from ${clinicName} that you have an appointment tomorrow. See you then! Reply if you need to reschedule.`
    case 'CLEANING_RECALL':
      return `Hi ${firstName}! It's been 6 months since your last cleaning at ${clinicName}. Time for your next visit! Reply to book an appointment.`
    case 'BRACES_ALIGNMENT':
      return `Hi ${firstName}! It's time for your next braces adjustment at ${clinicName}. Please book your appointment at your earliest convenience.`
    default:
      return `Hi ${firstName}! You have a reminder from ${clinicName}.`
  }
}

function buildEmailSubject(type: string, clinicName: string): string {
  switch (type) {
    case 'APPOINTMENT':    return `Reminder: Appointment tomorrow at ${clinicName}`
    case 'CLEANING_RECALL': return `Time for your 6-month cleaning — ${clinicName}`
    case 'BRACES_ALIGNMENT': return `Braces adjustment reminder — ${clinicName}`
    default: return `Reminder from ${clinicName}`
  }
}

// ─── Messenger send ───────────────────────────────────────────────────────────
async function sendViaMessenger(psid: string, text: string, token: string): Promise<boolean> {
  try {
    const res = await fetch('https://graph.facebook.com/v19.0/me/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ recipient: { id: psid }, message: { text } }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ─── Schedule the next braces reminder ───────────────────────────────────────
async function scheduleNextBracesReminder(
  clinicId: string,
  patientId: string,
  intervalWeeks: number
): Promise<void> {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId },
    select: { bracesComplete: true },
  })
  if (!patient || patient.bracesComplete) return // patient has finished braces

  const scheduledFor = new Date()
  scheduledFor.setDate(scheduledFor.getDate() + intervalWeeks * 7)
  scheduledFor.setHours(9, 0, 0, 0) // 9am

  await prisma.scheduledReminder.create({
    data: { clinicId, patientId, reminderType: 'BRACES_ALIGNMENT', scheduledFor },
  })
}

// ─── POST — process all due PENDING reminders ─────────────────────────────────
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
          messengerPsid: true,
          reminderChannel: true,
          bracesComplete: true,
        },
      },
      clinic: { select: { name: true, messengerToken: true } },
    },
  })

  let sent = 0
  let failed = 0

  for (const reminder of due) {
    const { patient, clinic } = reminder
    const channel    = patient.reminderChannel
    const firstName  = patient.firstName
    const clinicName = clinic.name
    // Use customMessage if set (e.g. SERVICE_RECALL), otherwise build from type
    const text = (reminder.customMessage)
      ? reminder.customMessage
      : buildText(reminder.reminderType, firstName, clinicName)
    let success = false

    // Resolve Messenger token: clinic DB value takes priority, env var as fallback
    const messengerToken = clinic.messengerToken ?? process.env.FACEBOOK_PAGE_ACCESS_TOKEN ?? ''

    switch (channel) {
      case 'MESSENGER': {
        const psid = patient.messengerPsid
        if (!psid || !messengerToken) {
          await prisma.scheduledReminder.update({
            where: { id: reminder.id },
            data: { status: 'FAILED' },
          })
          failed++
          continue
        }
        success = await sendViaMessenger(psid, text, messengerToken)
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
        const result = await sendReminderEmail(to, subject, firstName, text, clinicName)
        success = result.ok
        break
      }

      case 'SMS': {
        // TODO Phase 2: integrate Semaphore SMS API
        console.log(`SMS reminder skipped for patient ${reminder.patientId} — Phase 2`)
        await prisma.scheduledReminder.update({
          where: { id: reminder.id },
          data: { status: 'FAILED' },
        })
        failed++
        continue
      }

      case 'NONE':
      default: {
        await prisma.scheduledReminder.update({
          where: { id: reminder.id },
          data: { status: 'FAILED' },
        })
        failed++
        continue
      }
    }

    // Mark sent or failed
    await prisma.scheduledReminder.update({
      where: { id: reminder.id },
      data: { status: success ? 'SENT' : 'FAILED', sentAt: success ? new Date() : null },
    })

    if (success) {
      sent++

      // For BRACES_ALIGNMENT: schedule the next one if braces not yet complete
      if (reminder.reminderType === 'BRACES_ALIGNMENT') {
        let intervalWeeks = 5
        if (reminder.visitId) {
          const visit = await prisma.visit.findUnique({
            where: { id: reminder.visitId },
            select: { intervalWeeks: true },
          })
          intervalWeeks = visit?.intervalWeeks ?? 5
        }
        await scheduleNextBracesReminder(reminder.clinicId, reminder.patientId, intervalWeeks)
      }
    } else {
      failed++
    }
  }

  return NextResponse.json({ processed: due.length, sent, failed })
}
