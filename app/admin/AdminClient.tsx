'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { setClinicPlan, confirmPendingUpgrade, downgradeClinic } from './actions'
import { PLAN_LABELS, type Plan } from '@/lib/entitlements'
import { AlertTriangle, Clock, CheckCircle2, Users, ChevronDown, ChevronUp } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ClinicRow = {
  id: string; name: string; plan: Plan; email: string; patientCount: number; createdAt: string
}

type ActivityRow = {
  id: string; actorEmail: string; action: string; detail: string; createdAt: string
}

type UpgradeRow = {
  id: string; clinicId: string; clinicName: string; clinicEmail: string
  clinicGcashNumber: string | null; plan: Plan; referenceCode: string
  amountCents: number; status: string; selfReportedAt: string | null
  confirmedAt: string | null; confirmedBy: string | null
  createdAt: string; expiresAt: string
}

type VerifiedRow = {
  id: string; clinicName: string; clinicEmail: string; plan: Plan
  referenceCode: string; amountCents: number
  confirmedAt: string | null; confirmedBy: string | null
}

const PLANS: Plan[] = ['FREE', 'BASIC', 'PRO']

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor(diff / 60000)
  if (h >= 24) return `${Math.floor(h / 24)}d ago`
  if (h >= 1) return `${h}h ago`
  return `${m}m ago`
}

