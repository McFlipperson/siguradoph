import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'

// Verifies Meta's X-Hub-Signature-256 header against the raw request body.
// Meta signs every webhook payload with HMAC-SHA256 keyed by the app secret.
// Without this check the endpoint is an unauthenticated, cross-tenant write to
// patient SPI (anyone could forge link events). Reject anything that fails.
function verifyMetaSignature(rawBody: string, header: string | null): boolean {
  const appSecret = process.env.FACEBOOK_APP_SECRET
  if (!appSecret || !header) return false

  const expected = 'sha256=' + createHmac('sha256', appSecret).update(rawBody, 'utf-8').digest('hex')
  const a = Buffer.from(header)
  const b = Buffer.from(expected)
  // timingSafeEqual throws on length mismatch — guard first
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

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
// Three linking paths:
//
// PATH A — QR scan with ref parameter:
//   m.me/PAGE_ID?ref=patient_<patientId>
//   Meta passes this as messaging[].referral.ref on the first message event.
//   We extract the patientId and link directly — no staff action needed.
//
// PATH B — Tablet intake flow (staff tapped "Link Messenger" for a patient):
//   A PendingMessengerLink record exists for this clinic (expires in 10 min).
//   The first new PSID that messages in auto-links to that patient.
//   Pending record is deleted immediately — slot opens for the next patient.
//
// PATH C — Unrecognised message (patient found clinic on own, no pending link):
//   Create UnlinkedMessenger record for staff to link manually.
//
// Clinics are resolved strictly by entry.id (the Page ID) → Clinic.messengerPageId.
//   Events for an unrecognised Page ID are dropped (no cross-tenant fallback).

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
  // Read the raw body first — the signature is computed over the exact bytes.
  const rawBody = await req.text()

  if (!verifyMetaSignature(rawBody, req.headers.get('x-hub-signature-256'))) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  let body: WebhookPayload
  try {
    body = JSON.parse(rawBody) as WebhookPayload
  } catch {
    return new NextResponse('Bad Request', { status: 400 })
  }

  if (body.object !== 'page') {
    return NextResponse.json({ ok: true })
  }

  for (const entry of body.entry) {
    const pageId = entry.id

    // Resolve clinic strictly by the Page ID that received the message.
    // Never fall back to an arbitrary clinic — that would attribute one
    // tenant's inbound messages (and PSID links) to another tenant.
    const clinic = await prisma.clinic.findFirst({
      where: { messengerPageId: pageId },
      select: { id: true },
    })
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
        // ── PATH B: tablet intake — auto-link via pending slot ────────────────
        const pending = await prisma.pendingMessengerLink.findUnique({
          where: { clinicId },
        })

        if (pending && pending.expiresAt > new Date()) {
          // Link the patient and clear the slot atomically
          await prisma.$transaction([
            prisma.patient.update({
              where: { id: pending.patientId },
              data: { messengerPsid: psid, reminderChannel: 'MESSENGER' },
            }),
            prisma.pendingMessengerLink.delete({
              where: { clinicId },
            }),
          ])
          continue
        }

        // ── PATH C: unknown message — queue for manual linking ────────────────
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
