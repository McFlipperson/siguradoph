'use client'

import { useState } from 'react'
import { toast } from 'sonner'

type UnlinkedRow = { id: string; psid: string; receivedAt: string }
type ReminderRow = {
  id: string
  patientName: string
  reminderType: string
  scheduledFor: string
  status: string
  sentAt: string | null
}
type PatientOption = { id: string; firstName: string; lastName: string }

const TYPE_LABELS: Record<string, string> = {
  APPOINTMENT:     'Appointment',
  CLEANING_RECALL: 'Cleaning Recall',
  BRACES_ALIGNMENT:'Braces Alignment',
}
const TYPE_COLORS: Record<string, string> = {
  APPOINTMENT:     'bg-blue-100 text-blue-700',
  CLEANING_RECALL: 'bg-green-100 text-green-700',
  BRACES_ALIGNMENT:'bg-purple-100 text-purple-700',
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
  unlinked: initialUnlinked,
  reminders: initialReminders,
  patients,
}: {
  clinic: { name: string; facebookPageUrl: string | null; messengerConfigured: boolean }
  unlinked: UnlinkedRow[]
  reminders: ReminderRow[]
  patients: PatientOption[]
}) {
  const [unlinked, setUnlinked] = useState<UnlinkedRow[]>(initialUnlinked)
  const [reminders, setReminders] = useState<ReminderRow[]>(initialReminders)

  // Link sheet state
  const [linkingRow, setLinkingRow] = useState<UnlinkedRow | null>(null)
  const [patientSearch, setPatientSearch] = useState('')
  const [linking, setLinking] = useState(false)

  // Processing state
  const [processing, setProcessing] = useState(false)

  // History toggle
  const [showHistory, setShowHistory] = useState(false)

  const pending = reminders.filter((r) => r.status === 'PENDING')
  const history = reminders.filter((r) => r.status !== 'PENDING')

  const filteredPatients = patients.filter((p) => {
    const name = `${p.firstName} ${p.lastName}`.toLowerCase()
    return name.includes(patientSearch.toLowerCase())
  })

  async function handleLink(patientId: string) {
    if (!linkingRow) return
    setLinking(true)
    try {
      const res = await fetch('/api/messenger/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unlinkedId: linkingRow.id, patientId }),
      })
      const data = await res.json() as { ok?: boolean; patient?: { firstName: string; lastName: string }; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to link')
      toast.success(`Messenger linked to ${data.patient?.firstName} ${data.patient?.lastName}`)
      setUnlinked((prev) => prev.filter((u) => u.id !== linkingRow.id))
      setLinkingRow(null)
      setPatientSearch('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to link')
    } finally {
      setLinking(false)
    }
  }

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
      toast.success(`Processed ${data.processed} reminder${data.processed !== 1 ? 's' : ''} — ${data.sent} sent, ${data.failed} failed`)
      // Refresh the list
      const refreshed = await fetch('/api/reminders/list').then((r) => r.json()).catch(() => null)
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
            Add <code className="bg-muted px-1 rounded">FACEBOOK_PAGE_ACCESS_TOKEN</code> to your Vercel environment variables to activate Messenger reminders.
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          To link a patient&apos;s Messenger, have them send any message to your clinic&apos;s Facebook Page. Their message will appear below.
        </p>

        {clinic.facebookPageUrl && (
          <a
            href={clinic.facebookPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-primary font-medium"
          >
            Open Clinic Facebook Page ↗
          </a>
        )}

        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Webhook setup (one-time):</p>
          <p>In Meta Developers → your app → Messenger → Webhooks</p>
          <p>Callback URL: <code className="bg-muted px-1 rounded">https://sigurado.xyz/api/messenger/webhook</code></p>
          <p>Verify token: your <code className="bg-muted px-1 rounded">FACEBOOK_VERIFY_TOKEN</code> env var value</p>
        </div>
      </section>

      {/* ── B. UNLINKED MESSAGES ── */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          New Messenger Messages ({unlinked.length})
        </h2>

        {unlinked.length === 0 ? (
          <div className="rounded-xl border bg-background p-4 text-center text-sm text-muted-foreground">
            No new messages waiting to be linked.
          </div>
        ) : (
          <div className="space-y-2">
            {unlinked.map((row) => (
              <div key={row.id} className="rounded-xl border bg-background p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Received {fmt(row.receivedAt)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    PSID: {row.psid.slice(0, 8)}…
                  </p>
                </div>
                <button
                  onClick={() => { setLinkingRow(row); setPatientSearch('') }}
                  className="min-h-[40px] px-4 rounded-lg bg-primary text-primary-foreground text-xs font-medium shrink-0"
                >
                  Link to Patient
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── C. SCHEDULED REMINDERS ── */}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Upcoming Reminders ({pending.length})
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
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{r.patientName}</p>
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[r.reminderType] ?? 'bg-muted text-muted-foreground'}`}>
                            {TYPE_LABELS[r.reminderType] ?? r.reminderType}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status] ?? 'bg-muted text-muted-foreground'}`}>
                            {r.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {r.sentAt ? `Sent ${fmt(r.sentAt)}` : `Scheduled ${fmt(r.scheduledFor)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── LINK PATIENT SHEET ── */}
      {linkingRow && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setLinkingRow(null); setPatientSearch('') }} />
          <div className="relative rounded-t-2xl bg-background max-h-[80vh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="flex items-center justify-between px-4 pb-3">
              <h2 className="text-base font-semibold">Link Messenger to Patient</h2>
              <button onClick={() => { setLinkingRow(null); setPatientSearch('') }} className="p-2 text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
            </div>
            <div className="px-4 pb-2">
              <input
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Search patient name…"
                className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto px-4 pb-6 space-y-2 flex-1">
              {filteredPatients.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">No patients found</p>
              )}
              {filteredPatients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleLink(p.id)}
                  disabled={linking}
                  className="w-full min-h-[48px] text-left px-4 py-3 rounded-lg border bg-background hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {p.lastName}, {p.firstName}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
