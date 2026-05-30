import { NextRequest, NextResponse } from 'next/server'
import { withClinicDb } from '@/lib/clinic-db'
import { getSessionUser } from '@/lib/auth'

// POST — link an UnlinkedMessenger PSID to a patient (manual path B)
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clinicId = user.clinicId as string

  const { unlinkedId, patientId } = await req.json() as { unlinkedId: string; patientId: string }

  const result = await withClinicDb(clinicId, async (tx) => {
    const unlinked = await tx.unlinkedMessenger.findFirst({
      where: { id: unlinkedId, clinicId, isLinked: false },
      select: { id: true, psid: true },
    })
    if (!unlinked) return { error: 'Unlinked record not found' }

    const patient = await tx.patient.findFirst({
      where: { id: patientId, clinicId },
      select: { id: true, firstName: true, lastName: true },
    })
    if (!patient) return { error: 'Patient not found' }

    const updatedPatient = await tx.patient.update({
      where: { id: patientId },
      data: { messengerPsid: unlinked.psid, reminderChannel: 'MESSENGER' },
      select: { id: true, firstName: true, lastName: true },
    })
    await tx.unlinkedMessenger.update({
      where: { id: unlinkedId },
      data: { isLinked: true },
    })

    return { ok: true, patient: updatedPatient }
  })

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 404 })
  }
  return NextResponse.json(result)
}
