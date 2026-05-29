'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { saveMessengerConfig } from './actions'

// ─── Types ────────────────────────────────────────────────────────────────────

type ReminderRow = {
  id: string
  patientName: string
  reminderType: string
  scheduledFor: string
  status: string
  sentAt: string | null
}

type ChannelStats = { MESSENGER: number; EMAIL: number; SMS: number; NONE: number }

type UnlinkedMessage = { id: string; psid: string; createdAt: string }

type PatientResult = { id: string; firstName: string; lastName: string; phone: string }

type ClinicConfig = {
  name: string
  facebookPageUrl: string
  messengerPageId: string
  hasMessengerToken: boolean
  messengerConfigured: boolean
}

// ─── Constants ────────────────────────────────────────────────────────────────

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
  return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// ─── Messenger setup form ─────────────────────────────────────────────────────

function MessengerSetupForm({
  clinic,
  onSaved,
}: {
  clinic: ClinicConfig
  onSaved: () => void
}) {
  const [token, setToken] = useState('')
  const [pageId, setPageId] = useState(clinic.messengerPageId)
  const [pageUrl, setPageUrl] = useState(clinic.facebookPageUrl)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    if (!token.trim() && !clinic.hasMessengerToken) {
      toast.error('Please enter your Page Access Token')
      return
    }
    startTransition(async () => {
      try {
        await saveMessengerConfig({
          // empty string means "keep existing" — server ignores blanks
          messengerToken:  token.trim() || '___keep___',
          messengerPageId: pageId,
          facebookPageUrl: pageUrl,
        })
        toast.success('Messenger settings saved')
        onSaved()
      } catch {
        toast.error('Failed to save settings')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Page Access Token
          {clinic.hasMessengerToken && (
            <span className="ml-2 text-xs text-emerald-600 font-normal">● Saved</span>
          )}
        </label>
        <input
          type="password"
          className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
          placeholder={clinic.hasMessengerToken ? '••••••••••••  (leave blank to keep current)' : 'Paste your token here'}
          value={token}
          onChange={(e) => setToken(e.target.value)}
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          From Meta Developers → your app → Messenger → Access Tokens
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Page ID</label>
        <input
          className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="e.g. 123456789012345"
          value={pageId}
          onChange={(e) => setPageId(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Found on your Facebook Page → About → Page transparency
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Facebook Page URL</label>
        <input
          className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="https://facebook.com/yourclinic"
          value={pageUrl}
          onChange={(e) => setPageUrl(e.target.value)}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full min-h-[52px] rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
      >
        {isPending ? 'Saving…' : 'Save Messenger Settings'}
      </button>
    </div>
  )
}

// ─── Unlinked message card ─────────────────────────────────────────────────────

function UnlinkedCard({ msg, onLinked }: { msg: UnlinkedMessage; onLinked: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PatientResult[]>([])
  const [searching, setSearching] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<PatientResult | null>(null)

  async function handleSearch(value: string) {
    setQuery(value)
    setSelected(null)
    if (value.length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/patients/search?q=${encodeURIComponent(value)}`)
      setResults(await res.json() as PatientResult[])
    } finally { setSearching(false) }
  }

  function handleLink() {
    if (!selected) return
    startTransition(async () => {
      const res = await fetch('/api/messenger/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unlinkedId: msg.id, patientId: selected.id }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok) { toast.error(data.error ?? 'Failed to link'); return }
      toast.success(`Linked to ${selected.firstName} ${selected.lastName}`)
      onLinked(msg.id)
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

      {selected ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-sm font-medium">{selected.firstName} {selected.lastName}</p>
            <p className="text-xs text-muted-foreground">{selected.phone}</p>
          </div>
          <button onClick={() => { setSelected(null); setQuery(''); setResults([]) }}
            className="text-xs text-muted-foreground hover:text-foreground px-2 min-h-[40px]">✕</button>
        </div>
      ) : (
        <div className="relative">
          <input type="search" placeholder="Search patient name or phone…"
            value={query} onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring min-h-[44px]"
          />
          {searching && <p className="text-xs text-muted-foreground mt-1 px-1">Searching…</p>}
          {results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border bg-background shadow-md overflow-hidden">
              {results.map((p) => (
                <button key={p.id} type="button" onClick={() => { setSelected(p); setResults([]) }}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted border-b last:border-0 min-h-[44px]">
                  <p className="font-medium">{p.firstName} {p.lastName}</p>
                  <p className="text-xs text-muted-foreground">{p.phone}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <button onClick={handleLink} disabled={!selected || isPending}
        className="w-full min-h-[48px] rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40">
        {isPending ? 'Linking…' : 'Link to Patient'}
      </button>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RemindersClient({
  clinic: initialClinic,
  reminders: initialReminders,
  channelStats,
  unlinkedMessages: initialUnlinked,
}: {
  clinic: ClinicConfig
  reminders: ReminderRow[]
  channelStats: ChannelStats
  unlinkedMessages: UnlinkedMessage[]
}) {
  const [reminders, setReminders] = useState(initialReminders)
  const [unlinked, setUnlinked] = useState(initialUnlinked)
  const [clinic, setClinic] = useState(initialClinic)
  const [processing, setProcessing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showMessengerSetup, setShowMessengerSetup] = useState(false)

  const pending = reminders.filter((r) => r.status === 'PENDING')
  const history = reminders.filter((r) => r.status !== 'PENDING')

  async function handleCancel(id: string) {
    const res = await fetch(`/api/reminders/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Failed to cancel'); return }
    setReminders((prev) => prev.filter((r) => r.id !== id))
    toast.success('Reminder cancelled')
  }

  async function handleSendNow() {
    setProcessing(true)
    try {
      const res = await fetch('/api/reminders/process', { method: 'POST' })
      const data = await res.json() as { processed?: number; sent?: number; failed?: number; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      toast.success(
        `Processed ${data.processed ?? 0} — ${data.sent ?? 0} sent, ${data.failed ?? 0} failed`
      )
      const refreshed = await fetch('/api/reminders/list').then((r) => r.json() as Promise<ReminderRow[]>).catch(() => null)
      if (refreshed) setReminders(refreshed)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setProcessing(false)
    }
  }

  // ── Channel status cards ──────────────────────────────────────────────────

  const channels = [
    {
      key: 'MESSENGER',
      emoji: '📱',
      label: 'Messenger',
      count: channelStats.MESSENGER,
      active: clinic.messengerConfigured,
      actionLabel: clinic.messengerConfigured ? 'Edit setup' : 'Set up →',
      onAction: () => setShowMessengerSetup((v) => !v),
    },
    {
      key: 'EMAIL',
      emoji: '📧',
      label: 'Email',
      count: channelStats.EMAIL,
      active: true, // Resend always available
      actionLabel: null,
      onAction: null,
    },
    {
      key: 'SMS',
      emoji: '📞',
      label: 'SMS',
      count: channelStats.SMS,
      active: false,
      actionLabel: 'Coming soon',
      onAction: null,
      comingSoon: true,
    },
  ]

  return (
    <div className="space-y-5 pb-8">
      <h1 className="text-xl font-bold">Reminders</h1>

      {/* ── 1. CHANNEL STATUS CARDS ── */}
      <section className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Notification Channels
        </p>

        <div className="space-y-2">
          {channels.map((ch) => (
            <div key={ch.key} className="rounded-xl border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl shrink-0">{ch.emoji}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{ch.label}</span>
                      {ch.comingSoon ? (
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          Coming soon
                        </span>
                      ) : ch.active ? (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          Setup needed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ch.count} patient{ch.count !== 1 ? 's' : ''} using this channel
                    </p>
                  </div>
                </div>
                {ch.actionLabel && (
                  <button
                    onClick={ch.onAction ?? undefined}
                    disabled={ch.comingSoon}
                    className={[
                      'shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg min-h-[36px] transition-colors',
                      ch.comingSoon
                        ? 'text-muted-foreground cursor-default'
                        : ch.active
                          ? 'border border-border text-foreground hover:bg-muted'
                          : 'bg-primary text-primary-foreground',
                    ].join(' ')}
                  >
                    {ch.actionLabel}
                  </button>
                )}
              </div>

              {/* Inline Messenger setup form */}
              {ch.key === 'MESSENGER' && showMessengerSetup && (
                <div className="mt-4 pt-4 border-t">
                  <MessengerSetupForm
                    clinic={clinic}
                    onSaved={() => {
                      setShowMessengerSetup(false)
                      setClinic((prev) => ({ ...prev, hasMessengerToken: true, messengerConfigured: true }))
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. UPCOMING REMINDERS ── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Upcoming ({pending.length})
          </p>
          <button
            onClick={handleSendNow}
            disabled={processing || pending.length === 0}
            className="min-h-[36px] px-4 rounded-lg border text-xs font-medium disabled:opacity-40 hover:bg-muted transition-colors"
          >
            {processing ? 'Sending…' : 'Send Now'}
          </button>
        </div>

        {pending.length === 0 ? (
          <div className="rounded-xl border bg-background p-5 text-center text-sm text-muted-foreground">
            No upcoming reminders scheduled.
          </div>
        ) : (
          <div className="space-y-2">
            {pending.map((r) => (
              <div key={r.id} className="rounded-xl border bg-background p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{r.patientName}</p>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[r.reminderType] ?? 'bg-muted text-muted-foreground'}`}>
                        {TYPE_LABELS[r.reminderType] ?? r.reminderType}
                      </span>
                      <span className="text-xs text-muted-foreground">{fmtDateTime(r.scheduledFor)}</span>
                    </div>
                  </div>
                  <button onClick={() => handleCancel(r.id)}
                    className="text-xs text-muted-foreground hover:text-red-600 min-h-[36px] px-2 shrink-0">
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* History toggle */}
        {history.length > 0 && (
          <div className="mt-2">
            <button onClick={() => setShowHistory((v) => !v)}
              className="text-xs text-muted-foreground font-medium flex items-center gap-1 min-h-[36px]">
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
                      {r.sentAt ? `Sent ${fmtDateTime(r.sentAt)}` : `Scheduled for ${fmtDateTime(r.scheduledFor)}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── 3. ADVANCED (collapsed) ── */}
      <section>
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="w-full flex items-center justify-between gap-2 rounded-xl border bg-background px-4 py-3.5 text-sm font-medium"
        >
          <span>Advanced</span>
          <span className="text-muted-foreground text-xs">{showAdvanced ? '▾' : '▸'}</span>
        </button>

        {showAdvanced && (
          <div className="mt-2 rounded-xl border bg-background p-4 space-y-5">

            {/* Webhook URL */}
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Messenger Webhook URL</p>
              <p className="text-xs text-muted-foreground">
                Paste this once into Meta Developers → Webhooks → Callback URL
              </p>
              <div className="rounded-lg bg-muted/60 px-3 py-2.5 font-mono text-xs break-all select-all">
                https://sigurado.xyz/api/messenger/webhook
              </div>
            </div>

            {/* Unlinked messages */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Unlinked Messenger Contacts</p>
                {unlinked.length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                    {unlinked.length}
                  </span>
                )}
              </div>
              {unlinked.length === 0 ? (
                <p className="text-sm text-muted-foreground">None — all Messenger contacts are linked.</p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    These patients messaged the clinic page without scanning their QR code. Search for their name to connect them.
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
            </div>

            {/* Cron note */}
            <p className="text-xs text-muted-foreground border-t pt-3">
              Reminders run automatically at 8:00 AM daily (Manila time). Use &quot;Send Now&quot; above to dispatch due reminders immediately.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
