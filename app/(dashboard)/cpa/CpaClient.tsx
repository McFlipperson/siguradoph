'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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
  preview: Preview
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
}

function peso(n: number) {
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

function DownloadButton({ type, label }: { type: string; label: string }) {
  return (
    <a
      href={`/api/reports/quarterly/download?type=${type}`}
      download
      className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors min-h-[48px]"
    >
      <span>{label}</span>
      <span className="text-xs text-muted-foreground ml-2">↓ CSV</span>
    </a>
  )
}

export default function CpaClient({ accountantEmail, assignedCpaEmail, nextSend, logs, preview }: Props) {
  const [sending, setSending] = useState(false)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [flash, setFlash] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const recipientEmail = assignedCpaEmail ?? accountantEmail

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
        const body = await res.json().catch(() => ({}))
        setFlash({ type: 'err', msg: body.error ?? 'Failed to send report.' })
      }
    } catch {
      setFlash({ type: 'err', msg: 'Network error. Please try again.' })
    } finally {
      setSending(false)
      setResendingId(null)
    }
  }

  // State C — no CPA configured
  if (!recipientEmail) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-bold">CPA Reports</h1>
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
          <p className="font-semibold text-base">No accountant configured</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Add your accountant&apos;s email in Settings and we&apos;ll automatically send them a complete BIR-ready quarterly report — SLSP Sales, SLSP Purchases, and QAP files included.
          </p>
          <p className="text-xs text-muted-foreground">
            Reports are sent automatically on: Jan 1, Apr 1, Jul 1, Oct 1
          </p>
          <Link href="/settings">
            <Button className="w-full min-h-[48px] mt-1">Go to Settings</Button>
          </Link>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-2">
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
      <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
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

      {/* Report preview */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <button
          onClick={() => setPreviewOpen((o) => !o)}
          className="w-full flex items-center justify-between px-5 py-4 text-left min-h-[56px]"
        >
          <div>
            <p className="font-semibold text-sm">Report Preview</p>
            <p className="text-xs text-muted-foreground">{preview.label} — review before sending</p>
          </div>
          <span className="text-muted-foreground text-lg leading-none">{previewOpen ? '−' : '+'}</span>
        </button>

        {previewOpen && (
          <div className="px-5 pb-5 flex flex-col gap-4 border-t border-border">

            {/* Summary numbers */}
            <div className="flex flex-col gap-1 pt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Revenue ({preview.invoiceCount} invoices)</p>
              <div className="flex justify-between text-sm py-1 border-b border-border/50">
                <span className="text-muted-foreground">Gross Sales</span>
                <span className="font-medium">{peso(preview.grossSales)}</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b border-border/50">
                <span className="text-muted-foreground">Net Sales (ex. VAT)</span>
                <span>{peso(preview.netSales)}</span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-muted-foreground">Output VAT (12%)</span>
                <span>{peso(preview.outputVat)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Expenses ({preview.expenseCount} entries)</p>
              <div className="flex justify-between text-sm py-1 border-b border-border/50">
                <span className="text-muted-foreground">Total Expenses</span>
                <span className="font-medium">{peso(preview.totalExpenses)}</span>
              </div>
              <div className="flex justify-between text-sm py-1">
                <span className="text-muted-foreground">Input VAT (claimable)</span>
                <span>{peso(preview.inputVat)}</span>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 flex justify-between items-center">
              <span className="text-sm font-semibold">Net VAT Payable</span>
              <span className="text-base font-bold">{peso(preview.netVat)}</span>
            </div>

            {/* Download CSVs */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Download &amp; Review</p>
              <DownloadButton type="slsp-sales"     label="SLSP Sales — invoices list" />
              <DownloadButton type="slsp-purchases" label="SLSP Purchases — expenses list" />
              {preview.hasQap     && <DownloadButton type="qap"     label="QAP — EWT payees" />}
              {preview.hasPayroll && <DownloadButton type="payroll" label="Payroll summary" />}
            </div>
          </div>
        )}
      </div>

      {/* Next send + manual trigger */}
      <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
        <p className="text-sm font-medium text-muted-foreground">Next automatic send</p>
        <p className="text-lg font-bold">{formatDate(nextSend.date)}</p>
        <p className="text-sm text-muted-foreground">{nextSend.label} report</p>

        {flash && (
          <div className={`rounded-lg px-4 py-3 text-sm text-center ${
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
          {sending ? 'Sending…' : `Send ${preview.label} report now`}
        </Button>
      </div>

      {/* Send history */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Send History</p>

        {logs.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-5 text-center text-sm text-muted-foreground">
            No reports sent yet.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {logs.map((log) => (
              <div key={log.id} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between gap-3">
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
