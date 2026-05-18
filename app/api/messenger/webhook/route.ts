import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ─── GET — Meta webhook verification ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  const mode      = req.nextUrl.searchParams.get('hub.mode')
  const token     = req.nextUrl.searchParams.get('hub.verify_token')
  const challenge = req.nextUrl.searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.FACEBOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

// ─── POST — incoming Messenger messages ──────────────────────────────────────
// Meta requires a 200 response within 20 seconds.
//
// Auto-linking strategy (MVP):
// When a PSID messages the page, we find the most recently registered patient
// who chose Messenger reminders but doesn't have a PSID linked yet, and link them.
//
// TODO: improve PSID matching — consider adding a one-time token to the m.me link
// (e.g. https://m.me/PAGE_ID?ref=PATIENT_TOKEN) so the webhook can match exactly.

type MessagingEntry = {
  sender: { id: string }
  recipient: { id: string }
  timestamp: number
  message?: { text?: string }
}

type WebhookEntry = {
  id: string // Page ID
  time: number
  messaging: MessagingEntry[]
}

type WebhookPayload = {
  object: string
  entry: WebhookEntry[]
}

export async function POST(req: NextRequest) {
  const body = await req.json() as WebhookPayload

  if (body.object !== 'page') {
    return NextResponse.json({ ok: true })
  }

  for (const entry of body.entry) {
    const pageId = entry.id

    // Resolve clinic by Facebook Page ID
    // TODO: when scaling to multi-clinic, each clinic stores their own messengerPageId
    let clinic = await prisma.clinic.findFirst({
      where: { messengerPageId: pageId },
      select: { id: true },
    })

    // MVP fallback: use the first clinic if no page ID match
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
        where: { clinicId, messengerUserId: psid },
        select: { id: true },
      })
      if (alreadyLinked) continue

      // Find the most recently registered patient who chose Messenger but has no PSID yet
      const unlinkedPatient = await prisma.patient.findFirst({
        where: {
          clinicId,
          reminderChannel: 'MESSENGER',
          messengerUserId: null,
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      })

      if (unlinkedPatient) {
        await prisma.patient.update({
          where: { id: unlinkedPatient.id },
          data: {
            messengerUserId: psid,
            messengerLinked: true,
          },
        })
      }
    }
  }

  return NextResponse.json({ ok: true })
}
