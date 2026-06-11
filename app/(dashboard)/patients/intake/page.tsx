import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { IntakeForm } from './IntakeForm'

export default async function IntakePage() {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: authUser.email! },
    include: { clinic: true },
  })
  if (!user?.clinic) redirect('/onboarding')

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold font-heading">Patient Intake Form</h1>
        <p className="text-sm text-muted-foreground mt-1">Hand the tablet to the patient to fill out.</p>
      </div>
      <IntakeForm
        clinicName={user.clinic.name}
        clinicFacebookPageUrl={user.clinic.facebookPageUrl}
        clinicMessengerPageId={user.clinic.messengerPageId}
      />
    </div>
  )
}
