'use client'

import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import { toast } from 'sonner'
import { type Plan } from '@/lib/entitlements'
import { getOrCreatePendingUpgrade } from './actions'
import { PLAN_PRICES } from '@/lib/billing-constants'
import { Check, Copy, Zap } from 'lucide-react'

// ─── Plan definitions ────────────────────────────────────────────────────────

type PlanDef = {
  id: 'BASIC' | 'PRO'
  name: string
  price: string
  color: string
  badge: string
  features: string[]
}

const PLAN_DEFS: PlanDef[] = [
  {
    id: 'BASIC',
    name: 'Basic',
    price: '₱499',
    color: 'border-blue-400 bg-blue-50',
    badge: 'bg-blue-100 text-blue-800',
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
    color: 'border-violet-400 bg-violet-50',
    badge: 'bg-violet-100 text-violet-800',
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

// ─── PaymentPanel ────────────────────────────────────────────────────────────

function PaymentPanel({
  plan,
  gcashNumber,
  onClose,
}: {
  plan: PlanDef
  gcashNumber: string
  onClose: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [refCode, setRefCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const amountPesos = PLAN_PRICES[plan.id] / 100

  // Load the reference code as soon as the panel mounts
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getOrCreatePendingUpgrade(plan.id)
      .then((result) => { if (!cancelled) setRefCode(result.referenceCode) })
      .catch(() => { if (!cancelled) toast.error('Could not generate payment reference. Please try again.') })
      .finally(() => { if (!cancelled) setLoading(false) })
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

  return (
    <div className="mt-3 rounded-2xl border-2 border-primary bg-background shadow-md p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-base">Pay via GCash</p>
          <p className="text-sm text-muted-foreground">{plan.name} plan · {plan.price}/month</p>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground p-1 min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg active:bg-muted"
        >
          ✕
        </button>
      </div>

      {/* Amount */}
      <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 text-center">
        <p className="text-xs text-muted-foreground mb-0.5">Send exactly</p>
        <p className="text-3xl font-bold text-primary">₱{amountPesos.toFixed(2)}</p>
      </div>

      {/* QR + number */}
      <div className="flex flex-col items-center gap-3">
        {gcashNumber ? (
          <>
            <div className="p-3 rounded-2xl border bg-white shadow-sm">
              <QRCode value={gcashNumber} size={160} />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Scan with GCash · or send to
            </p>
            <p className="text-lg font-bold tracking-widest">{gcashNumber}</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            GCash number not configured yet. Contact support.
          </p>
        )}
      </div>

      {/* Reference code */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground text-center">
          Include this in your GCash notes to speed up activation
        </p>
        {loading ? (
          <div className="h-14 rounded-xl bg-muted animate-pulse" />
        ) : refCode ? (
          <button
            onClick={copyRef}
            className="w-full flex items-center justify-between gap-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-3 active:bg-primary/10 transition-colors"
          >
            <span className="text-xl font-bold tracking-widest text-primary">{refCode}</span>
            <span className="flex items-center gap-1 text-xs text-primary font-medium shrink-0">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy'}
            </span>
          </button>
        ) : null}
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
          Not required — we can match your payment even without it. But including it helps
          if you have a new GCash number not registered with us.
        </p>
      </div>

      {/* Instructions */}
      <ol className="space-y-2 text-sm">
        {[
          'Open GCash and scan the QR code above (or tap Send Money and enter the number)',
          `Enter the exact amount: ₱${amountPesos.toFixed(2)}`,
          `Optionally paste your reference code in the Notes field`,
          'Send the payment',
          'Your plan will be activated automatically within a few minutes',
        ].map((step, i) => (
          <li key={i} className="flex gap-3 items-start">
            <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span className="text-sm text-muted-foreground leading-snug">{step}</span>
          </li>
        ))}
      </ol>

      <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
        Payment is verified automatically from our GCash notifications. If your plan
        isn&apos;t updated within 30 minutes, contact us at{' '}
        <a href="mailto:support@sigurado.xyz" className="underline">support@sigurado.xyz</a>.
      </p>
    </div>
  )
}

// ─── PlanCard ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  currentPlan,
  gcashNumber,
}: {
  plan: PlanDef
  currentPlan: Plan
  gcashNumber: string
}) {
  const [open, setOpen] = useState(false)
  const isCurrent = currentPlan === plan.id
  const isDowngrade = PLAN_RANK[plan.id] < PLAN_RANK[currentPlan]

  return (
    <div className={`rounded-2xl border-2 p-4 space-y-3 ${isCurrent ? 'border-primary' : 'border-border'}`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${plan.badge}`}>
            {plan.name}
          </span>
          {isCurrent && (
            <span className="text-xs font-medium text-primary">Current plan</span>
          )}
        </div>
        <span className="font-bold text-lg">{plan.price}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
      </div>

      {/* Features */}
      <ul className="space-y-1.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm">
            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {!isCurrent && !isDowngrade && (
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 active:opacity-90"
        >
          <Zap className="w-4 h-4" />
          Upgrade to {plan.name}
        </button>
      )}

      {/* Payment panel (inline expand) */}
      {open && (
        <PaymentPanel
          plan={plan}
          gcashNumber={gcashNumber}
          onClose={() => setOpen(false)}
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
}: {
  currentPlan: Plan
  clinicName: string
  gcashNumber: string
  recentlyConfirmedPlan: Plan | null
}) {
  const plansToShow = PLAN_DEFS.filter((p) => PLAN_RANK[p.id] >= PLAN_RANK[currentPlan])

  return (
    <div className="space-y-5 pb-4">
      <h1 className="text-xl font-bold">Subscription</h1>

      {/* Recently activated banner */}
      {recentlyConfirmedPlan && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-start gap-3">
          <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-800 text-sm">Plan activated!</p>
            <p className="text-xs text-emerald-700 mt-0.5">
              {clinicName} has been upgraded to the {recentlyConfirmedPlan} plan.
            </p>
          </div>
        </div>
      )}

      {/* Current plan summary */}
      <div className="rounded-2xl border bg-background px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Current plan</p>
          <p className="font-bold text-lg capitalize">{currentPlan.charAt(0) + currentPlan.slice(1).toLowerCase()}</p>
        </div>
        {currentPlan === 'FREE' && (
          <span className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            Up to 30 patients
          </span>
        )}
        {currentPlan !== 'FREE' && (
          <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
            {currentPlan === 'PRO' ? 'All features' : 'Core features'}
          </span>
        )}
      </div>

      {/* Plan cards */}
      {currentPlan === 'PRO' ? (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-violet-300 bg-violet-50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-100 text-violet-800">Pro</span>
              <span className="font-bold text-lg">₱999<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
            </div>
            <ul className="space-y-1.5">
              {[
                'Unlimited patients',
                'Scheduling & appointments',
                'Messenger reminders',
                'Loyalty cards & SC/PWD discounts',
                'Reports & data export',
                'Full privacy compliance suite',
                'Audit log & consent dashboard',
                'Breach / ASIR incident tools',
                'Employee management & payroll',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border bg-muted/30 px-4 py-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Renewing next month?</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Send <strong className="text-foreground">₱999.00</strong> to GCash <strong className="text-foreground">{gcashNumber || 'our GCash number'}</strong></p>
              <p>• Your plan will be reactivated automatically within the hour after we receive it.</p>
              <p>• No need to visit this page — just send the same amount each month.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {currentPlan === 'FREE'
              ? 'Upgrade to unlock more patients and features:'
              : 'Upgrade to Pro for the full compliance suite:'}
          </p>
          {plansToShow.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlan={currentPlan}
              gcashNumber={gcashNumber}
            />
          ))}
        </div>
      )}

      {/* What happens section */}
      {currentPlan !== 'PRO' && (
        <div className="rounded-2xl border bg-muted/30 px-4 py-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">How payment works</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• Monthly subscription — pay each month to keep your plan active.</p>
            <p>• Payment via GCash only for now. Scan the QR code and send the exact amount.</p>
            <p>• Your plan activates automatically once we receive your GCash payment — usually within minutes.</p>
            <p>• No automatic recurring charge. You choose to renew each month.</p>
          </div>
        </div>
      )}
    </div>
  )
}
