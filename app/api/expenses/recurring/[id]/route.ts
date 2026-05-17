import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'

async function getClinicId() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email! }, select: { clinicId: true } })
  return user?.clinicId ?? null
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const record = await prisma.recurringExpense.findFirst({ where: { id: params.id, clinicId } })
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { description, amount, category, frequency, nextDueDate, isActive } = body

  const updated = await prisma.recurringExpense.update({
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

  return NextResponse.json({ id: updated.id })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const record = await prisma.recurringExpense.findFirst({ where: { id: params.id, clinicId } })
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.recurringExpense.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
