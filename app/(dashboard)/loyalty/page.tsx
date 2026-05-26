import { getLoyaltyCards, getClinicLoyaltySettings, getLoyaltyCardTemplate } from './actions'
import LoyaltyClient from './LoyaltyClient'

export const dynamic = 'force-dynamic'

export default async function LoyaltyPage() {
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
