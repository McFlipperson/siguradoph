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

interface Props {
  accountantEmail: string | null
  assignedCpaEmail: string | null
  nextSend: NextSend
  logs: Log[]
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function CpaClient({ accountantEmail, assignedCpaEmail, nextSend, logs }: Props) {
  const [sending, setSending] = useState(false)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [flash, setFlash] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  const recipientEmail = assignedCpaEmail ?? accountantEmail

  async function sendNow(logId?: string) {
    if (logId) setResendingId(logId)
    else setSending(true)
    setFlash(null)

    try {
      const res = await fetch('/api/reports/quarterly')
      if (res.ok) {
        setFlash({ type: 'ok', msg: 'Report sent successfully.' })
        // Reload to refresh logs
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
          <a
            href={`mailto:hello@sigurado.xyz?subject=CPA Partner Inquiry`}
            className="text-sm text-primary underline underline-offset-4"
          >
            Contact us to learn more
          </a>
        </div>
      </div>
    )
  }

  // State A / B — CPA configured (own email or assigned)
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">CPA Reports</h1>

      {/* CPA info card */}
      <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
        {assignedCpaEmail ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold bg-primary/10 text-primary rounded-full px-2.5 py-0.5">
                Sigurado Partner CPA
              </span>
            </div>
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

      {/* Next send */}
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
          {sending ? 'Sending…' : `Send ${nextSend.label} report now`}
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
              <div
                key={log.id}
                className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        log.status === 'SENT' ? 'text-green-600' : 'text-destructive'
                      }`}
                    >
                      {log.status === 'SENT' ? '✓' : '✗'}
                    </span>
                    <span className="font-medium text-sm">Q{log.quarter} {log.year}</span>
                  </div>
                  <span className="text-xs text-muted-foreground truncate">{formatDate(log.sentAt)}</span>
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
