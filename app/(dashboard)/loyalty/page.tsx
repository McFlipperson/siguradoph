import { getLoyaltyCards, getClinicLoyaltySettings } from './actions'
import LoyaltyClient from './LoyaltyClient'

export const dynamic = 'force-dynamic'

export default async function LoyaltyPage() {
  const [cards, settings] = await Promise.all([
    getLoyaltyCards(),
    getClinicLoyaltySettings(),
  ])
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Loyalty Cards</h1>
      <LoyaltyClient cards={cards} settings={settings} />
    </div>
  )
}
