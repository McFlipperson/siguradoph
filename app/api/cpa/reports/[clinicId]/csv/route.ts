import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parsePeriod, verifyCpaAccess } from '../_lib'

export async function GET(req: NextRequest, { params }: { params: { clinicId: string } }) {
  const ok = await verifyCpaAccess(params.clinicId)
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const period = req.nextUrl.searchParams.get('period') ?? ''
  const { start, end } = parsePeriod(period || 'now')

  const invoices = await prisma.invoice.findMany({
    where: { clinicId: params.clinicId, transactionDate: { gte: start, lte: end } },
    orderBy: { transactionDate: 'asc' },
  })

  const header = ['OR Number', 'Date', 'Buyer Name', 'Service Description', 'Gross Amount', 'Net Amount', 'VAT Amount', 'Discount', 'Payment Method', 'Status']
  const rows = invoices.map((inv) => [
    inv.orNumber,
    new Date(inv.transactionDate).toLocaleDateString('en-PH'),
    inv.buyerName ?? '',
    inv.serviceDescription,
    Number(inv.grossAmount).toFixed(2),
    Number(inv.netAmount).toFixed(2),
    Number(inv.vatAmount).toFixed(2),
    Number(inv.discountAmount).toFixed(2),
    inv.paymentMethod,
    inv.status,
  ])

  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="invoices-${period || 'report'}.csv"`,
    },
  })
}
