'use client'

import { useState, useTransition } from 'react'
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

type UnlinkedMessage = {
  id: string
  psid: string
  createdAt: string
}

type PatientResult = {
  id: string
  firstName: string
  lastName: string
  phone: string
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

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// ─── Unlinked message card with inline patient search ─────────────────────────
function UnlinkedCard({
  msg,
  onLinked,
}: {
  msg: UnlinkedMessage
  onLinked: (id: string) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PatientResult[]>([])
  const [searching, setSearching] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null)

  async function handleSearch(value: string) {
    setQuery(value)
    setSelectedPatient(null)
    if (value.length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/patients/search?q=${encodeURIComponent(value)}`)
      const data = await res.json() as PatientResult[]
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }

  function handleLink() {
    if (!selectedPatient) return
    startTransition(async () => {
      try {
        const res = await fetch('/api/messenger/link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unlinkedId: msg.id, patientId: selectedPatient.id }),
        })
        const data = await res.json() as { ok?: boolean; error?: string }
        if (!res.ok) throw new Error(data.error ?? 'Failed to link')
        toast.success(`Linked to ${selectedPatient.firstName} ${selectedPatient.lastName}`)
        onLinked(msg.id)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Link failed')
      }
    })
  }

  return (
    <div className="rounded-xl border bg-background p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Messenger PSID</p>
          <p className="font-mono text-sm font-semibold truncate max-w-[200px]">{msg.psid}</p>
        </div>
        <p className="text-xs text-muted-foreground whitespace-nowrap">{fmtDate(msg.createdAt)}</p>
      </div>

      {selectedPatient ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-sm font-medium">{selectedPatient.firstName} {selectedPatient.lastName}</p>
            <p className="text-xs text-muted-foreground">{selectedPatient.phone}</p>
          </div>
          <button
            onClick={() => { setSelectedPatient(null); setQuery(''); setResults([]) }}
            className="text-xs text-muted-foreground hover:text-foreground px-2 min-h-[40px]"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="search"
            placeholder="Search patient name or phone…"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
          />
          {searching && (
            <p className="text-xs text-muted-foreground mt-1 px-1">Searching…</p>
          )}
          {results.length > 0 && !selectedPatient && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border bg-background shadow-md overflow-hidden">
              {results.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setSelectedPatient(p); setResults([]) }}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted border-b last:border-0 min-h-[44px]"
                >
                  <p className="font-medium">{p.firstName} {p.lastName}</p>
                  <p className="text-xs text-muted-foreground">{p.phone}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleLink}
        disabled={!selectedPatient || isPending}
        className="w-full min-h-[48px] rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40"
      >
        {isPending ? 'Linking…' : 'Link to Patient'}
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RemindersClient({
  clinic,
  reminders: initialReminders,
  channelStats,
  unlinkedMessages: initialUnlinked,
}: {
  clinic: {
    name: string
    facebookPageUrl: string | null
    messengerPageId: string | null
    messengerConfigured: boolean
  }
  reminders: ReminderRow[]
  channelStats: ChannelStats
  unlinkedMessages: UnlinkedMessage[]
}) {
  const [reminders, setReminders] = useState<ReminderRow[]>(initialReminders)
  const [unlinked, setUnlinked] = useState<UnlinkedMessage[]>(initialUnlinked)
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

      {/* ── 1. MESSENGER SETUP ── */}
      <section className="rounded-xl border bg-background p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${clinic.messengerConfigured ? 'bg-green-500' : 'bg-yellow-400'}`} />
          <span className="font-semibold text-sm">
            Messenger {clinic.messengerConfigured ? 'Connected' : 'Not Configured'}
          </span>
        </div>

        {!clinic.messengerConfigured && (
          <p className="text-xs text-muted-foreground">
            Add <code className="bg-muted px-1 rounded">FACEBOOK_PAGE_ACCESS_TOKEN</code> to your Vercel environment variables to enable Messenger sending.
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
          <p className="font-medium text-foreground">Webhook (one-time setup in Meta Developers):</p>
          <p className="font-mono break-all select-all">https://sigurado.xyz/api/messenger/webhook</p>
          {clinic.messengerPageId && (
            <p className="mt-1">
              Patient QR links use:{' '}
              <span className="font-mono">m.me/{clinic.messengerPageId}?ref=patient_ID</span>
            </p>
          )}
        </div>
      </section>

      {/* ── 2. CHANNEL STATS ── */}
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
            <div
              key={stat.label}
              className="rounded-xl border bg-background p-3 flex items-center justify-between gap-2"
            >
              <span className="text-xs font-medium">{stat.label}</span>
              <span className={`text-lg font-bold tabular-nums ${stat.color}`}>{stat.count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. UNLINKED MESSAGES ── */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Unlinked Messages
          </h2>
          {unlinked.length > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
              {unlinked.length}
            </span>
          )}
        </div>

        {unlinked.length === 0 ? (
          <div className="rounded-xl border bg-background p-4 text-center text-sm text-muted-foreground">
            No unlinked Messenger contacts.
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground px-0.5">
              These patients messaged the clinic page but weren&apos;t linked via QR code. Search for their name to connect them.
            </p>
            <div className="space-y-2">
              {unlinked.map((msg) => (
                <UnlinkedCard
                  key={msg.id}
                  msg={msg}
                  onLinked={(id) => setUnlinked((prev) => prev.filter((u) => u.id !== id))}
                />
              ))}
            </div>
          </>
        )}
      </section>

      {/* ── 4. SCHEDULED REMINDERS ── */}
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
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[r.reminderType] ?? 'bg-muted text-muted-foreground'}`}
                      >
                        {TYPE_LABELS[r.reminderType] ?? r.reminderType}
                      </span>
                      <span className="text-xs text-muted-foreground">{fmtDateTime(r.scheduledFor)}</span>
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
              className="text-xs text-muted-foreground font-medium flex items-center gap-1 min-h-[36px]"
            >
              {showHistory ? '▾' : '▸'} History ({history.length})
            </button>

            {showHistory && (
              <div className="mt-2 space-y-2">
                {history.map((r) => (
                  <div key={r.id} className="rounded-xl border bg-background p-4 opacity-70">
                    <p className="font-medium text-sm">{r.patientName}</p>
                    <div className="flex flex-wrap gap-2 items-center mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[r.reminderType] ?? 'bg-muted text-muted-foreground'}`}
                      >
                        {TYPE_LABELS[r.reminderType] ?? r.reminderType}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] ?? 'bg-muted text-muted-foreground'}`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {r.sentAt ? `Sent ${fmtDateTime(r.sentAt)}` : `Scheduled ${fmtDateTime(r.scheduledFor)}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <p className="text-xs text-muted-foreground text-center px-2">
        Reminders run automatically at 8:00 AM daily. Tap &quot;Send Now&quot; to dispatch due reminders immediately.
      </p>
    </div>
  )
}
