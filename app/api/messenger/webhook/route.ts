import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nanoid } from 'nanoid'

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
// We store the PSID for staff to link to a patient later.

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
    return NextResponse.json({ ok: true }) // not a page event, ignore
  }

  for (const entry of body.entry) {
    const pageId = entry.id

    // Resolve clinic by Facebook Page ID (MVP: single clinic via env var)
    // TODO: when scaling, look up clinic by messengerPageId = pageId
    const clinic = await prisma.clinic.findFirst({
      where: { messengerPageId: pageId },
      select: { id: true },
    })

    if (!clinic) {
      // Fallback: find the first clinic (MVP single-clinic mode)
      const fallback = await prisma.clinic.findFirst({ select: { id: true } })
      if (!fallback) continue
    }

    const clinicId = clinic?.id ?? (
      await prisma.clinic.findFirst({ select: { id: true } })
    )?.id

    if (!clinicId) continue

    for (const event of entry.messaging) {
      const psid = event.sender.id
      if (!psid) continue

      // Skip if this PSID already belongs to a linked patient
      const alreadyLinked = await prisma.patient.findFirst({
        where: { clinicId, messengerUserId: psid },
        select: { id: true },
      })
      if (alreadyLinked) continue

      // Skip if we already have an unlinked record for this PSID
      const existingUnlinked = await prisma.unlinkedMessenger.findFirst({
        where: { clinicId, psid },
        select: { id: true },
      })
      if (existingUnlinked) continue

      // Create unlinked record for staff to link
      await prisma.unlinkedMessenger.create({
        data: { id: nanoid(), clinicId, psid },
      })
    }
  }

  return NextResponse.json({ ok: true })
}
