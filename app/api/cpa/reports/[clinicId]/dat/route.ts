import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parsePeriod, verifyCpaAccess } from '../_lib'

export async function GET(req: NextRequest, { params }: { params: { clinicId: string } }) {
  const ok = await verifyCpaAccess(params.clinicId)
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const period = req.nextUrl.searchParams.get('period') ?? ''
  const { start, end } = parsePeriod(period || 'now')

  const clinic = await prisma.clinic.findUnique({ where: { id: params.clinicId } })
  if (!clinic) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const invoices = await prisma.invoice.findMany({
    where: { clinicId: params.clinicId, status: 'ISSUED', transactionDate: { gte: start, lte: end } },
    orderBy: { transactionDate: 'asc' },
  })

  const header = 'TIN|REGISTERED NAME|DATE|OR NUMBER|GROSS AMOUNT|EXEMPT|ZERO-RATED|VAT AMOUNT|NET OF VAT'
  const lines = invoices.map((inv) => {
    const d = new Date(inv.transactionDate)
    const dateStr = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`
    return [
      clinic.tin,
      clinic.name,
      dateStr,
      inv.orNumber,
      Number(inv.grossAmount).toFixed(2),
      '0.00',
      '0.00',
      Number(inv.vatAmount).toFixed(2),
      Number(inv.netAmount).toFixed(2),
    ].join('|')
  })

  const dat = [header, ...lines].join('\n')

  return new NextResponse(dat, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="SLS-${params.clinicId}-${period || 'report'}.DAT"`,
    },
  })
}
