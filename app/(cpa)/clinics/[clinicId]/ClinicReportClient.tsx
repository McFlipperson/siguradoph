'use client'

import { useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronDown, ChevronUp, Download } from 'lucide-react'

type InvoiceRow = {
  id: string
  orNumber: string
  transactionDate: string
  buyerName: string | null
  serviceDescription: string
  grossAmount: number
  netAmount: number
  vatAmount: number
  discountAmount: number
  paymentMethod: string
  status: string
}

type ExpenseRow = {
  id: string
  date: string
  category: string
  description: string
  grossAmount: number
  inputVatAmount: number
}

type ClinicInfo = {
  id: string
  name: string
  ownerName: string
  tin: string
  vatRegistered: boolean
  address: string
  enrollmentDate: string
}

type Props = {
  clinic: ClinicInfo
  invoices: InvoiceRow[]
  expenses: ExpenseRow[]
  period: string
  periodLabel: string
}

export default function ClinicReportClient({ clinic, invoices, expenses, period, periodLabel }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [expensesOpen, setExpensesOpen] = useState(false)
  const [periodInput, setPeriodInput] = useState(period)

  function goToPeriod(p: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', p)
    router.push(`${pathname}?${params}`)
  }

  const issuedInvoices = invoices.filter((i) => i.status === 'ISSUED')
  const totalGross = issuedInvoices.reduce((s, i) => s + i.grossAmount, 0)
  const totalOutputVat = issuedInvoices.reduce((s, i) => s + i.vatAmount, 0)
  const totalInputVat = expenses.reduce((s, e) => s + e.inputVatAmount, 0)
  const netVatPayable = totalOutputVat - totalInputVat

  function fmt(n: number) {
    return n.toLocaleString('en-PH', { minimumFractionDigits: 2 })
  }
  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const baseUrl = `/api/cpa/reports/${clinic.id}`
  function download(type: 'pdf' | 'csv' | 'dat') {
    window.open(`${baseUrl}/${type}?period=${encodeURIComponent(period)}`, '_blank')
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{clinic.name}</h1>
        <p className="text-muted-foreground text-sm">{clinic.address} · TIN: {clinic.tin} · {clinic.vatRegistered ? 'VAT-Registered' : 'Non-VAT'}</p>
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium">Period:</span>
        <div className="flex gap-2">
          {(() => {
            const now = new Date()
            const cm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
            const cq = `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`
            const cy = `${now.getFullYear()}`
            return [
              { label: 'This Month', val: cm },
              { label: 'This Quarter', val: cq },
              { label: 'This Year', val: cy },
            ].map(({ label, val }) => (
              <button
                key={val}
                onClick={() => goToPeriod(val)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${period === val ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:bg-muted'}`}
              >
                {label}
              </button>
            ))
          })()}
        </div>
        <div className="flex gap-2 items-center">
          <input
            value={periodInput}
            onChange={(e) => setPeriodInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && goToPeriod(periodInput)}
            placeholder="2026-05 / 2026-Q2 / 2026"
            className="border rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring w-44"
          />
          <button onClick={() => goToPeriod(periodInput)} className="px-3 py-1.5 rounded-lg text-sm bg-muted border hover:bg-muted/80">Go</button>
        </div>
        <span className="text-sm font-semibold text-primary">{periodLabel}</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Gross Sales', value: totalGross, color: '' },
          { label: 'Output VAT', value: totalOutputVat, color: '' },
          { label: 'Input VAT', value: totalInputVat, color: '' },
          { label: 'Net VAT Payable', value: netVatPayable, color: netVatPayable > 0 ? 'text-red-600' : 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>₱{fmt(value)}</p>
          </div>
        ))}
      </div>

      {/* Download buttons */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={() => download('pdf')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          <Download className="w-4 h-4" /> PDF Report
        </button>
        <button onClick={() => download('csv')} className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted">
          <Download className="w-4 h-4" /> CSV
        </button>
        <button onClick={() => download('dat')} className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted">
          <Download className="w-4 h-4" /> SLS DAT (BIR)
        </button>
      </div>

      {/* Invoice table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Sales Invoices ({invoices.length})</h2>
          <span className="text-sm text-muted-foreground">{issuedInvoices.length} issued · {invoices.length - issuedInvoices.length} void</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs text-muted-foreground">
                <th className="px-4 py-2 font-medium">OR No.</th>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">Buyer</th>
                <th className="px-4 py-2 font-medium">Service</th>
                <th className="px-4 py-2 font-medium text-right">Gross</th>
                <th className="px-4 py-2 font-medium text-right">Net</th>
                <th className="px-4 py-2 font-medium text-right">VAT</th>
                <th className="px-4 py-2 font-medium">Method</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">No invoices for this period.</td></tr>
              )}
              {invoices.map((inv) => (
                <tr key={inv.id} className={inv.status === 'VOID' ? 'text-muted-foreground bg-gray-50' : ''}>
                  <td className="px-4 py-2.5 font-mono text-xs">{inv.orNumber}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{fmtDate(inv.transactionDate)}</td>
                  <td className="px-4 py-2.5 max-w-[140px] truncate">{inv.buyerName ?? '—'}</td>
                  <td className="px-4 py-2.5 max-w-[160px] truncate">{inv.serviceDescription}</td>
                  <td className="px-4 py-2.5 text-right">₱{fmt(inv.grossAmount)}</td>
                  <td className="px-4 py-2.5 text-right">₱{fmt(inv.netAmount)}</td>
                  <td className="px-4 py-2.5 text-right">₱{fmt(inv.vatAmount)}</td>
                  <td className="px-4 py-2.5">{inv.paymentMethod}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inv.status === 'VOID' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenses table (collapsible) */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <button
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
          onClick={() => setExpensesOpen((v) => !v)}
        >
          <h2 className="font-semibold">Expenses ({expenses.length})</h2>
          {expensesOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {expensesOpen && (
          <div className="overflow-x-auto border-t">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Date</th>
                  <th className="px-4 py-2 font-medium">Category</th>
                  <th className="px-4 py-2 font-medium">Description</th>
                  <th className="px-4 py-2 font-medium text-right">Amount</th>
                  <th className="px-4 py-2 font-medium text-right">Input VAT</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expenses.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No expenses for this period.</td></tr>
                )}
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-2.5">{fmtDate(e.date)}</td>
                    <td className="px-4 py-2.5 text-xs">{e.category.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-2.5 max-w-[200px] truncate">{e.description}</td>
                    <td className="px-4 py-2.5 text-right">₱{fmt(e.grossAmount)}</td>
                    <td className="px-4 py-2.5 text-right">₱{fmt(e.inputVatAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
