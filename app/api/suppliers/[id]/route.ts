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
  const supplier = await prisma.supplier.findFirst({ where: { id: params.id, clinicId } })
  if (!supplier) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { name, address, tin, vatRegistered, category } = await req.json()

  const updated = await prisma.supplier.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(address !== undefined && { address: address || null }),
      ...(tin !== undefined && { tin: tin || null }),
      ...(vatRegistered !== undefined && { vatRegistered }),
      ...(category !== undefined && { category }),
    },
  })

  return NextResponse.json({ id: updated.id })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supplier = await prisma.supplier.findFirst({ where: { id: params.id, clinicId } })
  if (!supplier) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const expenseCount = await prisma.expense.count({ where: { supplierId: params.id } })
  if (expenseCount > 0) {
    return NextResponse.json(
      { error: `Cannot delete — this supplier is referenced by ${expenseCount} expense(s).` },
      { status: 409 }
    )
  }

  await prisma.supplier.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
