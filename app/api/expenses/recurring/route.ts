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

export async function GET() {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const records = await withClinicDb(clinicId, (tx) =>
    tx.recurringExpense.findMany({
      where: { clinicId, isActive: true },
      orderBy: { createdAt: 'desc' },
    })
  )

  return NextResponse.json(
    records.map((r) => ({
      id: r.id,
      description: r.description,
      amount: Number(r.amount),
      category: r.category,
      frequency: r.frequency,
      nextDueDate: r.nextDueDate?.toISOString() ?? null,
      isActive: r.isActive,
    }))
  )
}

export async function POST(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { description, amount, category, frequency, nextDueDate } = await req.json()

  const record = await withClinicDb(clinicId, (tx) =>
    tx.recurringExpense.create({
      data: {
        clinicId,
        description,
        amount: Number(amount),
        category,
        frequency: frequency ?? 'MONTHLY',
        nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
      },
    })
  )

  return NextResponse.json({ id: record.id }, { status: 201 })
}
