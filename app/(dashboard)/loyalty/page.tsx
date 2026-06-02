import { getLoyaltyCards, getClinicLoyaltySettings, getLoyaltyCardTemplate } from './actions'
import LoyaltyClient from './LoyaltyClient'
import { getSessionUser, getClinicPlan } from '@/lib/auth'
import { planAllows } from '@/lib/entitlements'
import { UpgradeRequired } from '@/components/UpgradeRequired'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function LoyaltyPage() {
  const user = await getSessionUser()
  if (!user?.clinicId) redirect('/login')
  const plan = await getClinicPlan(user.clinicId)
  if (!planAllows(plan, 'loyalty')) {
    return <UpgradeRequired
      title="Loyalty Cards"
      description="Reward repeat patients with discount cards for cleanings, fillings, and more — and apply them automatically at checkout."
      planNeeded="BASIC" />
  }

  const [cards, settings, template] = await Promise.all([
    getLoyaltyCards(),
    getClinicLoyaltySettings(),
    getLoyaltyCardTemplate(),
  ])
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Loyalty Cards</h1>
      <LoyaltyClient cards={cards} settings={settings} template={template} />
    </div>
  )
}
