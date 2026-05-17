'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

type Invoice = {
  id: string
  orNumber: string
  patientName: string
  transactionDate: string
  serviceDescription: string
  grossAmount: number
  paymentMethod: string
  status: string
}

type Props = {
  invoices: Invoice[]
}

type FilterChip = 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CASH' | 'GCASH' | 'VOID'

function fmt(n: number): string {
  return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(n)
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function isWithinLastDays(date: Date, days: number) {
  const now = new Date()
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  return date >= cutoff
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

const CHIPS: { key: FilterChip; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'TODAY', label: 'Today' },
  { key: 'WEEK', label: 'This Week' },
  { key: 'MONTH', label: 'This Month' },
  { key: 'CASH', label: 'Cash' },
  { key: 'GCASH', label: 'GCash' },
  { key: 'VOID', label: 'Void' },
]

export default function InvoiceListClient({ invoices }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterChip>('ALL')

  const filtered = useMemo(() => {
    const now = new Date()
    const q = search.toLowerCase().trim()

    return invoices.filter((inv) => {
      // Search
      if (q) {
        const matches =
          inv.orNumber.toLowerCase().includes(q) ||
          inv.patientName.toLowerCase().includes(q)
        if (!matches) return false
      }

      // Chip filter
      const date = new Date(inv.transactionDate)
      if (filter === 'TODAY' && !isSameDay(date, now)) return false
      if (filter === 'WEEK' && !isWithinLastDays(date, 7)) return false
      if (filter === 'MONTH' && !isSameMonth(date, now)) return false
      if (filter === 'CASH' && inv.paymentMethod !== 'CASH') return false
      if (filter === 'GCASH' && inv.paymentMethod !== 'GCASH') return false
      if (filter === 'VOID' && inv.status !== 'VOID') return false

      return true
    })
  }, [invoices, search, filter])

  return (
    <div className="space-y-4">
      {/* Search */}
      <Input
        placeholder="Search by OR # or patient name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="min-h-[48px]"
      />

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
        {CHIPS.map((chip) => (
          <button
            key={chip.key}
            onClick={() => setFilter(chip.key)}
            className={[
              'shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-colors',
              filter === chip.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-foreground border-border',
            ].join(' ')}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Invoice list */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No receipts found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => (
            <Card
              key={inv.id}
              className="cursor-pointer active:bg-muted transition-colors"
              onClick={() => router.push('/invoices/' + inv.id)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm">OR #{inv.orNumber}</span>
                      <span
                        className={[
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          inv.paymentMethod === 'GCASH'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-700',
                        ].join(' ')}
                      >
                        {inv.paymentMethod}
                      </span>
                      <span
                        className={[
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          inv.status === 'ISSUED'
                            ? 'bg-green-100 text-green-800'
                            : inv.status === 'VOID'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-700',
                        ].join(' ')}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium mt-1">{inv.patientName}</p>
                    <p className="text-xs text-muted-foreground truncate">{inv.serviceDescription}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(inv.transactionDate).toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className="font-bold text-base shrink-0">₱{fmt(inv.grossAmount)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
