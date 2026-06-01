import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withClinicDb } from '@/lib/clinic-db'
import { createServerClient } from '@/lib/supabase'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { addDays, setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns'

const TZ = 'Asia/Manila'

async function getClinicId() {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return null
  const user = await prisma.user.findUnique({ where: { email: authUser.email! }, select: { clinicId: true } })
  return user?.clinicId ?? null
}

// GET: today's appointments for the clinic
export async function GET() {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const manilaToday = toZonedTime(now, TZ)
  // Start/end of today in Manila time, converted to UTC
  const startOfToday = fromZonedTime(
    setMilliseconds(setSeconds(setMinutes(setHours(manilaToday, 0), 0), 0), 0),
    TZ
  )
  const endOfToday = fromZonedTime(
    setMilliseconds(setSeconds(setMinutes(setHours(manilaToday, 23), 59), 59), 999),
    TZ
  )

  const appointments = await withClinicDb(clinicId, (tx) =>
    tx.appointment.findMany({
      where: {
        clinicId,
        scheduledAt: { gte: startOfToday, lte: endOfToday },
        status: { not: 'CANCELLED' },
      },
      include: { patient: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { scheduledAt: 'asc' },
    })
  )

  return NextResponse.json(
    appointments.map((a) => ({
      id: a.id,
      patientId: a.patientId,
      patientName: `${a.patient.firstName} ${a.patient.lastName}`,
      scheduledAt: a.scheduledAt.toISOString(),
      type: a.type,
      status: a.status,
      notes: a.notes,
    }))
  )
}

// POST: create appointment + reminder
export async function POST(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { patientId, scheduledAt, type, notes } = body

  if (!patientId || typeof patientId !== 'string') {
    return NextResponse.json({ error: 'patientId is required' }, { status: 400 })
  }
  if (!type || typeof type !== 'string') {
    return NextResponse.json({ error: 'type is required' }, { status: 400 })
  }
  if (!scheduledAt || isNaN(new Date(scheduledAt).getTime())) {
    return NextResponse.json({ error: 'scheduledAt is not a valid date' }, { status: 400 })
  }

  // Validate patient belongs to clinic
  const patient = await withClinicDb(clinicId, (tx) =>
    tx.patient.findFirst({ where: { id: patientId, clinicId } })
  )
  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

  const apptDate = new Date(scheduledAt)

  // Reminder: day before at 09:00 Manila time
  const apptManila = toZonedTime(apptDate, TZ)
  const dayBefore = addDays(apptManila, -1)
  const reminderManila = setMilliseconds(setSeconds(setMinutes(setHours(dayBefore, 9), 0), 0), 0)
  const reminderUtc = fromZonedTime(reminderManila, TZ)

  const appointment = await withClinicDb(clinicId, async (tx) => {
    const appt = await tx.appointment.create({
      data: { clinicId, patientId, scheduledAt: apptDate, type, notes, status: 'SCHEDULED' },
    })
    await tx.scheduledReminder.create({
      data: {
        clinicId,
        patientId,
        reminderType: 'APPOINTMENT',
        scheduledFor: reminderUtc,
      },
    })
    return appt
  })

  return NextResponse.json({
    id: appointment.id,
    patientId: appointment.patientId,
    scheduledAt: appointment.scheduledAt.toISOString(),
    type: appointment.type,
    status: appointment.status,
  }, { status: 201 })
}
