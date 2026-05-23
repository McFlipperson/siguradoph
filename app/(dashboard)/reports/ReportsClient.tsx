'use client'

import { useState } from 'react'
import type { PeriodStats } from './page'

interface Props {
  today: PeriodStats
  week:  PeriodStats
  month: PeriodStats
  monthLabel: string
}

type Period = 'today' | 'week' | 'month'

function peso(n: number) {
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

function pesoShort(n: number) {
  if (n >= 1_000_000) return '₱' + (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000)     return '₱' + (n / 1_000).toFixed(1) + 'k'
  return '₱' + n.toLocaleString('en-PH')
}

// Simple horizontal bar showing proportion
function Bar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="h-1.5 rounded-full bg-muted overflow-hidden mt-1">
      <div
        className="h-full rounded-full bg-primary/60 transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// Section wrapper card
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border/60">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{title}</p>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}

// Stat row with label + value
function StatRow({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
      <span className={`text-sm ${color ?? 'text-muted-foreground'}`}>{label}</span>
      <span className={`text-sm tabular-nums ${bold ? 'font-bold text-foreground' : 'text-foreground'} ${color ?? ''}`}>
        {value}
      </span>
    </div>
  )
}

export default function ReportsClient({ today, week, month, monthLabel }: Props) {
  const [period, setPeriod] = useState<Period>('month')

  const data: Record<Period, PeriodStats> = { today, week, month }
  const d = data[period]

  const periodLabel = period === 'today' ? 'Today' : period === 'week' ? 'This Week' : monthLabel
  const maxService = d.byService[0]?.amount ?? 0

  return (
    <div className="flex flex-col gap-5 pb-4">

      {/* Period toggle */}
      <div className="flex bg-muted rounded-xl p-1 gap-1">
        {(['today', 'week', 'month'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              period === p
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground'
            }`}
          >
            {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
          </button>
        ))}
      </div>

      {/* Hero — total collected */}
      <div className="bg-primary rounded-2xl px-5 py-6 text-primary-foreground">
        <p className="text-sm font-medium opacity-80">Collections — {periodLabel}</p>
        <p className="text-4xl font-bold mt-1 tabular-nums">
          {pesoShort(d.totalCollected)}
        </p>
        <div className="flex gap-4 mt-3 text-sm opacity-80">
          <span>{d.invoiceCount} {d.invoiceCount === 1 ? 'invoice' : 'invoices'}</span>
          <span>·</span>
          <span>{d.patientCount} {d.patientCount === 1 ? 'patient' : 'patients'}</span>
          {d.patientCount > 0 && (
            <>
              <span>·</span>
              <span>{pesoShort(d.avgPerPatient)} avg</span>
            </>
          )}
        </div>
      </div>

      {/* No data state */}
      {d.invoiceCount === 0 && (
        <div className="text-center py-6 text-sm text-muted-foreground">
          No invoices recorded for this period.
        </div>
      )}

      {d.invoiceCount > 0 && (
        <>
          {/* By service */}
          {d.byService.length > 0 && (
            <Section title="Revenue by Service">
              <div className="flex flex-col gap-0.5">
                {d.byService.map((s) => (
                  <div key={s.name} className="py-2 border-b border-border/40 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{s.name}</span>
                      <div className="text-right">
                        <span className="text-sm font-semibold tabular-nums">{peso(s.amount)}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {s.count} {s.count === 1 ? 'visit' : 'visits'}
                        </span>
                      </div>
                    </div>
                    <Bar value={s.amount} max={maxService} />
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Income vs Expenses */}
          <Section title="Income vs Expenses">
            <StatRow label="Collections"  value={peso(d.totalCollected)} />
            <StatRow label="Expenses"     value={`−${peso(d.totalExpenses)}`} />
            <div className="flex items-center justify-between pt-2 mt-1">
              <span className="text-sm font-bold">Net</span>
              <span className={`text-base font-bold tabular-nums ${d.netProfit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                {d.netProfit >= 0 ? peso(d.netProfit) : `−${peso(Math.abs(d.netProfit))}`}
              </span>
            </div>
          </Section>

          {/* VAT summary */}
          <Section title="VAT Summary">
            <StatRow label="Output VAT collected"    value={peso(d.outputVat)} />
            <StatRow label="Input VAT (claimable)"   value={`−${peso(d.inputVat)}`} />
            <div className="flex items-center justify-between pt-2 mt-1">
              <span className="text-sm font-bold">Net VAT Payable</span>
              <span className="text-base font-bold tabular-nums">{peso(d.netVat)}</span>
            </div>
          </Section>

          {/* Payment method */}
          {d.byPayment.length > 0 && (
            <Section title="Payment Method">
              {d.byPayment.map((p) => (
                <StatRow
                  key={p.method}
                  label={`${p.method} (${p.count})`}
                  value={peso(p.amount)}
                />
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  )
}
