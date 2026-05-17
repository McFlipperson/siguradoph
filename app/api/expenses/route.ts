import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'

async function getClinicId() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { clinicId: true },
  })
  return user?.clinicId ?? null
}

export async function GET(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = req.nextUrl
  const month = searchParams.get('month') // "YYYY-MM"
  const category = searchParams.get('category')
  const supplierId = searchParams.get('supplierId')

  const where: Record<string, unknown> = { clinicId }
  if (month) {
    const [y, m] = month.split('-').map(Number)
    const start = new Date(y, m - 1, 1)
    const end = new Date(y, m, 0, 23, 59, 59, 999)
    where.date = { gte: start, lte: end }
  }
  if (category) where.category = category
  if (supplierId) where.supplierId = supplierId

  const expenses = await prisma.expense.findMany({
    where,
    include: { supplier: { select: { id: true, name: true } } },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(
    expenses.map((e) => ({
      id: e.id,
      date: e.date.toISOString(),
      description: e.description,
      category: e.category,
      grossAmount: Number(e.grossAmount),
      inputVatAmount: Number(e.inputVatAmount),
      netAmount: Number(e.netAmount),
      receiptNumber: e.receiptNumber,
      paymentMethod: e.paymentMethod,
      notes: e.notes,
      supplierId: e.supplierId,
      supplierName: e.supplier?.name ?? null,
      isRecurring: e.isRecurring,
    }))
  )
}

export async function POST(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { category, description, grossAmount, inputVatAmount, supplierId, receiptNumber, date, paymentMethod, notes } = body

  if (!grossAmount || grossAmount <= 0) {
    return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 })
  }
  if (!category || !description || !date) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Validate supplier belongs to clinic if provided
  if (supplierId) {
    const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, clinicId } })
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
  }

  const gross = Number(grossAmount)
  const vatAmt = Number(inputVatAmount ?? 0)
  // netAmount: gross minus the input VAT (what the expense costs ex-VAT)
  const net = vatAmt > 0 ? gross - vatAmt : gross

  const expense = await prisma.expense.create({
    data: {
      clinicId,
      category,
      description,
      grossAmount: gross,
      inputVatAmount: vatAmt,
      netAmount: net,
      supplierId: supplierId || null,
      receiptNumber: receiptNumber || null,
      date: new Date(date),
      paymentMethod: paymentMethod ?? 'CASH',
      notes: notes || null,
    },
  })

  return NextResponse.json({ id: expense.id }, { status: 201 })
}
