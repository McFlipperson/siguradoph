'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { type Plan } from '@/lib/entitlements'
import { getOrCreatePendingUpgrade, selfReportPayment } from './actions'
import { PLAN_PRICES } from '@/lib/billing-constants'
import { Check, Copy, Zap, ArrowRight, CalendarClock } from 'lucide-react'
import { useRouter } from 'next/navigation'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

// ─── Plan definitions ────────────────────────────────────────────────────────

type PlanDef = {
  id: 'BASIC' | 'PRO'
  name: string
  price: string
  amountLabel: string
  badge: string
  borderColor: string
  features: string[]
}

const PLAN_DEFS: PlanDef[] = [
  {
    id: 'BASIC',
    name: 'Basic',
    price: '₱499',
    amountLabel: '₱499.00',
    badge: 'bg-blue-100 text-blue-800',
    borderColor: 'border-blue-300',
    features: [
      'Unlimited patients',
      'Scheduling & appointments',
      'Messenger reminders',
      'Loyalty cards',
      'SC / PWD discounts',
      'Reports & analytics',
      'Data export',
    ],
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: '₱999',
    amountLabel: '₱999.00',
    badge: 'bg-violet-100 text-violet-800',
    borderColor: 'border-violet-300',
    features: [
      'Everything in Basic',
      'Full privacy compliance suite',
      'Audit log & consent dashboard',
      'Breach / ASIR incident tools',
      'Employee management',
      'Payroll processing',
    ],
  },
]

