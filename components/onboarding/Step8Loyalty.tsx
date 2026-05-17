'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface Step8LoyaltyProps {
  clinicId: string
  initialData: { loyaltyCardEnabled: boolean }
  onSave: (loyaltyCardEnabled: boolean) => Promise<void>
  onBack: () => void
  isSaving: boolean
}

const DISCOUNT_TABLE = [
  { service: 'Cleaning', tiers: '50% off ×2, then 25% off ×2' },
  { service: 'Tooth Filling', tiers: '50% off ×2, then 25% off ×2' },
  { service: 'Root Canal (RCT)', tiers: '10% off ×2' },
  { service: 'Dentures', tiers: '15% off ×2' },
  { service: 'Braces', tiers: '10% off ×2' },
  { service: 'Wisdom Tooth', tiers: '10% off ×2' },
  { service: 'Tooth Extraction', tiers: '20% off ×8' },
]

export function Step8Loyalty({ initialData, onSave, onBack, isSaving }: Step8LoyaltyProps) {
  const [enabled, setEnabled] = useState(initialData.loyaltyCardEnabled ?? true)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await onSave(enabled)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold mb-1">Loyalty Cards</h2>
        <p className="text-sm text-muted-foreground">Reward your patients with a loyalty card program.</p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between min-h-[48px]">
            <div>
              <Label className="text-base font-medium">
                Offer loyalty cards at this clinic?
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                {enabled ? 'Loyalty cards will be available at checkout.' : 'Loyalty cards will not be offered.'}
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
        </CardContent>
      </Card>

      {enabled && (
        <>
          <Card className="bg-primary/5">
            <CardHeader>
              <CardTitle className="text-sm">Loyalty Card Summary</CardTitle>
              <CardDescription>What patients get when they purchase a card</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-medium">₱500</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Validity</span>
                <span className="font-medium">2 years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Check-ups</span>
                <span className="font-medium">Free, unlimited</span>
              </div>
            </CardContent>
          </Card>

          <div>
            <h3 className="font-medium mb-3 text-sm">Included Discounts</h3>
            <div className="flex flex-col gap-2">
              {DISCOUNT_TABLE.map(row => (
                <Card key={row.service} size="sm">
                  <CardContent className="py-3 flex items-center justify-between">
                    <span className="font-medium text-sm">{row.service}</span>
                    <span className="text-xs text-muted-foreground text-right max-w-[180px]">
                      {row.tiers}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1 min-h-[48px]">
          ← Back
        </Button>
        <Button type="submit" disabled={isSaving} className="flex-1 min-h-[48px]">
          {isSaving ? 'Saving…' : 'Next →'}
        </Button>
      </div>
    </form>
  )
}
