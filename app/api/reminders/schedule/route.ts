import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

// ─── POST — create a scheduled reminder ──────────────────────────────────────
// Called by: appointment creation (APPOINTMENT), visit save (CLEANING_RECALL, BRACES_ALIGNMENT)
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { patientId, reminderType, scheduledFor, visitId, appointmentId } = await req.json() as {
    patientId: string
    reminderType: 'APPOINTMENT' | 'CLEANING_RECALL' | 'BRACES_ALIGNMENT'
    scheduledFor: string
    visitId?: string
    appointmentId?: string
  }

  if (!patientId || !reminderType || !scheduledFor) {
    return NextResponse.json({ error: 'patientId, reminderType, and scheduledFor are required' }, { status: 400 })
  }

  const reminder = await prisma.scheduledReminder.create({
    data: {
      clinicId: user.clinicId,
      patientId,
      reminderType,
      scheduledFor: new Date(scheduledFor),
      visitId: visitId ?? null,
      appointmentId: appointmentId ?? null,
    },
  })

  return NextResponse.json(reminder, { status: 201 })
}
