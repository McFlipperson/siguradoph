export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import CpaClient from './CpaClient'

function nextSendDate(): { date: string; quarter: number; year: number; label: string } {
  const now = new Date()
  const m = now.getMonth()
  const y = now.getFullYear()
  if (m < 3) return { date: new Date(y, 3,  1).toISOString(), quarter: 1, year: y, label: `Q1 ${y}` }
  if (m < 6) return { date: new Date(y, 6,  1).toISOString(), quarter: 2, year: y, label: `Q2 ${y}` }
  if (m < 9) return { date: new Date(y, 9,  1).toISOString(), quarter: 3, year: y, label: `Q3 ${y}` }
  return           { date: new Date(y + 1, 0, 1).toISOString(), quarter: 4, year: y, label: `Q4 ${y}` }
}

function previousQuarter(): { q: number; year: number; start: Date; end: Date; label: string } {
  const now = new Date()
  const currentQ = Math.floor(now.getMonth() / 3) + 1
  const prevQ = currentQ === 1 ? 4 : currentQ - 1
  const prevYear = currentQ === 1 ? now.getFullYear() - 1 : now.getFullYear()
  const startMonth = (prevQ - 1) * 3
  const start = new Date(prevYear, startMonth, 1)
  const end = new Date(prevYear, startMonth + 3, 0, 23, 59, 59, 999)
  return { q: prevQ, year: prevYear, start, end, label: `Q${prevQ} ${prevYear}` }
}

const EWT_CATEGORIES = new Set(['RENT', 'PROFESSIONAL_FEES'])

export default async function CpaPage() {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: authUser.email! },
    select: { clinicId: true },
  })
  if (!user?.clinicId) redirect('/onboarding')

  const { q, year, start, end, label: prevLabel } = previousQuarter()

  const clinic = await prisma.clinic.findUnique({
    where: { id: user.clinicId },
    select: { accountantEmail: true, hasEmployees: true },
  })

  const [assignment, logs, invoices, expenses, payrollCount] = await Promise.all([
    prisma.cpaClinicAssignment.findFirst({
      where: { clinicId: user.clinicId },
      include: { cpa: { select: { email: true } } },
    }),
    prisma.quarterlyReportLog.findMany({
      where: { clinicId: user.clinicId },
      orderBy: { sentAt: 'desc' },
      take: 20,
    }),
    prisma.invoice.findMany({
      where: { clinicId: user.clinicId, status: 'ISSUED', transactionDate: { gte: start, lte: end } },
      select: { grossAmount: true, netAmount: true, vatAmount: true },
    }),
    prisma.expense.findMany({
      where: { clinicId: user.clinicId, date: { gte: start, lte: end } },
      include: { supplier: { select: { tin: true } } },
    }),
    clinic?.hasEmployees
      ? prisma.payrollRecord.count({ where: { clinicId: user.clinicId, periodYear: year } })
      : Promise.resolve(0),
  ])

  const grossSales    = invoices.reduce((s, i) => s + Number(i.grossAmount), 0)
  const netSales      = invoices.reduce((s, i) => s + Number(i.netAmount), 0)
  const outputVat     = invoices.reduce((s, i) => s + Number(i.vatAmount), 0)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.grossAmount), 0)
  const inputVat      = expenses.reduce((s, e) => s + Number(e.inputVatAmount), 0)
  const hasQap        = expenses.some((e) => EWT_CATEGORIES.has(e.category) && e.supplier?.tin)

  const next = nextSendDate()

  return (
    <CpaClient
      accountantEmail={clinic?.accountantEmail ?? null}
      assignedCpaEmail={assignment?.cpa.email ?? null}
      nextSend={next}
      logs={logs.map((l) => ({
        id: l.id,
        quarter: l.quarter,
        year: l.year,
        sentAt: l.sentAt.toISOString(),
        sentTo: l.sentTo,
        status: l.status,
        errorMessage: l.errorMessage ?? null,
      }))}
      preview={{
        quarter: q,
        year,
        label: prevLabel,
        grossSales,
        netSales,
        outputVat,
        totalExpenses,
        inputVat,
        netVat: outputVat - inputVat,
        invoiceCount: invoices.length,
        expenseCount: expenses.length,
        hasQap,
        hasPayroll: (payrollCount as number) > 0,
      }}
    />
  )
}
