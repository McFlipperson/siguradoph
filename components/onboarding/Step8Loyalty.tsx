'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import type { Step8Data, LoyaltyTemplateRow } from '@/app/(onboarding)/onboarding/actions'

interface Step8LoyaltyProps {
  initialData: Partial<Step8Data>
  onSave: (data: Step8Data) => Promise<void>
  onBack: () => void
  isSaving: boolean
}

const DEFAULT_TEMPLATES: LoyaltyTemplateRow[] = [
  { serviceName: 'Check-up', isFree: true, tier1Uses: 0, tier1Discount: 0 },
  { serviceName: 'Cleaning', isFree: false, tier1Uses: 2, tier1Discount: 50, tier2Uses: 2, tier2Discount: 25 },
  { serviceName: 'Tooth Filling', isFree: false, tier1Uses: 2, tier1Discount: 50, tier2Uses: 2, tier2Discount: 25 },
  { serviceName: 'RCT (Root Canal)', isFree: false, tier1Uses: 2, tier1Discount: 10 },
  { serviceName: 'Dentures', isFree: false, tier1Uses: 2, tier1Discount: 15 },
  { serviceName: 'Braces', isFree: false, tier1Uses: 2, tier1Discount: 10 },
  { serviceName: 'Wisdom Tooth', isFree: false, tier1Uses: 2, tier1Discount: 10 },
  { serviceName: 'Tooth Extraction', isFree: false, tier1Uses: 8, tier1Discount: 20 },
  { serviceName: 'Jacket Crown', isFree: false, tier1Uses: 2, tier1Discount: 10 },
  { serviceName: 'Fixed Bridge', isFree: false, tier1Uses: 2, tier1Discount: 10 },
  { serviceName: 'Retainer', isFree: false, tier1Uses: 2, tier1Discount: 10 },
]

function blankRow(): LoyaltyTemplateRow {
  return { serviceName: '', isFree: false, tier1Uses: 2, tier1Discount: 10 }
}

export function Step8Loyalty({ initialData, onSave, onBack, isSaving }: Step8LoyaltyProps) {
  const [enabled, setEnabled] = useState(initialData.loyaltyCardEnabled ?? true)
  const [price, setPrice] = useState(initialData.loyaltyCardPrice ?? 500)
  const [validityValue, setValidityValue] = useState<number>(() => {
    const m = initialData.loyaltyValidityMonths ?? 24
    return m % 12 === 0 ? m / 12 : m
  })
  const [validityUnit, setValidityUnit] = useState<'months' | 'years'>(() => {
    const m = initialData.loyaltyValidityMonths ?? 24
    return m % 12 === 0 ? 'years' : 'months'
  })
  const [templates, setTemplates] = useState<LoyaltyTemplateRow[]>(
    initialData.templates && initialData.templates.length > 0
      ? initialData.templates
      : DEFAULT_TEMPLATES
  )
  const [error, setError] = useState<string | null>(null)

  function updateRow(idx: number, patch: Partial<LoyaltyTemplateRow>) {
    setTemplates(prev => prev.map((r, i) => i === idx ? { ...r, ...patch } : r))
  }

  function removeRow(idx: number) {
    setTemplates(prev => prev.filter((_, i) => i !== idx))
  }

  function addRow() {
    setTemplates(prev => [...prev, blankRow()])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const loyaltyValidityMonths = validityUnit === 'years' ? validityValue * 12 : validityValue
      await onSave({
        loyaltyCardEnabled: enabled,
        loyaltyCardPrice: price,
        loyaltyValidityMonths,
        templates: enabled ? templates.filter(t => t.serviceName.trim() !== '') : [],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold mb-1">Loyalty Cards</h2>
        <p className="text-sm text-muted-foreground">Design your own patient loyalty program.</p>
      </div>

      {/* Enable toggle */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between min-h-[48px]">
            <div>
              <p className="font-medium">Enable Loyalty Card Program</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {enabled ? 'Patients can purchase a loyalty card at checkout.' : 'Loyalty cards will not be offered at this clinic.'}
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardContent>
      </Card>

      {enabled && (
        <>
          {/* Card Settings */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Card Settings</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <Label>Card Price (₱)</Label>
              <p className="text-xs text-muted-foreground -mt-1">How much does a patient pay to purchase a loyalty card?</p>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={price || ''}
                onChange={e => setPrice(parseFloat(e.target.value) || 0)}
                className="min-h-[48px]"
                placeholder="500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Validity Period</Label>
              <p className="text-xs text-muted-foreground -mt-1">How long is the card valid from date of purchase?</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={validityValue || ''}
                  onChange={e => setValidityValue(parseInt(e.target.value) || 1)}
                  className="min-h-[48px] flex-1"
                  placeholder="1"
                />
                <select
                  value={validityUnit}
                  onChange={e => setValidityUnit(e.target.value as 'months' | 'years')}
                  className="min-h-[48px] rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
              </div>
            </div>
          </div>

          {/* Service Discounts */}
          <div className="space-y-1 mt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Service Discounts</p>
            <p className="text-xs text-muted-foreground">Configure what discounts cardholders receive per service.</p>
          </div>

          <div className="flex flex-col gap-3">
            {templates.map((row, idx) => (
              <Card key={idx}>
                <CardContent className="pt-3 pb-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <Input
                      value={row.serviceName}
                      onChange={e => updateRow(idx, { serviceName: e.target.value })}
                      placeholder="Service name"
                      className="min-h-[40px] text-sm font-medium border-0 px-0 shadow-none focus-visible:ring-0"
                    />
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      className="text-muted-foreground hover:text-destructive text-lg ml-2 leading-none shrink-0"
                      aria-label="Remove service"
                    >
                      ×
                    </button>
                  </div>

                  {/* Free toggle */}
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={row.isFree}
                      onCheckedChange={v => updateRow(idx, { isFree: v })}
                      id={`free-${idx}`}
                    />
                    <Label htmlFor={`free-${idx}`} className="text-sm font-normal">
                      {row.isFree ? 'Free / unlimited' : 'Discount by percentage'}
                    </Label>
                  </div>

                  {!row.isFree && (
                    <>
                      {/* Tier 1 */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Tier 1</p>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label className="text-xs">Uses</Label>
                            <Input
                              type="number"
                              min="1"
                              value={row.tier1Uses || ''}
                              onChange={e => updateRow(idx, { tier1Uses: parseInt(e.target.value) || 0 })}
                              className="min-h-[44px] mt-1"
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs">Discount %</Label>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              value={row.tier1Discount || ''}
                              onChange={e => updateRow(idx, { tier1Discount: parseFloat(e.target.value) || 0 })}
                              className="min-h-[44px] mt-1"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Tier 2 (optional) */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Tier 2 <span className="italic">(optional)</span></p>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Label className="text-xs">Uses</Label>
                            <Input
                              type="number"
                              min="1"
                              value={row.tier2Uses ?? ''}
                              onChange={e => updateRow(idx, { tier2Uses: e.target.value === '' ? null : parseInt(e.target.value) || 0 })}
                              className="min-h-[44px] mt-1"
                              placeholder="—"
                            />
                          </div>
                          <div className="flex-1">
                            <Label className="text-xs">Discount %</Label>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              value={row.tier2Discount ?? ''}
                              onChange={e => updateRow(idx, { tier2Discount: e.target.value === '' ? null : parseFloat(e.target.value) || 0 })}
                              className="min-h-[44px] mt-1"
                              placeholder="—"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}

            <Button type="button" variant="outline" onClick={addRow} className="min-h-[48px]">
              + Add Service
            </Button>
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
