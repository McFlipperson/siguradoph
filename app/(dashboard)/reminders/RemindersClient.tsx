'use client'

import { useState } from 'react'
import { toast } from 'sonner'

type ReminderRow = {
  id: string
  patientName: string
  reminderType: string
  scheduledFor: string
  status: string
  sentAt: string | null
}

type ChannelStats = {
  MESSENGER: number
  EMAIL: number
  SMS: number
  NONE: number
}

const TYPE_LABELS: Record<string, string> = {
  APPOINTMENT:      'Appointment',
  CLEANING_RECALL:  'Cleaning Recall',
  BRACES_ALIGNMENT: 'Braces Alignment',
}
const TYPE_COLORS: Record<string, string> = {
  APPOINTMENT:      'bg-blue-100 text-blue-700',
  CLEANING_RECALL:  'bg-green-100 text-green-700',
  BRACES_ALIGNMENT: 'bg-purple-100 text-purple-700',
}
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  SENT:    'bg-green-100 text-green-700',
  FAILED:  'bg-red-100 text-red-700',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function RemindersClient({
  clinic,
  reminders: initialReminders,
  channelStats,
}: {
  clinic: { name: string; facebookPageUrl: string | null; messengerConfigured: boolean }
  reminders: ReminderRow[]
  channelStats: ChannelStats
}) {
  const [reminders, setReminders] = useState<ReminderRow[]>(initialReminders)
  const [processing, setProcessing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const pending = reminders.filter((r) => r.status === 'PENDING')
  const history = reminders.filter((r) => r.status !== 'PENDING')

  async function handleCancel(id: string) {
    try {
      const res = await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to cancel')
      setReminders((prev) => prev.filter((r) => r.id !== id))
      toast.success('Reminder cancelled')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel')
    }
  }

  async function handleSendNow() {
    setProcessing(true)
    try {
      const res = await fetch('/api/reminders/process', { method: 'POST' })
      const data = await res.json() as { processed?: number; sent?: number; failed?: number; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      toast.success(
        `Processed ${data.processed ?? 0} reminder${data.processed !== 1 ? 's' : ''} — ` +
        `${data.sent ?? 0} sent, ${data.failed ?? 0} failed`
      )
      // Refresh reminder list
      const refreshed = await fetch('/api/reminders/list').then((r) => r.json() as Promise<ReminderRow[]>).catch(() => null)
      if (refreshed) setReminders(refreshed)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Processing failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-5 pb-8">
      <h1 className="text-xl font-bold">Reminders</h1>

      {/* ── A. MESSENGER SETUP ── */}
      <section className="rounded-xl border bg-background p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${clinic.messengerConfigured ? 'bg-green-500' : 'bg-yellow-400'}`} />
          <span className="font-semibold text-sm">
            Messenger {clinic.messengerConfigured ? 'Connected' : 'Not Configured'}
          </span>
        </div>

        {!clinic.messengerConfigured && (
          <p className="text-xs text-muted-foreground">
            Add <code className="bg-muted px-1 rounded">FACEBOOK_PAGE_ACCESS_TOKEN</code> to Vercel environment variables to enable sending.
          </p>
        )}

        {clinic.facebookPageUrl && (
          <a
            href={clinic.facebookPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary font-medium"
          >
            Open Clinic Facebook Page ↗
          </a>
        )}

        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Webhook (one-time setup):</p>
          <p>Meta Developers → Messenger → Webhooks</p>
          <p className="font-mono break-all">https://sigurado.xyz/api/messenger/webhook</p>
        </div>
      </section>

      {/* ── CHANNEL STATS ── */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Patient Reminder Channels
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: '📱 Messenger', count: channelStats.MESSENGER, color: 'text-blue-600' },
            { label: '📧 Email',     count: channelStats.EMAIL,     color: 'text-green-600' },
            { label: '📞 SMS',       count: channelStats.SMS,       color: 'text-purple-600' },
            { label: '✕ None',       count: channelStats.NONE,      color: 'text-muted-foreground' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border bg-background p-3 flex items-center justify-between gap-2">
              <span className="text-xs font-medium">{stat.label}</span>
              <span className={`text-lg font-bold tabular-nums ${stat.color}`}>{stat.count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── B. SCHEDULED REMINDERS ── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Upcoming ({pending.length})
          </h2>
          <button
            onClick={handleSendNow}
            disabled={processing || pending.length === 0}
            className="min-h-[36px] px-4 rounded-lg border text-xs font-medium disabled:opacity-50"
          >
            {processing ? 'Processing…' : 'Send Now'}
          </button>
        </div>

        {pending.length === 0 ? (
          <div className="rounded-xl border bg-background p-4 text-center text-sm text-muted-foreground">
            No upcoming reminders.
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((r) => (
              <div key={r.id} className="rounded-xl border bg-background p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1">
                    <p className="font-semibold text-sm">{r.patientName}</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[r.reminderType] ?? 'bg-muted text-muted-foreground'}`}>
                        {TYPE_LABELS[r.reminderType] ?? r.reminderType}
                      </span>
                      <span className="text-xs text-muted-foreground">{fmt(r.scheduledFor)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancel(r.id)}
                    className="text-xs text-muted-foreground hover:text-red-600 min-h-[36px] px-2"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="text-xs text-muted-foreground font-medium flex items-center gap-1"
            >
              {showHistory ? '▾' : '▸'} History ({history.length})
            </button>

            {showHistory && (
              <div className="mt-2 space-y-2">
                {history.map((r) => (
                  <div key={r.id} className="rounded-xl border bg-background p-4 opacity-70">
                    <p className="font-medium text-sm">{r.patientName}</p>
                    <div className="flex flex-wrap gap-2 items-center mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[r.reminderType] ?? 'bg-muted text-muted-foreground'}`}>
                        {TYPE_LABELS[r.reminderType] ?? r.reminderType}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] ?? 'bg-muted text-muted-foreground'}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {r.sentAt ? `Sent ${fmt(r.sentAt)}` : `Scheduled ${fmt(r.scheduledFor)}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <p className="text-xs text-muted-foreground text-center px-2">
        ⚠ Reminders run automatically every day at 8am. Tap &quot;Send Now&quot; to dispatch due reminders immediately.
      </p>
    </div>
  )
}
