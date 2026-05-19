import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

// POST — link an UnlinkedMessenger PSID to a patient (manual path B)
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { unlinkedId, patientId } = await req.json() as { unlinkedId: string; patientId: string }

  const unlinked = await prisma.unlinkedMessenger.findFirst({
    where: { id: unlinkedId, clinicId: user.clinicId, isLinked: false },
    select: { id: true, psid: true },
  })
  if (!unlinked) return NextResponse.json({ error: 'Unlinked record not found' }, { status: 404 })

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, clinicId: user.clinicId },
    select: { id: true, firstName: true, lastName: true },
  })
  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

  const [updatedPatient] = await prisma.$transaction([
    prisma.patient.update({
      where: { id: patientId },
      data: { messengerPsid: unlinked.psid, reminderChannel: 'MESSENGER' },
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.unlinkedMessenger.update({
      where: { id: unlinkedId },
      data: { isLinked: true },
    }),
  ])

  return NextResponse.json({ ok: true, patient: updatedPatient })
}
