import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { QRSection } from './QRSection'
import { PrinterSection } from './PrinterSection'

export default async function SettingsPage() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: { clinic: true },
  })

  if (!user?.clinic) redirect('/onboarding')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">{user.clinic.name}</p>
      </div>

      <QRSection clinicId={user.clinic.id} />
      <PrinterSection />
    </div>
  )
}
