export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import ReportsClient from './ReportsClient'

// ─── Date helpers ─────────────────────────────────────────────────────────────

function dateRanges() {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Monday of current week
  const day = startOfToday.getDay() // 0 = Sun
  const diffToMonday = day === 0 ? -6 : 1 - day
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfToday.getDate() + diffToMonday)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  return { startOfToday, startOfWeek, startOfMonth, now }
}

// ─── Stats builder ────────────────────────────────────────────────────────────

type InvoiceRow = {
  grossAmount: number
  vatAmount: number
  serviceDescription: string
  paymentMethod: string
  status: string
  transactionDate: Date
  patientId: string | null
}

type ExpenseRow = {
  grossAmount: number
  inputVatAmount: number
  date: Date
}

export type PeriodStats = {
  totalCollected: number
  patientCount: number
  invoiceCount: number
  avgPerPatient: number
  byService: { name: string; amount: number; count: number }[]
  byPayment: { method: string; amount: number; count: number }[]
  totalExpenses: number
  netProfit: number
  outputVat: number
  inputVat: number
  netVat: number
}

function buildStats(invoices: InvoiceRow[], expenses: ExpenseRow[]): PeriodStats {
  const issued = invoices.filter((i) => i.status === 'ISSUED')

  const totalCollected = issued.reduce((s, i) => s + i.grossAmount, 0)
  const outputVat      = issued.reduce((s, i) => s + i.vatAmount,   0)
  const totalExpenses  = expenses.reduce((s, e) => s + e.grossAmount,  0)
  const inputVat       = expenses.reduce((s, e) => s + e.inputVatAmount, 0)
  const patientCount   = new Set(issued.map((i) => i.patientId).filter(Boolean)).size

  // By service
  const serviceMap = new Map<string, { amount: number; count: number }>()
  for (const inv of issued) {
    const key = inv.serviceDescription
    const existing = serviceMap.get(key)
    if (existing) {
      existing.amount += inv.grossAmount
      existing.count  += 1
    } else {
      serviceMap.set(key, { amount: inv.grossAmount, count: 1 })
    }
  }
  const byService = Array.from(serviceMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.amount - a.amount)

  // By payment
  const paymentMap = new Map<string, { amount: number; count: number }>()
  for (const inv of issued) {
    const key = inv.paymentMethod
    const existing = paymentMap.get(key)
    if (existing) {
      existing.amount += inv.grossAmount
      existing.count  += 1
    } else {
      paymentMap.set(key, { amount: inv.grossAmount, count: 1 })
    }
  }
  const byPayment = Array.from(paymentMap.entries())
    .map(([method, v]) => ({ method, ...v }))
    .sort((a, b) => b.amount - a.amount)

  return {
    totalCollected,
    patientCount,
    invoiceCount: issued.length,
    avgPerPatient: patientCount > 0 ? Math.round(totalCollected / patientCount) : 0,
    byService,
    byPayment,
    totalExpenses,
    netProfit: totalCollected - totalExpenses,
    outputVat,
    inputVat,
    netVat: outputVat - inputVat,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReportsPage() {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: authUser.email! },
    select: { clinicId: true },
  })
  if (!user?.clinicId) redirect('/onboarding')

  const { startOfMonth, now } = dateRanges()

  // Fetch the full month in one query — filter for periods in JS
  const [rawInvoices, rawExpenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { clinicId: user.clinicId, transactionDate: { gte: startOfMonth, lte: now } },
      include: { visit: { select: { patientId: true } } },
      orderBy: { transactionDate: 'asc' },
    }),
    prisma.expense.findMany({
      where: { clinicId: user.clinicId, date: { gte: startOfMonth, lte: now } },
      select: { grossAmount: true, inputVatAmount: true, date: true },
    }),
  ])

  const { startOfToday, startOfWeek } = dateRanges()

  const invoices: InvoiceRow[] = rawInvoices.map((i) => ({
    grossAmount:        Number(i.grossAmount),
    vatAmount:          Number(i.vatAmount),
    serviceDescription: i.serviceDescription,
    paymentMethod:      i.paymentMethod,
    status:             i.status,
    transactionDate:    i.transactionDate,
    patientId:          i.visit?.patientId ?? null,
  }))

  const expenses: ExpenseRow[] = rawExpenses.map((e) => ({
    grossAmount:    Number(e.grossAmount),
    inputVatAmount: Number(e.inputVatAmount),
    date:           e.date,
  }))

  const todayInvoices  = invoices.filter((i) => i.transactionDate >= startOfToday)
  const weekInvoices   = invoices.filter((i) => i.transactionDate >= startOfWeek)
  const todayExpenses  = expenses.filter((e) => e.date >= startOfToday)
  const weekExpenses   = expenses.filter((e) => e.date >= startOfWeek)

  return (
    <ReportsClient
      today={buildStats(todayInvoices, todayExpenses)}
      week={buildStats(weekInvoices,   weekExpenses)}
      month={buildStats(invoices,       expenses)}
      monthLabel={now.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}
    />
  )
}
