import Link from 'next/link'
import { Lock } from 'lucide-react'
import { PLAN_LABELS, type Plan } from '@/lib/entitlements'

/**
 * Shown in place of a feature when the clinic's plan doesn't include it.
 * Server-rendered — pairs with the server-side plan check on each gated page.
 */
export function UpgradeRequired({
  title,
  description,
  planNeeded,
}: {
  title: string
  description: string
  planNeeded: Plan
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-4 py-16 px-6">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Lock className="w-6 h-6 text-primary" />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h1 className="text-lg font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <div className="rounded-xl bg-muted/50 border px-4 py-2.5 text-sm">
        Available on the <span className="font-semibold text-primary">{PLAN_LABELS[planNeeded]}</span> plan
      </div>
      <Link
        href="/settings"
        className="inline-block font-semibold text-sm px-6 py-3 rounded-xl bg-primary text-primary-foreground"
      >
        Upgrade your plan
      </Link>
      <p className="text-xs text-muted-foreground max-w-xs">
        Message us to upgrade — we&apos;ll switch your clinic over as soon as payment is confirmed.
      </p>
    </div>
  )
}
