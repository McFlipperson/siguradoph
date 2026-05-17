import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { setHours, setMinutes, setSeconds, setMilliseconds, subMinutes } from 'date-fns'

const TZ = 'Asia/Manila'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: session.user.email! }, select: { clinicId: true } })
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

  const late = await prisma.appointment.findMany({
    where: {
      clinicId,
      status: 'SCHEDULED',
      scheduledAt: { gte: startOfToday, lte: cutoff },
    },
    select: { id: true },
  })

  if (late.length > 0) {
    await prisma.appointment.updateMany({
      where: { id: { in: late.map((a) => a.id) } },
      data: { status: 'WALK_IN' },
    })
  }

  return NextResponse.json({ flipped: late.length })
}
