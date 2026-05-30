'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { TrendingUp, FileText, Receipt, ChevronDown, ChevronUp } from 'lucide-react'

interface Log {
  id: string
  quarter: number
  year: number
  sentAt: string
  sentTo: string
  status: string
  errorMessage: string | null
}

interface NextSend {
  date: string
  quarter: number
  year: number
  label: string
}

interface Preview {
  quarter: number
  year: number
  label: string
  grossSales: number
  netSales: number
  outputVat: number
  totalExpenses: number
  inputVat: number
  netVat: number
  invoiceCount: number
  expenseCount: number
  hasQap: boolean
  hasPayroll: boolean
}

interface Props {
  accountantEmail: string | null
  assignedCpaEmail: string | null
  nextSend: NextSend
  logs: Log[]
  currentPreview: Preview
  previousPreview: Preview
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
}

function peso(n: number) {
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function DownloadButton({ type, label }: { type: string; label: string }) {
  return (
    <a
      href={`/api/reports/quarterly/download?type=${type}`}
      download
      className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors min-h-[48px]"
    >
      <span>{label}</span>
      <span className="text-xs text-muted-foreground ml-2">↓ CSV</span>
    </a>
  )
}

function QuarterSummary({ preview }: { preview: Preview }) {
  const netIncome = preview.grossSales - preview.totalExpenses

  return (
    <div className="space-y-4">

      {/* Revenue block */}
      <div className="rounded-2xl bg-muted/30 border p-4 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <Receipt className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Revenue — {preview.invoiceCount} invoice{preview.invoiceCount !== 1 ? 's' : ''}
          </p>
        </div>
        <Row label="Gross Sales" value={peso(preview.grossSales)} bold />
        <Row label="Net Sales (ex. VAT)" value={peso(preview.netSales)} />
        <Row label="Output VAT (12%)" value={peso(preview.outputVat)} />
      </div>

      {/* Expenses block */}
      <div className="rounded-2xl bg-muted/30 border p-4 space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Expenses — {preview.expenseCount} entr{preview.expenseCount !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        <Row label="Total Expenses" value={peso(preview.totalExpenses)} bold />
        <Row label="Input VAT (claimable)" value={peso(preview.inputVat)} />
      </div>

      {/* Summary totals */}
      <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-4 h-4 text-primary" />
          <p className="text-xs font-semibold text-primary uppercase tracking-wide">Summary</p>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-border/40">
          <span className="text-sm text-muted-foreground">Net Income</span>
          <span className={`text-sm font-semibold ${netIncome >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
            {peso(netIncome)}
          </span>
        </div>
        <div className="flex justify-between items-center py-1">
          <span className="text-sm text-muted-foreground">Net VAT Payable</span>
          <span className="text-sm font-bold">{peso(preview.netVat)}</span>
        </div>
      </div>

      {/* Empty state */}
      {preview.invoiceCount === 0 && preview.expenseCount === 0 && (
        <p className="text-xs text-center text-muted-foreground py-2">
          No transactions recorded for this quarter yet.
        </p>
      )}
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm py-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? 'font-semibold' : ''}>{value}</span>
    </div>
  )
}

export default function CpaClient({
  accountantEmail, assignedCpaEmail, nextSend, logs, currentPreview, previousPreview,
}: Props) {
  const [sending, setSending] = useState(false)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [flash, setFlash] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'current' | 'previous'>('current')
  const [downloadsOpen, setDownloadsOpen] = useState(false)

  const recipientEmail = assignedCpaEmail ?? accountantEmail
  const shownPreview = activeTab === 'current' ? currentPreview : previousPreview

  async function sendNow(logId?: string) {
    if (logId) setResendingId(logId)
    else setSending(true)
    setFlash(null)
    try {
      const res = await fetch('/api/reports/quarterly')
      if (res.ok) {
        setFlash({ type: 'ok', msg: 'Report sent successfully.' })
        setTimeout(() => window.location.reload(), 1200)
      } else {
        const body = await res.json().catch(() => ({})) as { error?: string }
        setFlash({ type: 'err', msg: body.error ?? 'Failed to send report.' })
      }
    } catch {
      setFlash({ type: 'err', msg: 'Network error. Please try again.' })
    } finally {
      setSending(false)
      setResendingId(null)
    }
  }

  // No CPA configured
  if (!recipientEmail) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-bold">CPA Reports</h1>

        {/* Still show the preview so numbers are never hidden */}
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b">
            <p className="font-semibold">Quarter Preview</p>
            <p className="text-xs text-muted-foreground mt-0.5">{currentPreview.label} — current quarter</p>
          </div>
          <div className="px-5 py-4">
            <QuarterSummary preview={currentPreview} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3">
          <p className="font-semibold text-base">No accountant configured</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Add your accountant&apos;s email in Settings and we&apos;ll automatically send them a
            complete BIR-ready quarterly report — SLSP Sales, SLSP Purchases, and QAP files included.
          </p>
          <p className="text-xs text-muted-foreground">
            Reports are sent automatically on: Jan 1, Apr 1, Jul 1, Oct 1
          </p>
          <Link href="/settings">
            <Button className="w-full min-h-[48px] mt-1">Go to Settings</Button>
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-2">
          <p className="font-semibold text-sm">Need a CPA?</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Sigurado offers a partner CPA add-on — your records get automatically reviewed and filed every quarter.
          </p>
          <a href="mailto:hello@sigurado.xyz?subject=CPA Partner Inquiry" className="text-sm text-primary underline underline-offset-4">
            Contact us to learn more
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">CPA Reports</h1>

      {/* CPA info */}
      <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-2">
        {assignedCpaEmail ? (
          <>
            <span className="text-xs font-semibold bg-primary/10 text-primary rounded-full px-2.5 py-0.5 self-start">
              Sigurado Partner CPA
            </span>
            <p className="text-sm text-muted-foreground">{assignedCpaEmail}</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-muted-foreground">Sending reports to</p>
            <p className="font-semibold text-base break-all">{accountantEmail}</p>
            <Link href="/settings" className="text-sm text-primary underline underline-offset-4">
              Change in Settings
            </Link>
          </>
        )}
      </div>

      {/* Quarter preview */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 pt-4 pb-3">
          <p className="font-semibold text-sm mb-3">Quarter Preview</p>

          {/* Tab toggle */}
          <div className="flex gap-1 bg-muted/40 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('current')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'current'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {currentPreview.label}
              <span className="ml-1.5 text-[10px] text-emerald-600 font-semibold">LIVE</span>
            </button>
            <button
              onClick={() => setActiveTab('previous')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'previous'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {previousPreview.label}
              <span className="ml-1.5 text-[10px] text-muted-foreground font-semibold">SENT</span>
            </button>
          </div>
        </div>

        <div className="px-5 pb-5 border-t border-border pt-4">
          <QuarterSummary preview={shownPreview} />
        </div>
      </div>

      {/* Download CSVs — collapsible */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <button
          onClick={() => setDownloadsOpen(o => !o)}
          className="w-full flex items-center justify-between px-5 py-4 text-left min-h-[56px]"
        >
          <div>
            <p className="font-semibold text-sm">Download Reports</p>
            <p className="text-xs text-muted-foreground">{previousPreview.label} — BIR-ready CSV files</p>
          </div>
          {downloadsOpen
            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground" />
          }
        </button>
        {downloadsOpen && (
          <div className="px-5 pb-5 border-t border-border pt-4 flex flex-col gap-2">
            <DownloadButton type="slsp-sales"     label="SLSP Sales — invoices list" />
            <DownloadButton type="slsp-purchases" label="SLSP Purchases — expenses list" />
            {previousPreview.hasQap     && <DownloadButton type="qap"     label="QAP — EWT payees" />}
            {previousPreview.hasPayroll && <DownloadButton type="payroll" label="Payroll summary" />}
          </div>
        )}
      </div>

      {/* Next send + manual trigger */}
      <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">Next automatic send</p>
        <p className="text-lg font-bold">{formatDate(nextSend.date)}</p>
        <p className="text-sm text-muted-foreground">{nextSend.label} report</p>

        {flash && (
          <div className={`rounded-xl px-4 py-3 text-sm text-center ${
            flash.type === 'ok'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-destructive/10 border border-destructive/20 text-destructive'
          }`}>
            {flash.msg}
          </div>
        )}

        <Button
          onClick={() => sendNow()}
          disabled={sending}
          variant="outline"
          className="w-full min-h-[48px]"
        >
          {sending ? 'Sending…' : `Send ${previousPreview.label} report now`}
        </Button>
      </div>

      {/* Send history */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Send History</p>
        {logs.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">
            No reports sent yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {logs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-border bg-card px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${log.status === 'SENT' ? 'text-green-600' : 'text-destructive'}`}>
                      {log.status === 'SENT' ? '✓' : '✗'}
                    </span>
                    <span className="font-medium text-sm">Q{log.quarter} {log.year}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(log.sentAt)}</span>
                  {log.status === 'FAILED' && log.errorMessage && (
                    <span className="text-xs text-destructive truncate">{log.errorMessage}</span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={resendingId === log.id}
                  onClick={() => sendNow(log.id)}
                  className="shrink-0 min-h-[40px] text-xs"
                >
                  {resendingId === log.id ? 'Sending…' : 'Resend'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