const PLAN_RANK: Record<Plan, number> = { FREE: 0, BASIC: 1, PRO: 2 }

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ plan, onDone }: { plan: PlanDef; onDone: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-6 space-y-5">
      <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
        <Check className="w-10 h-10 text-emerald-600" />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-bold">You&apos;re all set!</h2>
        <p className="text-sm text-muted-foreground">
          Your <strong>{plan.name}</strong> plan is active. All features are unlocked.
        </p>
      </div>
      <div className="w-full rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 text-left space-y-1">
        <p className="font-semibold">What happens next</p>
        <p>We&apos;ll verify your GCash payment in the background — no action needed. You&apos;ll get a confirmation email once verified.</p>
      </div>
      <button
        onClick={onDone}
        className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2"
      >
        Start using {plan.name} <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── PaymentPanel ────────────────────────────────────────────────────────────

function PaymentPanel({
  plan,
  gcashNumber,
  onClose,
  onSuccess,
}: {
  plan: PlanDef
  gcashNumber: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [loadingRef, setLoadingRef] = useState(true)
  const [refCode, setRefCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const amountPesos = PLAN_PRICES[plan.id] / 100

  useEffect(() => {
    let cancelled = false
    setLoadingRef(true)
    getOrCreatePendingUpgrade(plan.id)
      .then((r) => { if (!cancelled) setRefCode(r.referenceCode) })
      .catch(() => { if (!cancelled) toast.error('Could not generate reference. Try again.') })
      .finally(() => { if (!cancelled) setLoadingRef(false) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.id])

  function copyRef() {
    if (!refCode) return
    navigator.clipboard.writeText(refCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleIvePaid() {
    setSubmitting(true)
    const res = await selfReportPayment(plan.id)
    setSubmitting(false)
    if (res.ok) {
      onSuccess()
    } else {
      toast.error(res.error ?? 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="mt-3 rounded-2xl border-2 border-primary bg-background shadow-md p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-base">Pay via GCash</p>
          <p className="text-sm text-muted-foreground">{plan.name} · {plan.price}/month</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground p-1 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg active:bg-muted">✕</button>
      </div>

      {/* Amount */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-center">
        <p className="text-xs text-muted-foreground mb-0.5">Send exactly</p>
        <p className="text-3xl font-bold text-primary">₱{amountPesos.toFixed(2)}</p>
      </div>

      {/* QR + number */}
      <div className="flex flex-col items-center gap-2">
        <div className="rounded-2xl overflow-hidden border shadow-sm w-48">
          <Image src="/gcash-qr.jpeg" alt="GCash QR code" width={192} height={284} className="w-full h-auto" />
        </div>
        {gcashNumber && (
          <p className="text-xs text-muted-foreground">or send to <strong>{gcashNumber}</strong></p>
        )}
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-800 text-center leading-relaxed">
          The recipient will appear as <strong>JO*****E B.</strong> — this is correct. Sigurado payments are processed through our registered GCash account.
        </div>
      </div>

      {/* Reference code */}
      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground text-center">Include in GCash notes to speed up verification</p>
        {loadingRef ? (
          <div className="h-12 rounded-xl bg-muted animate-pulse" />
        ) : refCode ? (
          <button
            onClick={copyRef}
            className="w-full flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-3 active:bg-primary/10"
          >
            <span className="text-xl font-bold tracking-widest text-primary">{refCode}</span>
            <span className="flex items-center gap-1 text-xs text-primary font-medium shrink-0">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </button>
        ) : null}
      </div>

      {/* Steps */}
      <ol className="space-y-2">
        {[
          'Open GCash and scan the QR (or tap Send Money → enter number)',
          `Send exactly ₱${amountPesos.toFixed(2)}`,
          'Optionally paste the reference code in GCash notes',
          'Come back here and tap the button below',
        ].map((step, i) => (
          <li key={i} className="flex gap-3 items-start text-sm">
            <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
            <span className="text-muted-foreground leading-snug">{step}</span>
          </li>
        ))}
      </ol>

      {/* I've paid CTA */}
      <button
        onClick={handleIvePaid}
        disabled={submitting}
        className="w-full min-h-[52px] rounded-xl bg-emerald-600 text-white font-bold text-base flex items-center justify-center gap-2 active:opacity-90 disabled:opacity-50"
      >
        {submitting ? 'Activating…' : "✓ I've paid — activate my plan"}
      </button>

      <p className="text-[11px] text-muted-foreground text-center">
        We trust you. Your plan activates immediately. We verify the GCash payment in the background.
      </p>
    </div>
  )
}

// ─── RenewalPanel ─────────────────────────────────────────────────────────────

function RenewalPanel({
  plan,
  gcashNumber,
  nextDueDate,
}: {
  plan: PlanDef
  gcashNumber: string
  nextDueDate: string | null
}) {
  const [open, setOpen] = useState(false)
  const [success, setSuccess] = useState(false)
  const [loadingRef, setLoadingRef] = useState(true)
  const [refCode, setRefCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false
    getOrCreatePendingUpgrade(plan.id)
      .then((r) => { if (!cancelled) setRefCode(r.referenceCode) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingRef(false) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.id])

  function copyRef() {
    if (!refCode) return
    navigator.clipboard.writeText(refCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (success) {
    return (
      <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 px-4 py-4 flex items-start gap-3">
        <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-emerald-800 text-sm">Renewal confirmed!</p>
          <p className="text-xs text-emerald-700 mt-0.5">Your {plan.name} plan has been renewed. Check your email for confirmation.</p>
        </div>
      </div>
    )
  }

  const days = nextDueDate ? daysUntil(nextDueDate) : null
  const isUrgent = days !== null && days <= 5

  return (
    <div className="rounded-2xl border bg-muted/30 px-4 py-4 space-y-4">

      {/* Next due date — big and prominent */}
      {nextDueDate && (
        <div className={`rounded-xl px-4 py-3 flex items-start gap-3 ${isUrgent ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
          <CalendarClock className={`w-5 h-5 shrink-0 mt-0.5 ${isUrgent ? 'text-red-500' : 'text-amber-500'}`} />
          <div>
            <p className={`font-bold text-base ${isUrgent ? 'text-red-800' : 'text-amber-800'}`}>
              Next renewal due: {formatDate(nextDueDate)}
              {days !== null && days >= 0 && (
                <span className="font-normal text-sm ml-2">({days === 0 ? 'today' : `${days} day${days !== 1 ? 's' : ''}`})</span>
              )}
              {days !== null && days < 0 && (
                <span className="font-normal text-sm ml-2 text-red-600">(overdue)</span>
              )}
            </p>
            <p className={`text-xs mt-0.5 ${isUrgent ? 'text-red-700' : 'text-amber-700'}`}>
              To avoid any disruption, pay 2–3 days before the due date.
            </p>
          </div>
        </div>
      )}

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {nextDueDate ? 'Pay your renewal' : 'Renewing next month?'}
      </p>

      {!open ? (
        <div className="space-y-4">
          {/* QR + amount side by side */}
          <div className="flex items-center gap-4">
            <div className="rounded-xl overflow-hidden border shadow-sm shrink-0 w-24">
              <Image src="/gcash-qr.jpeg" alt="GCash QR code" width={96} height={142} className="w-full h-auto" />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Scan with GCash · send exactly</p>
              <p className="text-3xl font-bold text-primary">{plan.amountLabel}</p>
              {gcashNumber && <p className="text-xs text-muted-foreground">{gcashNumber}</p>}
              <p className="text-[11px] text-blue-700 leading-tight">Recipient: <strong>JO*****E B.</strong> — this is correct ✓</p>
            </div>
          </div>

          {/* Reference code */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Include in GCash notes (speeds up verification)</p>
            {loadingRef ? (
              <div className="h-11 rounded-xl bg-muted animate-pulse" />
            ) : refCode ? (
              <button
                onClick={copyRef}
                className="w-full flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-2.5 active:bg-primary/10"
              >
                <span className="text-lg font-bold tracking-widest text-primary">{refCode}</span>
                <span className="flex items-center gap-1 text-xs text-primary font-medium shrink-0">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </span>
              </button>
            ) : null}
          </div>

          <button
            onClick={() => setOpen(true)}
            className="w-full min-h-[48px] rounded-xl bg-emerald-600 text-white font-bold text-sm active:opacity-90"
          >
            I&apos;ve sent the payment →
          </button>
        </div>
      ) : (
        <PaymentPanel
          plan={plan}
          gcashNumber={gcashNumber}
          onClose={() => setOpen(false)}
          onSuccess={() => { setSuccess(true); router.refresh() }}
        />
      )}
    </div>
  )
}

// ─── PlanCard ────────────────────────────────────────────────────────────────

function PlanCard({ plan, currentPlan, gcashNumber, autoOpen = false }: { plan: PlanDef; currentPlan: Plan; gcashNumber: string; autoOpen?: boolean }) {
  const [open, setOpen] = useState(autoOpen)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const isCurrent = currentPlan === plan.id
  const isDowngrade = PLAN_RANK[plan.id] < PLAN_RANK[currentPlan]

  if (success) {
    return (
      <div className={`rounded-2xl border-2 ${plan.borderColor} p-4`}>
        <SuccessScreen plan={plan} onDone={() => { setSuccess(false); router.refresh() }} />
      </div>
    )
  }

  return (
    <div className={`rounded-2xl border-2 p-4 space-y-3 ${isCurrent ? 'border-primary' : 'border-border'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${plan.badge}`}>{plan.name}</span>
          {isCurrent && <span className="text-xs font-medium text-primary">Current plan</span>}
        </div>
        <span className="font-bold text-lg">{plan.price}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
      </div>

      <ul className="space-y-1.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {!isCurrent && !isDowngrade && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 active:opacity-90"
        >
          <Zap className="w-4 h-4" />
          Upgrade to {plan.name}
        </button>
      )}

      {open && (
        <PaymentPanel
          plan={plan}
          gcashNumber={gcashNumber}
          onClose={() => setOpen(false)}
          onSuccess={() => { setOpen(false); setSuccess(true) }}
        />
      )}
    </div>
  )
}

// ─── BillingClient ────────────────────────────────────────────────────────────

export default function BillingClient({
  currentPlan,
  clinicName,
  gcashNumber,
  recentlyConfirmedPlan,
  nextDueDate,
  autoOpenPlan,
}: {
  currentPlan: Plan
  clinicName: string
  gcashNumber: string
  recentlyConfirmedPlan: Plan | null
  nextDueDate: string | null
  autoOpenPlan?: 'BASIC' | 'PRO' | null
}) {
  const plansToShow = PLAN_DEFS.filter((p) => PLAN_RANK[p.id] >= PLAN_RANK[currentPlan])
  const currentPlanDef = PLAN_DEFS.find((p) => p.id === currentPlan)

  return (
    <div className="space-y-5 pb-4">
      <h1 className="text-xl font-bold">Subscription</h1>

      {recentlyConfirmedPlan && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-start gap-3">
          <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-800 text-sm">Payment verified!</p>
            <p className="text-xs text-emerald-700 mt-0.5">{clinicName}&apos;s {recentlyConfirmedPlan} plan has been confirmed by GCash.</p>
          </div>
        </div>
      )}

      {/* Current plan */}
      <div className="rounded-2xl border bg-background px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Current plan</p>
          <p className="font-bold text-lg">{currentPlan.charAt(0) + currentPlan.slice(1).toLowerCase()}</p>
        </div>
        <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
          {currentPlan === 'FREE' ? 'Up to 30 patients' : currentPlan === 'PRO' ? 'All features' : 'Core features'}
        </span>
      </div>

      {/* PRO — feature list + renewal */}
      {currentPlan === 'PRO' && currentPlanDef && (
        <div className="space-y-4">
          <div className={`rounded-2xl border-2 ${currentPlanDef.borderColor} p-4 space-y-3`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${currentPlanDef.badge}`}>Pro</span>
              <span className="font-bold text-lg">₱999<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
            </div>
            <ul className="space-y-1.5">
              {['Unlimited patients', 'Scheduling & appointments', 'Messenger reminders',
                'Loyalty cards & SC/PWD discounts', 'Reports & data export',
                'Full privacy compliance suite', 'Audit log & consent dashboard',
                'Breach / ASIR incident tools', 'Employee management & payroll',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <RenewalPanel plan={currentPlanDef} gcashNumber={gcashNumber} nextDueDate={nextDueDate} />
        </div>
      )}

      {/* BASIC — feature list + renewal + upgrade to Pro */}
      {currentPlan === 'BASIC' && currentPlanDef && (
        <div className="space-y-4">
          <RenewalPanel plan={currentPlanDef} gcashNumber={gcashNumber} nextDueDate={nextDueDate} />
          <p className="text-sm text-muted-foreground">Upgrade to Pro for the full compliance suite:</p>
          {plansToShow.filter(p => p.id !== 'BASIC').map((plan) => (
            <PlanCard key={plan.id} plan={plan} currentPlan={currentPlan} gcashNumber={gcashNumber} autoOpen={autoOpenPlan === plan.id} />
          ))}
        </div>
      )}

      {/* FREE — upgrade cards */}
      {currentPlan === 'FREE' && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Upgrade to unlock more patients and features:</p>
          {plansToShow.map((plan) => (
            <PlanCard key={plan.id} plan={plan} currentPlan={currentPlan} gcashNumber={gcashNumber} autoOpen={autoOpenPlan === plan.id} />
          ))}
        </div>
      )}

      {currentPlan === 'FREE' && (
        <div className="rounded-2xl border bg-muted/30 px-4 py-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">How it works</p>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p>• Tap <strong className="text-foreground">Upgrade</strong>, scan the GCash QR, send the exact amount.</p>
            <p>• Tap <strong className="text-foreground">&ldquo;I&apos;ve paid&rdquo;</strong> — your plan activates instantly.</p>
            <p>• We verify your payment in the background. No waiting, no friction.</p>
            <p>• Monthly, no auto-charge. Renew manually each month.</p>
            <p>• Pay 2–3 days early each month to avoid any disruption.</p>
          </div>
        </div>
      )}
    </div>
  )
}
