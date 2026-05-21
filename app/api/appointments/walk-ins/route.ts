import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { setHours, setMinutes, setSeconds, setMilliseconds } from 'date-fns'

const TZ = 'Asia/Manila'

async function getClinicId() {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return null
  const user = await prisma.user.findUnique({ where: { email: authUser.email! }, select: { clinicId: true } })
  return user?.clinicId ?? null
}

export async function GET() {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const now = new Date()
  const manilaToday = toZonedTime(now, TZ)
  const startOfToday = fromZonedTime(
    setMilliseconds(setSeconds(setMinutes(setHours(manilaToday, 0), 0), 0), 0),
    TZ
  )
  const endOfToday = fromZonedTime(
    setMilliseconds(setSeconds(setMinutes(setHours(manilaToday, 23), 59), 59), 999),
    TZ
  )

  const walkIns = await prisma.appointment.findMany({
    where: {
      clinicId,
      status: 'WALK_IN',
      scheduledAt: { gte: startOfToday, lte: endOfToday },
    },
    include: { patient: { select: { id: true, firstName: true, lastName: true } } },
    orderBy: { scheduledAt: 'asc' },
  })

  return NextResponse.json(
    walkIns.map((a) => ({
      id: a.id,
      patientId: a.patientId,
      patientName: `${a.patient.firstName} ${a.patient.lastName}`,
      scheduledAt: a.scheduledAt.toISOString(),
      type: a.type,
      status: a.status,
    }))
  )
}

export async function POST(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { patientId } = await req.json()
  const patient = await prisma.patient.findFirst({ where: { id: patientId, clinicId } })
  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 })

  const appt = await prisma.appointment.create({
    data: { clinicId, patientId, scheduledAt: new Date(), type: 'CHECK_UP', status: 'WALK_IN' },
  })

  return NextResponse.json({
    id: appt.id,
    patientId: appt.patientId,
    scheduledAt: appt.scheduledAt.toISOString(),
    type: appt.type,
    status: appt.status,
  }, { status: 201 })
}
