import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

// DELETE — cancel (delete) a pending reminder
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reminder = await prisma.scheduledReminder.findFirst({
    where: { id: params.id, clinicId: user.clinicId },
    select: { id: true, status: true },
  })
  if (!reminder) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (reminder.status !== 'PENDING') {
    return NextResponse.json({ error: 'Only PENDING reminders can be cancelled' }, { status: 409 })
  }

  await prisma.scheduledReminder.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
