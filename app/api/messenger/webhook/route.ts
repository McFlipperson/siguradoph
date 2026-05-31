import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── GET — Meta webhook verification ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  const mode      = req.nextUrl.searchParams.get('hub.mode')
  const token     = req.nextUrl.searchParams.get('hub.verify_token')
  const challenge = req.nextUrl.searchParams.get('hub.challenge')

  const expected = process.env.FACEBOOK_VERIFY_TOKEN

  if (mode === 'subscribe' && token === expected) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

// ─── POST — incoming messages ─────────────────────────────────────────────────
// Two linking paths:
//
// PATH A — QR scan with ref parameter:
//   m.me/PAGE_ID?ref=patient_<patientId>
//   Meta passes this as messaging[].referral.ref on the first message event.
//   We extract the patientId and link directly — no staff action needed.
//
// PATH B — Manual message (patient found clinic on Messenger without scanning QR):
//   No ref param → create UnlinkedMessenger record for staff to link manually.
//
// TODO: When scaling to multi-clinic, look up clinic by entry.id (the Page ID).
//   For MVP we fall back to the first clinic if messengerPageId doesn't match.

type MessagingEvent = {
  sender:    { id: string }
  recipient: { id: string }
  timestamp: number
  message?:  { text?: string }
  referral?: { ref?: string; source?: string; type?: string }
}

type WebhookEntry = {
  id: string // Page ID
  messaging: MessagingEvent[]
}

type WebhookPayload = {
  object: string
  entry:  WebhookEntry[]
}

export async function POST(req: NextRequest) {
  const body = await req.json() as WebhookPayload

  if (body.object !== 'page') {
    return NextResponse.json({ ok: true })
  }

  for (const entry of body.entry) {
    const pageId = entry.id

    // Resolve clinic
    let clinic = await prisma.clinic.findFirst({
      where: { messengerPageId: pageId },
      select: { id: true },
    })
    if (!clinic) {
      clinic = await prisma.clinic.findFirst({ select: { id: true } })
    }
    if (!clinic) continue

    const clinicId = clinic.id

    for (const event of entry.messaging) {
      const psid = event.sender.id
      if (!psid) continue

      // Skip if this PSID is already linked to a patient
      const alreadyLinked = await prisma.patient.findFirst({
        where: { clinicId, messengerPsid: psid },
        select: { id: true },
      })
      if (alreadyLinked) continue

      const ref = event.referral?.ref ?? ''

      if (ref.startsWith('patient_')) {
        // ── PATH A: auto-link via QR ref ──────────────────────────────────────
        const patientId = ref.replace('patient_', '')

        const patient = await prisma.patient.findFirst({
          where: { id: patientId, clinicId, messengerPsid: null },
          select: { id: true },
        })

        if (patient) {
          await prisma.patient.update({
            where: { id: patient.id },
            data: { messengerPsid: psid },
          })
        }
      } else {
        // ── PATH B: manual link — create UnlinkedMessenger for staff ──────────
        const existingUnlinked = await prisma.unlinkedMessenger.findFirst({
          where: { clinicId, psid },
          select: { id: true },
        })
        if (existingUnlinked) continue // already recorded, skip duplicate

        await prisma.unlinkedMessenger.create({
          data: { clinicId, psid },
        })
      }
    }
  }

  // Meta requires 200 fast
  return NextResponse.json({ ok: true })
}