function pesos(cents: number) {
  return `₱${(cents / 100).toFixed(2)}`
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  icon, label, count, color,
}: {
  icon: React.ReactNode; label: string; count: number; color: string
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${color}`}>
      {icon}
      <span className="font-semibold text-sm">{label}</span>
      {count > 0 && (
        <span className="ml-auto text-xs font-bold bg-white/60 px-2 py-0.5 rounded-full">{count}</span>
      )}
    </div>
  )
}

// ─── Upgrade action row ───────────────────────────────────────────────────────

function UpgradeActionRow({
  upgrade,
  showDowngrade,
}: {
  upgrade: UpgradeRow
  showDowngrade: boolean
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const [downgrading, setDowngrading] = useState(false)
  const [done, setDone] = useState<'confirmed' | 'downgraded' | null>(null)

  function handleConfirm() {
    setConfirming(true)
    startTransition(async () => {
      try {
        await confirmPendingUpgrade(upgrade.id)
        setDone('confirmed')
        router.refresh()
      } catch { alert('Failed to confirm') }
      finally { setConfirming(false) }
    })
  }

  function handleDowngrade() {
    if (!confirm(`Downgrade ${upgrade.clinicName} to Free? This reverts their plan.`)) return
    setDowngrading(true)
    startTransition(async () => {
      try {
        await downgradeClinic(upgrade.id)
        setDone('downgraded')
        router.refresh()
      } catch { alert('Failed to downgrade') }
      finally { setDowngrading(false) }
    })
  }

  if (done === 'confirmed') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4" /> {upgrade.clinicName} confirmed →{' '}
        {PLAN_LABELS[upgrade.plan]}
      </div>
    )
  }
  if (done === 'downgraded') {
    return (
      <div className="rounded-xl border border-muted px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
        ✗ {upgrade.clinicName} downgraded to Free
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-background p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold truncate">{upgrade.clinicName}</p>
          <p className="text-xs text-muted-foreground truncate">{upgrade.clinicEmail}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              → {PLAN_LABELS[upgrade.plan]}
            </span>
            <span className="text-xs font-mono text-muted-foreground">{upgrade.referenceCode}</span>
            <span className="text-xs text-muted-foreground">{pesos(upgrade.amountCents)}</span>
          </div>
          {upgrade.selfReportedAt && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Self-reported {timeAgo(upgrade.selfReportedAt)}
              {upgrade.clinicGcashNumber && ` · GCash: ${upgrade.clinicGcashNumber}`}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={confirming || downgrading}
          className="flex-1 min-h-[40px] rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
        >
          {confirming ? 'Confirming…' : '✓ Verify payment'}
        </button>
        {showDowngrade && (
          <button
            onClick={handleDowngrade}
            disabled={confirming || downgrading}
            className="min-h-[40px] px-4 rounded-xl border border-red-300 text-red-600 text-sm font-medium disabled:opacity-50"
          >
            {downgrading ? '…' : 'Downgrade'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── AdminClient ──────────────────────────────────────────────────────────────

export default function AdminClient({
  clinics, activity, needsAttention, awaitingVerification, recentlyVerified,
}: {
  clinics: ClinicRow[]
  activity: ActivityRow[]
  needsAttention: UpgradeRow[]
  awaitingVerification: UpgradeRow[]
  recentlyVerified: VerifiedRow[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showClinics, setShowClinics] = useState(false)
  const [showActivity, setShowActivity] = useState(false)

  function changePlan(id: string, plan: Plan) {
    setSavingId(id)
    setSavedId(null)
    startTransition(async () => {
      try {
        await setClinicPlan(id, plan)
        setSavedId(id)
        router.refresh()
        setTimeout(() => setSavedId(null), 2500)
      } catch { alert('Failed to update plan') }
      finally { setSavingId(null) }
    })
  }

  const filtered = clinics.filter(
    (c) => !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Sigurado Admin</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{clinics.length} clinics</p>
        </div>
        <Link
          href="/admin/incidents"
          className="shrink-0 text-sm font-medium px-4 py-2 rounded-xl bg-primary text-primary-foreground"
        >
          DPO Incidents →
        </Link>
      </div>

      {/* ── 🔴 NEEDS ATTENTION ── */}
      {needsAttention.length > 0 && (
        <div className="space-y-3">
          <SectionHeader
            icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
            label="Needs Attention — payment unverified 24h+"
            count={needsAttention.length}
            color="bg-red-50 border border-red-200 text-red-800"
          />
          <div className="space-y-2">
            {needsAttention.map((u) => (
              <UpgradeActionRow key={u.id} upgrade={u} showDowngrade={true} />
            ))}
          </div>
        </div>
      )}

      {/* ── 🟡 AWAITING VERIFICATION ── */}
      {awaitingVerification.length > 0 && (
        <div className="space-y-3">
          <SectionHeader
            icon={<Clock className="w-4 h-4 text-amber-600" />}
            label="Awaiting Verification — self-reported, checking GCash"
            count={awaitingVerification.length}
            color="bg-amber-50 border border-amber-200 text-amber-800"
          />
          <div className="space-y-2">
            {awaitingVerification.map((u) => (
              <UpgradeActionRow key={u.id} upgrade={u} showDowngrade={false} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground px-1">
            Gmail agent will verify these automatically within the hour. You can confirm manually if you&apos;ve already seen the GCash notification.
          </p>
        </div>
      )}

      {/* ── 🟢 RECENTLY VERIFIED ── */}
      {recentlyVerified.length > 0 && (
        <div className="space-y-3">
          <SectionHeader
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            label="Recently Verified (last 7 days)"
            count={recentlyVerified.length}
            color="bg-emerald-50 border border-emerald-200 text-emerald-800"
          />
          <div className="space-y-2">
            {recentlyVerified.map((u) => (
              <div key={u.id} className="rounded-xl border bg-background px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{u.clinicName}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {PLAN_LABELS[u.plan]}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">{u.referenceCode}</span>
                      <span className="text-xs text-muted-foreground">{pesos(u.amountCents)}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {u.confirmedAt ? timeAgo(u.confirmedAt) : ''}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {u.confirmedBy === 'auto' ? 'auto' : u.confirmedBy ?? ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ALL ZERO STATE ── */}
      {needsAttention.length === 0 && awaitingVerification.length === 0 && recentlyVerified.length === 0 && (
        <div className="rounded-2xl border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
          No payment activity. All clear.
        </div>
      )}

      {/* ── CLINICS (collapsible) ── */}
      <div className="space-y-3">
        <button
          onClick={() => setShowClinics((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl border bg-background text-sm font-semibold"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            All Clinics — plan management
          </div>
          {showClinics ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {showClinics && (
          <div className="space-y-3">
            <input
              type="search"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm"
            />
            <div className="space-y-2">
              {filtered.map((c) => (
                <div key={c.id} className="rounded-2xl border bg-background p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.patientCount} patient{c.patientCount !== 1 ? 's' : ''} · since{' '}
                      {new Date(c.createdAt).toLocaleDateString('en-PH')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {savedId === c.id && <span className="text-xs text-emerald-600 font-medium">Saved</span>}
                    <select
                      value={c.plan}
                      disabled={savingId === c.id}
                      onChange={(e) => changePlan(c.id, e.target.value as Plan)}
                      className="rounded-lg border bg-background px-3 py-2 text-sm font-medium disabled:opacity-50"
                    >
                      {PLANS.map((p) => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
                    </select>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No clinics match.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── ACTIVITY LOG (collapsible) ── */}
      <div className="space-y-3">
        <button
          onClick={() => setShowActivity((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl border bg-background text-sm font-semibold"
        >
          <span>Activity Log</span>
          {showActivity ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {showActivity && (
          <div className="space-y-2">
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No activity yet.</p>
            ) : activity.map((a) => (
              <div key={a.id} className="rounded-xl border bg-background px-4 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{a.detail}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {timeAgo(a.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">by {a.actorEmail}</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
