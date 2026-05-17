export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: { clinic: true },
  })

  if (!user?.clinic?.onboardingComplete) redirect('/onboarding')

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-screen-sm mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
