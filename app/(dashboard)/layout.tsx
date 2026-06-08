export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import BottomNav from './BottomNav'
import { DPAAcceptanceBanner } from '@/components/DPAAcceptanceBanner'
import type { Plan } from '@/lib/entitlements'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: authUser.email! },
    include: { clinic: true },
  })

  // Deactivated staff — boot to login
  if (!user?.isActive) redirect('/login')

  if (!user?.clinic?.onboardingComplete) redirect('/onboarding')

  // NOTE: No time-based lockout. The Free tier is "free forever" (see landing page),
  // so clinics are never expired by elapsed time. The Free/Basic/Pro boundary is a
  // plan-entitlement concern (e.g. the 30-patient cap), not a clock. Re-introduce
  // enforcement here keyed to a subscription/plan field once billing exists —
  // never re-enable a blanket trialEndsAt redirect, which breaks the public promise.

  const needsDPA = !user.clinic.tosAcceptedAt
  const plan = user.clinic.plan as Plan

  return (
    <div className="min-h-screen bg-background pb-20">
      {needsDPA && <DPAAcceptanceBanner />}
      <main className="max-w-screen-sm mx-auto px-4 py-6">{children}</main>
      <BottomNav plan={plan} role={user.role} />
    </div>
  )
}
