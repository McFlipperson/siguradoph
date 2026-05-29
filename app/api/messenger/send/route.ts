import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { patientId, message } = await req.json() as { patientId: string; message: string }

  if (!patientId || !message?.trim()) {
    return NextResponse.json({ error: 'patientId and message are required' }, { status: 400 })
  }

  const [patient, clinic] = await Promise.all([
    prisma.patient.findFirst({
      where: { id: patientId, clinicId: user.clinicId },
      select: { messengerPsid: true },
    }),
    prisma.clinic.findUnique({
      where: { id: user.clinicId },
      select: { messengerToken: true },
    }),
  ])

  const token = clinic?.messengerToken ?? process.env.FACEBOOK_PAGE_ACCESS_TOKEN ?? ''
  if (!token) return NextResponse.json({ error: 'Messenger not configured' }, { status: 503 })

  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
  if (!patient.messengerPsid) return NextResponse.json({ error: 'No Messenger linked' }, { status: 422 })

  const fbRes = await fetch('https://graph.facebook.com/v19.0/me/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ recipient: { id: patient.messengerPsid }, message: { text: message } }),
  })

  const fbData = await fbRes.json() as { message_id?: string; error?: { message: string } }
  if (!fbRes.ok || fbData.error) {
    return NextResponse.json({ error: fbData.error?.message ?? 'Failed to send' }, { status: 502 })
  }

  return NextResponse.json({ ok: true, messageId: fbData.message_id })
}
