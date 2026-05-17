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
  const expense = await prisma.expense.findFirst({ where: { id: params.id, clinicId } })
  if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { category, description, grossAmount, inputVatAmount, supplierId, receiptNumber, date, paymentMethod, notes } = body

  const gross = grossAmount !== undefined ? Number(grossAmount) : Number(expense.grossAmount)
  const vatAmt = inputVatAmount !== undefined ? Number(inputVatAmount) : Number(expense.inputVatAmount)
  const net = vatAmt > 0 ? gross - vatAmt : gross

  const updated = await prisma.expense.update({
    where: { id: params.id },
    data: {
      ...(category !== undefined && { category }),
      ...(description !== undefined && { description }),
      ...(grossAmount !== undefined && { grossAmount: gross, netAmount: net }),
      ...(inputVatAmount !== undefined && { inputVatAmount: vatAmt, netAmount: net }),
      ...(supplierId !== undefined && { supplierId: supplierId || null }),
      ...(receiptNumber !== undefined && { receiptNumber: receiptNumber || null }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(paymentMethod !== undefined && { paymentMethod }),
      ...(notes !== undefined && { notes: notes || null }),
    },
  })

  return NextResponse.json({ id: updated.id })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const expense = await prisma.expense.findFirst({ where: { id: params.id, clinicId } })
  if (!expense) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.expense.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
