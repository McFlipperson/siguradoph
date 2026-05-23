export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

function previousQuarter(): { q: number; year: number; start: Date; end: Date; label: string } {
  const now = new Date()
  const currentQ = Math.floor(now.getMonth() / 3) + 1
  const prevQ = currentQ === 1 ? 4 : currentQ - 1
  const prevYear = currentQ === 1 ? now.getFullYear() - 1 : now.getFullYear()
  const startMonth = (prevQ - 1) * 3
  const start = new Date(prevYear, startMonth, 1)
  const end = new Date(prevYear, startMonth + 3, 0, 23, 59, 59, 999)
  return { q: prevQ, year: prevYear, start, end, label: `Q${prevQ}-${prevYear}` }
}

function csv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
}

const EWT_CATEGORIES = new Set(['RENT', 'PROFESSIONAL_FEES'])
const ATC: Record<string, string> = { RENT: 'WC158', PROFESSIONAL_FEES: 'WC010' }
const EWT_RATE: Record<string, number> = { RENT: 0.05, PROFESSIONAL_FEES: 0.10 }

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const type = req.nextUrl.searchParams.get('type') ?? ''
  const { start, end, label } = previousQuarter()
  const clinicId = user.clinicId

  if (type === 'slsp-sales') {
    const invoices = await prisma.invoice.findMany({
      where: { clinicId, status: 'ISSUED', transactionDate: { gte: start, lte: end } },
      orderBy: { transactionDate: 'asc' },
    })
    const rows = [
      ['Buyer TIN', 'Buyer Name', 'Buyer Address', 'Gross Taxable Sales', 'Exempt Sales', 'Zero-Rated Sales', 'VAT Amount (12%)', 'OR Number', 'Date'],
      ...invoices.map((i) => [
        '000-000-000',
        i.buyerName ?? 'Various Customers',
        i.buyerAddress ?? '',
        Number(i.netAmount).toFixed(2),
        '0.00', '0.00',
        Number(i.vatAmount).toFixed(2),
        i.orNumber,
        new Date(i.transactionDate).toLocaleDateString('en-PH'),
      ]),
    ]
    return new NextResponse(csv(rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="SLSP-Sales-${label}.csv"`,
      },
    })
  }

  if (type === 'slsp-purchases') {
    const expenses = await prisma.expense.findMany({
      where: { clinicId, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
      include: { supplier: true },
    })
    const serviceCategories = new Set(['RENT', 'PROFESSIONAL_FEES', 'UTILITIES', 'INTERNET_PHONE', 'MAINTENANCE', 'LICENSES_PERMITS'])
    const rows = [
      ['Supplier TIN', 'Supplier Name', 'Supplier Address', 'Services Amount', 'Capital Goods', 'Other Goods', 'Input VAT (12%)', 'Category', 'Receipt No.', 'Date'],
      ...expenses.map((e) => {
        const isService = serviceCategories.has(e.category)
        return [
          e.supplier?.tin ?? '',
          e.supplier?.name ?? e.description,
          e.supplier?.address ?? '',
          isService ? Number(e.netAmount).toFixed(2) : '0.00',
          '0.00',
          !isService ? Number(e.netAmount).toFixed(2) : '0.00',
          Number(e.inputVatAmount).toFixed(2),
          e.category,
          e.receiptNumber ?? '',
          new Date(e.date).toLocaleDateString('en-PH'),
        ]
      }),
    ]
    return new NextResponse(csv(rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="SLSP-Purchases-${label}.csv"`,
      },
    })
  }

  if (type === 'qap') {
    const expenses = await prisma.expense.findMany({
      where: { clinicId, date: { gte: start, lte: end } },
      include: { supplier: true },
    })
    const ewtExpenses = expenses.filter((e) => EWT_CATEGORIES.has(e.category) && e.supplier?.tin)
    const grouped = new Map<string, { name: string; tin: string; address: string; atc: string; totalPayment: number; ewt: number; category: string }>()
    for (const e of ewtExpenses) {
      const key = `${e.supplier!.tin}-${e.category}`
      const rate = EWT_RATE[e.category] ?? 0
      const payment = Number(e.grossAmount)
      const existing = grouped.get(key)
      if (existing) {
        existing.totalPayment += payment
        existing.ewt += payment * rate
      } else {
        grouped.set(key, {
          name: e.supplier!.name,
          tin: e.supplier!.tin!,
          address: e.supplier?.address ?? '',
          atc: ATC[e.category] ?? '',
          totalPayment: payment,
          ewt: payment * rate,
          category: e.category,
        })
      }
    }
    const rows = [
      ['Payee TIN', 'Payee Name', 'Payee Address', 'ATC', 'Nature of Payment', 'Total Amount Paid', 'EWT Rate', 'EWT Amount'],
      ...Array.from(grouped.values()).map((p) => [
        p.tin, p.name, p.address, p.atc,
        p.atc === 'WC158' ? 'Rent' : 'Professional Fees',
        p.totalPayment.toFixed(2),
        `${(EWT_RATE[p.category] ?? 0) * 100}%`,
        p.ewt.toFixed(2),
      ]),
    ]
    return new NextResponse(csv(rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="QAP-${label}.csv"`,
      },
    })
  }

  if (type === 'payroll') {
    const qMonths = [start.getMonth() + 1, start.getMonth() + 2, start.getMonth() + 3]
    const records = await prisma.payrollRecord.findMany({
      where: { clinicId, periodYear: start.getFullYear(), periodMonth: { in: qMonths } },
      include: { employee: { select: { fullName: true, dailyRate: true } } },
      orderBy: [{ periodMonth: 'asc' }, { periodWeek: 'asc' }],
    })
    const rows = [
      ['Employee', 'Month', 'Week', 'Days Worked', 'Daily Rate', 'Gross Pay', 'SSS Employee', 'SSS Employer', 'PhilHealth Employee', 'PhilHealth Employer', 'Pag-IBIG Employee', 'Pag-IBIG Employer', 'Withholding Tax', 'Net Pay'],
      ...records.map((r) => [
        r.employee.fullName, r.periodMonth, r.periodWeek,
        r.daysWorked, Number(r.employee.dailyRate).toFixed(2),
        Number(r.basicSalary).toFixed(2),
        Number(r.sssEmployee).toFixed(2), Number(r.sssEmployer).toFixed(2),
        Number(r.philhealthEmployee).toFixed(2), Number(r.philhealthEmployer).toFixed(2),
        Number(r.pagibigEmployee).toFixed(2), Number(r.pagibigEmployer).toFixed(2),
        Number(r.withholdingTax).toFixed(2), Number(r.netPay).toFixed(2),
      ]),
    ]
    return new NextResponse(csv(rows), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="Payroll-${label}.csv"`,
      },
    })
  }

  return NextResponse.json({ error: 'Invalid type. Use: slsp-sales, slsp-purchases, qap, payroll' }, { status: 400 })
}
