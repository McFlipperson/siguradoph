import { NextResponse } from 'next/server'
import { withClinicDb } from '@/lib/clinic-db'
import { getSessionUser } from '@/lib/auth'

function escapeCsv(value: string | null | undefined): string {
  const s = String(value ?? '')
  return `"${s.replace(/"/g, '""')}"`
}

function fmtDate(d: Date | null): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export async function GET() {
  const user = await getSessionUser()
  if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clinicId = user.clinicId as string

  const expenses = await withClinicDb(clinicId, (tx) => tx.expense.findMany({
    where: { clinicId },
    orderBy: { date: 'desc' },
    include: { supplier: { select: { name: true } } },
  }))

  const header = [
    'Date', 'Description', 'Category', 'Supplier',
    'Gross', 'Input VAT', 'Net',
    'Payment Method', 'Receipt Number', 'Notes',
  ]

  const rows = expenses.map((e) => [
    fmtDate(e.date),
    e.description,
    e.category,
    e.supplier?.name ?? '',
    Number(e.grossAmount).toFixed(2),
    Number(e.inputVatAmount).toFixed(2),
    Number(e.netAmount).toFixed(2),
    e.paymentMethod,
    e.receiptNumber ?? '',
    e.notes ?? '',
  ])

  const csv = [header, ...rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n')

  const today = new Date().toISOString().split('T')[0]

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="expenses-${today}.csv"`,
    },
  })
}
