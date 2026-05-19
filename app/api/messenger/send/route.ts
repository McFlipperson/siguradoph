import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

// TODO: when scaling to multi-clinic, move PAGE_ACCESS_TOKEN into the Clinic model
const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { patientId, message } = await req.json() as { patientId: string; message: string }

  if (!patientId || !message?.trim()) {
    return NextResponse.json({ error: 'patientId and message are required' }, { status: 400 })
  }

  if (!PAGE_ACCESS_TOKEN) {
    return NextResponse.json({ error: 'Messenger not configured' }, { status: 503 })
  }

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId: user.clinicId },
    select: { messengerPsid: true },
  })

  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
  if (!patient.messengerPsid) {
    return NextResponse.json({ error: 'No Messenger linked' }, { status: 422 })
  }

  const fbRes = await fetch('https://graph.facebook.com/v19.0/me/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PAGE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      recipient: { id: patient.messengerPsid },
      message:   { text: message },
    }),
  })

  const fbData = await fbRes.json() as { message_id?: string; error?: { message: string } }

  if (!fbRes.ok || fbData.error) {
    return NextResponse.json(
      { error: fbData.error?.message ?? 'Failed to send message' },
      { status: 502 }
    )
  }

  return NextResponse.json({ ok: true, messageId: fbData.message_id })
}
