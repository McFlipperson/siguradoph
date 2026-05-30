import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withClinicDb } from '@/lib/clinic-db'
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
  const record = await withClinicDb(clinicId, (tx) =>
    tx.recurringExpense.findFirst({ where: { id: params.id, clinicId } })
  )
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { description, amount, category, frequency, nextDueDate, isActive } = body

  const updated = await withClinicDb(clinicId, (tx) =>
    tx.recurringExpense.update({
      where: { id: params.id },
      data: {
        ...(description !== undefined && { description }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(category !== undefined && { category }),
        ...(frequency !== undefined && { frequency }),
        ...(nextDueDate !== undefined && { nextDueDate: nextDueDate ? new Date(nextDueDate) : null }),
        ...(isActive !== undefined && { isActive }),
      },
    })
  )

  return NextResponse.json({ id: updated.id })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const record = await withClinicDb(clinicId, (tx) =>
    tx.recurringExpense.findFirst({ where: { id: params.id, clinicId } })
  )
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await withClinicDb(clinicId, (tx) => tx.recurringExpense.delete({ where: { id: params.id } }))
  return NextResponse.json({ ok: true })
}
