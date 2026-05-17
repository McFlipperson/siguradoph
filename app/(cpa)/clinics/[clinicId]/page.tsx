import { redirect, notFound } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ClinicReportClient from './ClinicReportClient'

export const dynamic = 'force-dynamic'

function parsePeriod(period: string): { start: Date; end: Date; label: string } {
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [y, m] = period.split('-').map(Number)
    return {
      start: new Date(y, m - 1, 1),
      end: new Date(y, m, 0, 23, 59, 59, 999),
      label: new Date(y, m - 1).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' }),
    }
  }
  if (/^\d{4}-Q[1-4]$/.test(period)) {
    const y = Number(period.slice(0, 4))
    const q = Number(period.slice(6))
    const startMonth = (q - 1) * 3
    return {
      start: new Date(y, startMonth, 1),
      end: new Date(y, startMonth + 3, 0, 23, 59, 59, 999),
      label: `Q${q} ${y}`,
    }
  }
  if (/^\d{4}$/.test(period)) {
    const y = Number(period)
    return {
      start: new Date(y, 0, 1),
      end: new Date(y, 11, 31, 23, 59, 59, 999),
      label: `Year ${y}`,
    }
  }
  const now = new Date()
  return parsePeriod(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
}

export default async function ClinicReportPage({
  params,
  searchParams,
}: {
  params: { clinicId: string }
  searchParams: { period?: string }
}) {
  const user = await getSessionUser()
  if (!user || user.role !== 'CPA') redirect('/')

  const assignment = await prisma.cpaClinicAssignment.findFirst({
    where: { cpaUserId: user.id, clinicId: params.clinicId },
  })
  if (!assignment) notFound()

  const clinic = await prisma.clinic.findUnique({ where: { id: params.clinicId } })
  if (!clinic) notFound()

  const period = searchParams.period ?? (() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })()

  const { start, end, label } = parsePeriod(period)

  const [invoices, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { clinicId: params.clinicId, transactionDate: { gte: start, lte: end } },
      orderBy: { transactionDate: 'asc' },
    }),
    prisma.expense.findMany({
      where: { clinicId: params.clinicId, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    }),
  ])

  const invoiceData = invoices.map((inv) => ({
    id: inv.id,
    orNumber: inv.orNumber,
    transactionDate: inv.transactionDate.toISOString(),
    buyerName: inv.buyerName ?? null,
    serviceDescription: inv.serviceDescription,
    grossAmount: Number(inv.grossAmount),
    netAmount: Number(inv.netAmount),
    vatAmount: Number(inv.vatAmount),
    discountAmount: Number(inv.discountAmount),
    paymentMethod: inv.paymentMethod as string,
    status: inv.status as string,
  }))

  const expenseData = expenses.map((e) => ({
    id: e.id,
    date: e.date.toISOString(),
    category: e.category as string,
    description: e.description,
    grossAmount: Number(e.grossAmount),
    inputVatAmount: Number(e.inputVatAmount),
  }))

  return (
    <ClinicReportClient
      clinic={{
        id: clinic.id,
        name: clinic.name,
        ownerName: clinic.ownerName,
        tin: clinic.tin,
        vatRegistered: clinic.vatRegistered,
        address: `${clinic.street}, ${clinic.city}, ${clinic.province} ${clinic.zip}`,
        enrollmentDate: clinic.enrollmentDate.toISOString(),
      }}
      invoices={invoiceData}
      expenses={expenseData}
      period={period}
      periodLabel={label}
    />
  )
}
