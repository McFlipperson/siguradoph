import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

// GET — fetch all reminders for the clinic (for client-side refresh)
export async function GET() {
  const user = await getSessionUser()
  if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const reminders = await prisma.scheduledReminder.findMany({
    where: { clinicId: user.clinicId },
    include: { patient: { select: { firstName: true, lastName: true } } },
    orderBy: { scheduledFor: 'asc' },
  })

  return NextResponse.json(
    reminders.map((r) => ({
      id: r.id,
      patientName: `${r.patient.firstName} ${r.patient.lastName}`,
      reminderType: r.reminderType,
      scheduledFor: r.scheduledFor.toISOString(),
      status: r.status,
      sentAt: r.sentAt?.toISOString() ?? null,
    }))
  )
}
