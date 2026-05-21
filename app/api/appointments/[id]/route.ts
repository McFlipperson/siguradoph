import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'

async function getClinicId() {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return null
  const user = await prisma.user.findUnique({ where: { email: authUser.email! }, select: { clinicId: true } })
  return user?.clinicId ?? null
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appointment = await prisma.appointment.findFirst({ where: { id: params.id, clinicId } })
  if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { status, notes } = body

  const validStatuses = ['SCHEDULED', 'CONFIRMED', 'WALK_IN', 'CANCELLED', 'COMPLETED']
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updated = await prisma.appointment.update({
    where: { id: params.id },
    data: {
      ...(status ? { status } : {}),
      ...(notes !== undefined ? { notes } : {}),
    },
  })

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    notes: updated.notes,
  })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const appointment = await prisma.appointment.findFirst({ where: { id: params.id, clinicId } })
  if (!appointment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.appointment.update({ where: { id: params.id }, data: { status: 'CANCELLED' } })

  return NextResponse.json({ ok: true })
}
