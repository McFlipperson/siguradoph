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
    select: {
      isActive: true,
      role: true,
      clinic: {
        select: {
          onboardingComplete: true,
          tosAcceptedAt: true,
          plan: true,
        },
      },
    },
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
      {/* Support chat button */}
      <a
        href="https://m.me/1203826462804267"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-4 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#0084FF] text-white shadow-lg active:opacity-90"
        aria-label="Chat with SiguradoPH support"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.908 1.444 5.504 3.713 7.205V22l3.387-1.865A10.83 10.83 0 0012 20.486c5.523 0 10-4.145 10-9.243S17.523 2 12 2zm1.05 12.454l-2.55-2.72-4.974 2.72 5.474-5.808 2.612 2.72 4.912-2.72-5.474 5.808z"/>
        </svg>
      </a>
    </div>
  )
}
