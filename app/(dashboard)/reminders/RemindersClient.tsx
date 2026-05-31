'use client'

import { useState, useTransition, useEffect } from 'react'
import { toast } from 'sonner'
import { saveMessengerConfig, saveRecallRules } from './actions'
import type { RecallRuleRow } from './actions'

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
  SERVICE_RECALL:   'Care Follow-up',
}
const TYPE_COLORS: Record<string, string> = {
  APPOINTMENT:      'bg-blue-100 text-blue-700',
  CLEANING_RECALL:  'bg-green-100 text-green-700',
  BRACES_ALIGNMENT: 'bg-purple-100 text-purple-700',
  SERVICE_RECALL:   'bg-teal-100 text-teal-700',
}
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  SENT:    'bg-green-100 text-green-700',
  FAILED:  'bg-red-100 text-red-700',
}

// Human-readable category labels
const CATEGORY_LABELS: Record<string, string> = {
  EXTRACTION: 'Tooth Extractions',
  RCT:        'Root Canal',
  CLEANING:   'Cleaning',
  FILLING:    'Fillings',
  CROWN:      'Crowns',
  BRIDGE:     'Bridges',
  DENTURES:   'Dentures',
  BRACES:     'Braces',
  RETAINER:   'Retainers',
  CHECKUP:    'Check-ups',
  OTHER:      'Other Procedures',
}

// Preset templates per category
const PRESET_TEMPLATES: Record<string, [string, string]> = {
  EXTRACTION: [
    "Hi [Name]! Just checking in after your extraction. How are you feeling? We hope it's healing well 🙏 Let us know if you have any concerns!",
    "Hi [Name]! It's been a little while since your tooth removal. Just making sure there's no discomfort or swelling. We're always here if you need us 😊",
  ],
  RCT: [
    "Hi [Name]! Checking in after your root canal. Any sensitivity should be easing up — how are you doing? Don't hesitate to reach out if something feels off!",
    "Hi [Name]! Just a quick follow-up after your RCT. We hope you're feeling much better! Let us know if you need anything 😊",
  ],
  CLEANING: [
    "Hi [Name]! It's been a while since your last cleaning with us. Time for your next check-up! We'd love to see you again 😊",
    "Hi [Name]! Hope you've been keeping up with flossing 😄 It might be time to book your next cleaning!",
  ],
  FILLING: [
    "Hi [Name]! Just checking in after your filling. Is the bite feeling normal? Let us know if anything feels off!",
    "Hi [Name]! How's the filling? If you're experiencing any sensitivity, just message us anytime 😊",
  ],
  CROWN: [
    "Hi [Name]! Just following up after your recent dental work. How is everything feeling? Let us know if you have any questions 😊",
    "Hi [Name]! Checking in to see how you're adjusting. We want to make sure you're comfortable!",
  ],
  BRIDGE: [
    "Hi [Name]! Just following up after your recent dental work. How is everything feeling? Let us know if you have any questions 😊",
    "Hi [Name]! Checking in to see how you're adjusting. We want to make sure you're comfortable!",
  ],
  DENTURES: [
    "Hi [Name]! Just following up after your recent dental work. How is everything feeling? Let us know if you have any questions 😊",
    "Hi [Name]! Checking in to see how you're adjusting. We want to make sure you're comfortable!",
  ],
  BRACES: [
    "Hi [Name]! Time for a check-in on your braces progress 😊 How are things feeling? Ready for your next adjustment?",
    "Hi [Name]! Don't forget to wear your retainer consistently! Let us know if you need to book your next appointment.",
  ],
  RETAINER: [
    "Hi [Name]! Time for a check-in on your braces progress 😊 How are things feeling? Ready for your next adjustment?",
    "Hi [Name]! Don't forget to wear your retainer consistently! Let us know if you need to book your next appointment.",
  ],
  CHECKUP: [
    "Hi [Name]! Thanks for visiting us recently 😊 Hope everything is going well. Remember — regular check-ups every 6 months keep your smile healthy!",
    "Hi [Name]! Great seeing you at the clinic! How are you feeling? Let us know if you need anything 😊",
  ],
  OTHER: [
    "Hi [Name]! Thanks for visiting us recently 😊 Hope everything is going well. Remember — regular check-ups every 6 months keep your smile healthy!",
    "Hi [Name]! Great seeing you at the clinic! How are you feeling? Let us know if you need anything 😊",
  ],
}

const DAY_OPTIONS = [1, 2, 3, 5, 7, 14, 30, 60, 90, 180, 365]

