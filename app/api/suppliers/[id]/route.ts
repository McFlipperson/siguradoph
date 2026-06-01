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
  const { name, address, tin, vatRegistered, category } = await req.json()

  const updated = await withClinicDb(clinicId, async (tx) => {
    const supplier = await tx.supplier.findFirst({ where: { id: params.id, clinicId } })
    if (!supplier) return null
    return tx.supplier.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(address !== undefined && { address: address || null }),
        ...(tin !== undefined && { tin: tin || null }),
        ...(vatRegistered !== undefined && { vatRegistered }),
        ...(category !== undefined && { category }),
      },
    })
  })
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ id: updated.id })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const result = await withClinicDb(clinicId, async (tx) => {
    const supplier = await tx.supplier.findFirst({ where: { id: params.id, clinicId } })
    if (!supplier) return { status: 404 as const, error: 'Not found' }

    const expenseCount = await tx.expense.count({ where: { supplierId: params.id } })
    if (expenseCount > 0) {
      return { status: 409 as const, error: `Cannot delete — this supplier is referenced by ${expenseCount} expense(s).` }
    }

    await tx.supplier.delete({ where: { id: params.id } })
    return { status: 200 as const }
  })

  if (result.status !== 200) return NextResponse.json({ error: result.error }, { status: result.status })
  return NextResponse.json({ ok: true })
}
