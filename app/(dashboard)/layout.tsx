export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import BottomNav from './BottomNav'

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

  if (!user?.clinic?.onboardingComplete) redirect('/onboarding')

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="max-w-screen-sm mx-auto px-4 py-6">{children}</main>
      <BottomNav />
    </div>
  )
}
