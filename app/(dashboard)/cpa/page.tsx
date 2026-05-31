export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'

// TAX_MODULE disabled — redirect any direct visits back to home.
// To re-enable: remove this export, uncomment the imports below, and restore
// the original default export at the bottom of this file.
export default async function CpaPage() { redirect('/') }

/* ── Original CPA page preserved below — restore when TAX_MODULE is re-enabled ──

import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import CpaClient from './CpaClient'

async function CpaPage_TAX_MODULE(

function nextSendDate(): { date: string; quarter: number; year: number; label: string } {
  const now = new Date()
  const m = now.getMonth()
  const y = now.getFullYear()
  if (m < 3) return { date: new Date(y, 3,  1).toISOString(), quarter: 1, year: y, label: `Q1 ${y}` }
  if (m < 6) return { date: new Date(y, 6,  1).toISOString(), quarter: 2, year: y, label: `Q2 ${y}` }
  if (m < 9) return { date: new Date(y, 9,  1).toISOString(), quarter: 3, year: y, label: `Q3 ${y}` }
  return           { date: new Date(y + 1, 0, 1).toISOString(), quarter: 4, year: y, label: `Q4 ${y}` }
}

function quarterRange(q: number, year: number): { start: Date; end: Date } {
  const startMonth = (q - 1) * 3
  return {
    start: new Date(year, startMonth, 1),
    end:   new Date(year, startMonth + 3, 0, 23, 59, 59, 999),
  }
}

function currentQuarterInfo(): { q: number; year: number; label: string } {
  const now = new Date()
  const q = Math.floor(now.getMonth() / 3) + 1
  return { q, year: now.getFullYear(), label: `Q${q} ${now.getFullYear()}` }
}

function previousQuarterInfo(): { q: number; year: number; label: string } {
  const now = new Date()
  const cq = Math.floor(now.getMonth() / 3) + 1
  const pq = cq === 1 ? 4 : cq - 1
  const py = cq === 1 ? now.getFullYear() - 1 : now.getFullYear()
  return { q: pq, year: py, label: `Q${pq} ${py}` }
}

const EWT_CATEGORIES = new Set(['RENT', 'PROFESSIONAL_FEES'])

async function buildQuarterPreview(
  clinicId: string,
  q: number,
  year: number,
  label: string,
  hasEmployees: boolean,
) {
  const { start, end } = quarterRange(q, year)

  const [invoices, expenses, payrollCount] = await Promise.all([
    prisma.invoice.findMany({
      where: { clinicId, status: 'ISSUED', transactionDate: { gte: start, lte: end } },
      select: { grossAmount: true, netAmount: true, vatAmount: true },
    }),
    prisma.expense.findMany({
      where: { clinicId, date: { gte: start, lte: end } },
      include: { supplier: { select: { tin: true } } },
    }),
    hasEmployees
      ? prisma.payrollRecord.count({ where: { clinicId, periodYear: year } })
      : Promise.resolve(0),
  ])

  const grossSales    = invoices.reduce((s, i) => s + Number(i.grossAmount), 0)
  const netSales      = invoices.reduce((s, i) => s + Number(i.netAmount), 0)
  const outputVat     = invoices.reduce((s, i) => s + Number(i.vatAmount), 0)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.grossAmount), 0)
  const inputVat      = expenses.reduce((s, e) => s + Number(e.inputVatAmount), 0)
  const hasQap        = expenses.some((e) => EWT_CATEGORIES.has(e.category) && e.supplier?.tin)

  return {
    quarter: q, year, label,
    grossSales, netSales, outputVat,
    totalExpenses, inputVat,
    netVat: outputVat - inputVat,
    invoiceCount: invoices.length,
    expenseCount: expenses.length,
    hasQap,
    hasPayroll: (payrollCount as number) > 0,
  }
}

export default async function CpaPage() {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: authUser.email! },
    select: { clinicId: true },
  })
  if (!user?.clinicId) redirect('/onboarding')

  const clinic = await prisma.clinic.findUnique({
    where: { id: user.clinicId },
    select: { accountantEmail: true, hasEmployees: true },
  })

  const hasEmployees = clinic?.hasEmployees ?? false
  const curr = currentQuarterInfo()
  const prev = previousQuarterInfo()

  const [assignment, logs, currentPreview, previousPreview] = await Promise.all([
    prisma.cpaClinicAssignment.findFirst({
      where: { clinicId: user.clinicId },
      include: { cpa: { select: { email: true } } },
    }),
    prisma.quarterlyReportLog.findMany({
      where: { clinicId: user.clinicId },
      orderBy: { sentAt: 'desc' },
      take: 20,
    }),
    buildQuarterPreview(user.clinicId, curr.q, curr.year, curr.label, hasEmployees),
    buildQuarterPreview(user.clinicId, prev.q, prev.year, prev.label, hasEmployees),
  ])

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
      currentPreview={currentPreview}
      previousPreview={previousPreview}
    />
  )
}
── End of preserved TAX_MODULE code ── */