function getPresets(category: string): [string, string] {
  return PRESET_TEMPLATES[category] ?? PRESET_TEMPLATES['OTHER']
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

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

// ─── Recall Rule Card ─────────────────────────────────────────────────────────

type RecallCardState = {
  daysAfter: number
  messageMode: 'preset1' | 'preset2' | 'custom'
  customMessage: string
  isActive: boolean
}

function RecallRuleCard({
  category,
  existingRule,
  onSaved,
}: {
  category: string
  existingRule: RecallRuleRow | undefined
  onSaved: (rule: RecallRuleRow) => void
}) {
  const presets = getPresets(category)
  const label = CATEGORY_LABELS[category] ?? category

  function detectMode(template: string): 'preset1' | 'preset2' | 'custom' {
    if (template === presets[0]) return 'preset1'
    if (template === presets[1]) return 'preset2'
    return 'custom'
  }

  const [state, setState] = useState<RecallCardState>(() => {
    if (existingRule) {
      return {
        daysAfter: existingRule.daysAfter,
        messageMode: detectMode(existingRule.messageTemplate),
        customMessage: detectMode(existingRule.messageTemplate) === 'custom' ? existingRule.messageTemplate : '',
        isActive: existingRule.isActive,
      }
    }
    return {
      daysAfter: 7,
      messageMode: 'preset1',
      customMessage: '',
      isActive: false,
    }
  })

  const [isPending, startTransition] = useTransition()

  function getTemplate(): string {
    if (state.messageMode === 'preset1') return presets[0]
    if (state.messageMode === 'preset2') return presets[1]
    return state.customMessage
  }

  function handleSave() {
    const template = getTemplate()
    if (!template.trim()) {
      toast.error('Please enter a message template')
      return
    }
    startTransition(async () => {
      try {
        await saveRecallRules([{
          id: existingRule?.id,
          serviceName: label,
          serviceCategory: category,
          daysAfter: state.daysAfter,
          messageTemplate: template,
          isActive: state.isActive,
        }])
        toast.success(`${label} follow-up saved`)
        onSaved({
          id: existingRule?.id ?? '',
          serviceName: label,
          serviceCategory: category,
          daysAfter: state.daysAfter,
          messageTemplate: template,
          isActive: state.isActive,
        })
      } catch {
        toast.error('Failed to save')
      }
    })
  }

  return (
    <div className="rounded-xl border bg-background p-4 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-sm">{label}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Active</span>
          <button
            type="button"
            onClick={() => setState((s) => ({ ...s, isActive: !s.isActive }))}
            className={[
              'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors',
              state.isActive ? 'bg-primary' : 'bg-input',
            ].join(' ')}
            role="switch"
            aria-checked={state.isActive}
          >
            <span
              className={[
                'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg transition-transform',
                state.isActive ? 'translate-x-5' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        </div>
      </div>

      {/* Days after chips */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Send follow-up after</p>
        <div className="flex flex-wrap gap-2">
          {DAY_OPTIONS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setState((s) => ({ ...s, daysAfter: d }))}
              className={[
                'rounded-full border px-3 py-1.5 text-xs font-medium min-h-[36px] transition-colors',
                state.daysAfter === d
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border text-muted-foreground',
              ].join(' ')}
            >
              {d === 1 ? '1 day' : d < 30 ? `${d} days` : d === 30 ? '1 mo' : d === 60 ? '2 mo' : d === 90 ? '3 mo' : d === 180 ? '6 mo' : '1 yr'}
            </button>
          ))}
        </div>
      </div>

      {/* Message presets */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Message</p>
        <div className="space-y-2">
          {(['preset1', 'preset2', 'custom'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setState((s) => ({ ...s, messageMode: mode }))}
              className={[
                'w-full text-left rounded-lg border px-3 py-2.5 text-xs min-h-[44px] transition-colors',
                state.messageMode === mode
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-border bg-background text-muted-foreground',
              ].join(' ')}
            >
              {mode === 'preset1' && presets[0]}
              {mode === 'preset2' && presets[1]}
              {mode === 'custom' && 'Custom message…'}
            </button>
          ))}
        </div>

        {state.messageMode === 'custom' && (
          <div className="mt-2">
            <textarea
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={3}
              placeholder="Hi [Name]! Your message here…"
              value={state.customMessage}
              onChange={(e) => setState((s) => ({ ...s, customMessage: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground mt-1">Use [Name] to insert the patient&apos;s first name.</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="w-full min-h-[48px] rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40"
      >
        {isPending ? 'Saving…' : 'Save'}
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
  recallRules: initialRecallRules,
  catalogServices,
}: {
  clinic: ClinicConfig
  reminders: ReminderRow[]
  channelStats: ChannelStats
  unlinkedMessages: UnlinkedMessage[]
  recallRules: RecallRuleRow[]
  catalogServices: Array<{ name: string; category: string }>
}) {
  const [reminders, setReminders] = useState(initialReminders)
  const [unlinked, setUnlinked] = useState(initialUnlinked)
  const [clinic, setClinic] = useState(initialClinic)
  const [recallRules, setRecallRules] = useState(initialRecallRules)
  const [processing, setProcessing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showMessengerSetup, setShowMessengerSetup] = useState(false)
  const [showFollowUps, setShowFollowUps] = useState(false)

  // Show toast based on OAuth redirect result
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const m = params.get('messenger')
    if (!m) return
    window.history.replaceState({}, '', '/reminders')
    if (m === 'connected')      toast.success('Facebook Page connected! Messenger reminders are ready.')
    else if (m === 'error')     toast.error('Could not connect Facebook Page. Please try again.')
    else if (m === 'nopage')    toast.error('No Facebook Pages found on your account. Make sure your Page is linked to your Facebook profile.')
    else if (m === 'cancelled') toast('Connection cancelled.')
    else if (m === 'misconfigured') toast.error('Messenger is not configured on this server yet.')
  }, [])

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

  // Unique service categories present in the active catalog
  const catalogCategories = Array.from(new Set(catalogServices.map((s) => s.category)))

  function ruleForCategory(category: string): RecallRuleRow | undefined {
    return recallRules.find((r) => r.serviceCategory === category)
  }

  function handleRuleSaved(updated: RecallRuleRow) {
    setRecallRules((prev) => {
      const idx = prev.findIndex((r) => r.serviceCategory === updated.serviceCategory)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = updated
        return next
      }
      return [...prev, updated]
    })
  }

  // ── Channel status cards ──────────────────────────────────────────────────

  const channels = [
    {
      key: 'MESSENGER',
      emoji: '📱',
      label: 'Messenger',
      count: channelStats.MESSENGER,
      active: clinic.messengerConfigured,
      actionLabel: null as string | null, // handled with custom button below
      onAction: null as (() => void) | null,
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

              {/* Messenger connect / reconnect section */}
              {ch.key === 'MESSENGER' && (
                <div className="mt-3 flex flex-col gap-2">
                  {/* Primary: Facebook OAuth button */}
                  <a
                    href="/api/auth/facebook"
                    className="flex items-center justify-center gap-2 w-full min-h-[48px] rounded-xl text-sm font-semibold transition-colors"
                    style={{ background: '#1877F2', color: '#fff' }}
                  >
                    <span className="font-bold text-base leading-none">f</span>
                    {clinic.messengerConfigured ? 'Reconnect Facebook Page' : 'Connect with Facebook'}
                  </a>
                  {/* Secondary: manual token entry toggle */}
                  <button
                    onClick={() => setShowMessengerSetup((v) => !v)}
                    className="text-xs text-muted-foreground underline-offset-2 hover:underline min-h-[36px]"
                  >
                    {showMessengerSetup ? 'Hide manual setup' : 'Set up manually with token'}
                  </button>
                  {showMessengerSetup && (
                    <div className="pt-2 border-t">
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
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. CARE FOLLOW-UPS ── */}
      <section>
        <button
          onClick={() => setShowFollowUps((v) => !v)}
          className="w-full flex items-center justify-between gap-2 rounded-xl border bg-background px-4 py-3.5 text-sm font-medium"
        >
          <span>Care Follow-ups</span>
          <span className="text-muted-foreground text-xs">{showFollowUps ? '▾' : '▸'}</span>
        </button>

        {showFollowUps && (
          <div className="mt-2 space-y-3">
            <p className="text-xs text-muted-foreground px-1">
              Automatically send a warm check-in message to patients after specific procedures. Configure per service category.
            </p>
            {catalogCategories.length === 0 ? (
              <div className="rounded-xl border bg-background p-5 text-center text-sm text-muted-foreground">
                No active services in your catalog yet.
              </div>
            ) : (
              catalogCategories.map((cat) => (
                <RecallRuleCard
                  key={cat}
                  category={cat}
                  existingRule={ruleForCategory(cat)}
                  onSaved={handleRuleSaved}
                />
              ))
            )}
          </div>
        )}
      </section>

      {/* ── 3. UPCOMING REMINDERS ── */}
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

      {/* ── 4. ADVANCED (collapsed) ── */}
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
