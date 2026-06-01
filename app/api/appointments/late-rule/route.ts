import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withClinicDb } from '@/lib/clinic-db'
import { createServerClient } from '@/lib/supabase'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { setHours, setMinutes, setSeconds, setMilliseconds, subMinutes } from 'date-fns'

const TZ = 'Asia/Manila'

export async function POST() {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: authUser.email! }, select: { clinicId: true } })
  if (!user?.clinicId) return NextResponse.json({ error: 'No clinic' }, { status: 401 })

  const clinicId = user.clinicId
  const now = new Date()
  const manilaToday = toZonedTime(now, TZ)
  const startOfToday = fromZonedTime(
    setMilliseconds(setSeconds(setMinutes(setHours(manilaToday, 0), 0), 0), 0),
    TZ
  )

  // Find SCHEDULED appointments that are 30+ minutes overdue
  const cutoff = subMinutes(now, 30)

  const late = await withClinicDb(clinicId, async (tx) => {
    const overdue = await tx.appointment.findMany({
      where: {
        clinicId,
        status: 'SCHEDULED',
        scheduledAt: { gte: startOfToday, lte: cutoff },
      },
      select: { id: true },
    })
    if (overdue.length > 0) {
      await tx.appointment.updateMany({
        where: { id: { in: overdue.map((a) => a.id) }, clinicId },
        data: { status: 'WALK_IN' },
      })
    }
    return overdue
  })

  return NextResponse.json({ flipped: late.length })
}
