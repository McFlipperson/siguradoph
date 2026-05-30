import { NextRequest, NextResponse } from 'next/server'
import { withClinicDb } from '@/lib/clinic-db'
import { getSessionUser } from '@/lib/auth'

// DELETE — cancel (delete) a pending reminder
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clinicId = user.clinicId as string

  const result = await withClinicDb(clinicId, async (tx) => {
    const reminder = await tx.scheduledReminder.findFirst({
      where: { id: params.id, clinicId },
      select: { id: true, status: true },
    })
    if (!reminder) return { error: 'Not found', status: 404 }
    if (reminder.status !== 'PENDING') return { error: 'Only PENDING reminders can be cancelled', status: 409 }
    await tx.scheduledReminder.delete({ where: { id: params.id } })
    return { ok: true }
  })

  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json(result)
}
