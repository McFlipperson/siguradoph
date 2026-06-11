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
  const [period, setPeriod] = useState<Period>('month') // default to most useful period

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

      {/* By service */}
      <Section title="Revenue by Service">
        {d.byService.length === 0 ? (
          <p className="text-sm text-muted-foreground py-1">No services recorded.</p>
        ) : (
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
        )}
      </Section>

      {/* Income vs Expenses */}
      <Section title="Income vs Expenses">
        <StatRow label="Collections" value={peso(d.totalCollected)} />
        <StatRow label="Expenses"    value={`−${peso(d.totalExpenses)}`} />
        <div className="flex items-center justify-between pt-2 mt-1">
          <span className="text-sm font-bold">Net</span>
          <span className={`text-base font-bold tabular-nums ${d.netProfit >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
            {d.netProfit >= 0 ? peso(d.netProfit) : `−${peso(Math.abs(d.netProfit))}`}
          </span>
        </div>
      </Section>

      {/* VAT summary */}
      <Section title="VAT Summary">
        <StatRow label="Output VAT collected"  value={peso(d.outputVat)} />
        <StatRow label="Input VAT (claimable)" value={`−${peso(d.inputVat)}`} />
        <div className="flex items-center justify-between pt-2 mt-1">
          <span className="text-sm font-bold">Net VAT Payable</span>
          <span className="text-base font-bold tabular-nums">{peso(d.netVat)}</span>
        </div>
      </Section>

      {/* Payment method */}
      <Section title="Payment Method">
        {d.byPayment.length === 0 ? (
          <p className="text-sm text-muted-foreground py-1">No payments recorded.</p>
        ) : (
          d.byPayment.map((p) => (
            <StatRow
              key={p.method}
              label={`${p.method} (${p.count})`}
              value={peso(p.amount)}
            />
          ))
        )}
      </Section>

      {/* Backup & Export */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 space-y-3">
        <div>
          <h2 className="text-sm font-bold text-blue-900">Backup & Export</h2>
          <p className="text-xs text-blue-600 mt-0.5">Download your data as a spreadsheet anytime.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { href: '/api/patients/export', label: 'Patients', icon: <path d="M13 2H6a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7z" />, icon2: <path d="M13 2v5h5M8 13h4M10 11v4" /> },
            { href: '/api/invoices/export', label: 'Invoices', icon: <rect x="2" y="3" width="16" height="14" rx="2" />, icon2: <path d="M6 7h8M6 10h8M6 13h5" /> },
            { href: '/api/expenses/export', label: 'Expenses', icon: <path d="M10 2a8 8 0 100 16A8 8 0 0010 2z" />, icon2: <path d="M10 6v4l3 3" /> },
          ].map(({ href, label, icon, icon2 }) => (
            <a
              key={label}
              href={href}
              download
              className="flex flex-col items-center justify-center gap-1.5 min-h-[72px] rounded-xl bg-white border border-blue-100 text-xs font-semibold text-blue-700 active:bg-blue-50 transition-colors px-2 text-center shadow-sm"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                {icon}{icon2}
              </svg>
              {label}
            </a>
          ))}
        </div>
        <p className="text-xs text-blue-400">CSV · opens in Excel, Google Sheets, Numbers</p>
      </div>

    </div>
  )
}
