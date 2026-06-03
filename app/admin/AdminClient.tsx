'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { setClinicPlan, confirmPendingUpgrade } from './actions'
import { PLAN_LABELS, type Plan } from '@/lib/entitlements'

type ClinicRow = {
  id: string
  name: string
  plan: Plan
  email: string
  patientCount: number
  createdAt: string
}

type ActivityRow = {
  id: string
  actorEmail: string
  action: string
  detail: string
  createdAt: string
}

type PendingUpgradeRow = {
  id: string
  clinicId: string
  clinicName: string
  clinicEmail: string
  plan: Plan
  referenceCode: string
  amountCents: number
  createdAt: string
  expiresAt: string
}

const PLANS: Plan[] = ['FREE', 'BASIC', 'PRO']

export default function AdminClient({
  clinics,
  activity,
  pendingUpgrades,
}: {
  clinics: ClinicRow[]
  activity: ActivityRow[]
  pendingUpgrades: PendingUpgradeRow[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set())

  function changePlan(id: string, plan: Plan) {
    setSavingId(id)
    setSavedId(null)
    startTransition(async () => {
      try {
        await setClinicPlan(id, plan)
        setSavedId(id)
        router.refresh()
        setTimeout(() => setSavedId(null), 2500)
      } catch {
        alert('Failed to update plan')
      } finally {
        setSavingId(null)
      }
    })
  }

  function handleConfirm(upgradeId: string) {
    setConfirmingId(upgradeId)
    startTransition(async () => {
      try {
        await confirmPendingUpgrade(upgradeId)
        setConfirmedIds((prev) => new Set([...prev, upgradeId]))
        router.refresh()
      } catch {
        alert('Failed to confirm upgrade')
      } finally {
        setConfirmingId(null)
      }
    })
  }

  const filtered = clinics.filter(
    (c) =>
      !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-3xl mx-auto px-5 py-8 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Sigurado Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set a clinic&apos;s plan when their GCash / bank payment is confirmed. {clinics.length} clinic{clinics.length !== 1 ? 's' : ''}.
          </p>
        </div>
        <Link href="/admin/incidents" className="shrink-0 text-sm font-medium px-4 py-2 rounded-xl bg-primary text-primary-foreground">
          DPO Incidents →
        </Link>
      </div>

      <input
        type="search"
        placeholder="Search by clinic name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm"
      />

      <div className="space-y-3">
        {filtered.map((c) => (
          <div key={c.id} className="rounded-2xl border bg-background p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="font-semibold truncate">{c.name}</p>
              <p className="text-xs text-muted-foreground truncate">{c.email}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {c.patientCount} patient{c.patientCount !== 1 ? 's' : ''} · since {new Date(c.createdAt).toLocaleDateString('en-PH')}
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
                {PLANS.map((p) => (
                  <option key={p} value={p}>{PLAN_LABELS[p]}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No clinics match.</p>
        )}
      </div>

      {/* Pending upgrades — awaiting GCash payment confirmation */}
      {pendingUpgrades.length > 0 && (
        <div className="pt-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Pending Upgrades ({pendingUpgrades.length})
          </h2>
          <div className="space-y-2">
            {pendingUpgrades.map((u) => {
              const isConfirmed = confirmedIds.has(u.id)
              return (
                <div key={u.id} className="rounded-2xl border bg-background p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{u.clinicName}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.clinicEmail}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          → {PLAN_LABELS[u.plan]}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">{u.referenceCode}</span>
                        <span className="text-xs text-muted-foreground">
                          ₱{(u.amountCents / 100).toFixed(2)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Requested {new Date(u.createdAt).toLocaleString('en-PH')} ·
                        expires {new Date(u.expiresAt).toLocaleDateString('en-PH')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleConfirm(u.id)}
                      disabled={confirmingId === u.id || isConfirmed}
                      className="shrink-0 min-h-[40px] px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-50"
                    >
                      {isConfirmed ? 'Confirmed ✓' : confirmingId === u.id ? 'Saving…' : 'Confirm'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Admin activity log — tamper-evident record of plan changes */}
      <div className="pt-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent admin activity</h2>
        {activity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No plan changes recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {activity.map((a) => (
              <div key={a.id} className="rounded-xl border bg-background px-4 py-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{a.detail}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {new Date(a.createdAt).toLocaleString('en-PH')}
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
