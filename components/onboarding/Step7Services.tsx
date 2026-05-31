'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ServiceData } from '@/app/(onboarding)/onboarding/actions'

interface Step7ServicesProps {
  clinicId: string
  initialData: ServiceData[]
  onSave: (data: ServiceData[]) => Promise<void>
  onBack: () => void
  isSaving: boolean
}

// ─── Master service list ───────────────────────────────────────────────────────

type ChipDef = { name: string; category: string; preSelected: boolean }

const CATEGORIES: Array<{ label: string; services: ChipDef[] }> = [
  {
    label: 'Preventive',
    services: [
      { name: 'Check-up / Consultation', category: 'CHECKUP', preSelected: true },
      { name: 'Dental Cleaning (Prophylaxis)', category: 'CLEANING', preSelected: true },
      { name: 'Fluoride Treatment', category: 'CLEANING', preSelected: false },
      { name: 'Pit & Fissure Sealants', category: 'OTHER', preSelected: false },
      { name: 'Periapical X-Ray', category: 'OTHER', preSelected: false },
      { name: 'Panoramic X-Ray (OPG)', category: 'OTHER', preSelected: false },
    ],
  },
  {
    label: 'Restorative',
    services: [
      { name: 'Tooth Filling (Composite)', category: 'FILLING', preSelected: true },
      { name: 'Composite Filling (Anterior)', category: 'FILLING', preSelected: false },
      { name: 'Amalgam Filling', category: 'FILLING', preSelected: false },
      { name: 'Glass Ionomer Filling', category: 'FILLING', preSelected: false },
    ],
  },
  {
    label: 'Root Canal',
    services: [
      { name: 'Root Canal Treatment (RCT)', category: 'RCT', preSelected: true },
      { name: 'Root Canal - Anterior', category: 'RCT', preSelected: false },
      { name: 'Root Canal - Premolar', category: 'RCT', preSelected: false },
    ],
  },
  {
    label: 'Surgical',
    services: [
      { name: 'Tooth Extraction (Simple)', category: 'EXTRACTION', preSelected: true },
      { name: 'Tooth Extraction (Surgical)', category: 'EXTRACTION', preSelected: true },
      { name: 'Wisdom Tooth Removal', category: 'EXTRACTION', preSelected: true },
      { name: 'Dental Implant', category: 'EXTRACTION', preSelected: false },
    ],
  },
  {
    label: 'Prosthetics',
    services: [
      { name: 'Jacket Crown', category: 'CROWN', preSelected: true },
      { name: 'PFM Crown', category: 'CROWN', preSelected: false },
      { name: 'Zirconia Crown', category: 'CROWN', preSelected: false },
      { name: 'Fixed Bridge', category: 'BRIDGE', preSelected: true },
      { name: 'Dentures (Full)', category: 'DENTURES', preSelected: true },
      { name: 'Dentures (Partial)', category: 'DENTURES', preSelected: true },
      { name: 'Temporary / Flipper', category: 'DENTURES', preSelected: false },
    ],
  },
  {
    label: 'Orthodontics',
    services: [
      { name: 'Braces', category: 'BRACES', preSelected: true },
      { name: 'Ceramic Braces', category: 'BRACES', preSelected: false },
      { name: 'Clear Aligners', category: 'BRACES', preSelected: false },
      { name: 'Retainer', category: 'RETAINER', preSelected: true },
      { name: 'Fixed Retainer', category: 'RETAINER', preSelected: false },
    ],
  },
  {
    label: 'Cosmetic',
    services: [
      { name: 'Teeth Whitening (In-Office)', category: 'OTHER', preSelected: false },
      { name: 'Teeth Whitening (Take-Home)', category: 'OTHER', preSelected: false },
      { name: 'Dental Veneers', category: 'OTHER', preSelected: false },
      { name: 'Dental Bonding', category: 'OTHER', preSelected: false },
    ],
  },
  {
    label: 'Pediatric',
    services: [
      { name: 'Baby Tooth Extraction', category: 'EXTRACTION', preSelected: false },
      { name: 'Space Maintainer', category: 'OTHER', preSelected: false },
    ],
  },
  {
    label: 'Periodontic',
    services: [
      { name: 'Scaling & Root Planing', category: 'CLEANING', preSelected: false },
      { name: 'Gum Treatment', category: 'OTHER', preSelected: false },
    ],
  },
]

const SERVICE_CATEGORIES = [
  { value: 'CHECKUP', label: 'Check-up' },
  { value: 'CLEANING', label: 'Cleaning' },
  { value: 'FILLING', label: 'Filling' },
  { value: 'EXTRACTION', label: 'Extraction' },
  { value: 'RCT', label: 'Root Canal' },
  { value: 'CROWN', label: 'Crown' },
  { value: 'BRIDGE', label: 'Bridge' },
  { value: 'DENTURES', label: 'Dentures' },
  { value: 'BRACES', label: 'Braces' },
  { value: 'RETAINER', label: 'Retainer' },
  { value: 'OTHER', label: 'Other' },
]

// Build initial selected set from initialData or from pre-selected defaults
function buildInitialSelected(initialData: ServiceData[]): Set<string> {
  if (initialData.length > 0) {
    const names = new Set(initialData.map((s) => s.name))
    return names
  }
  const defaults = new Set<string>()
  for (const cat of CATEGORIES) {
    for (const svc of cat.services) {
      if (svc.preSelected) defaults.add(svc.name)
    }
  }
  return defaults
}

type CustomChip = { id: string; name: string; category: string }

export function Step7Services({ initialData, onSave, onBack, isSaving }: Step7ServicesProps) {
  const [selected, setSelected] = useState<Set<string>>(() => buildInitialSelected(initialData))
  const [customChips, setCustomChips] = useState<CustomChip[]>([])
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customCategory, setCustomCategory] = useState('OTHER')
  const [error, setError] = useState<string | null>(null)

  function toggleChip(name: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function addCustomChip() {
    const name = customName.trim()
    if (!name) return
    const id = `custom-${Date.now()}-${Math.random()}`
    setCustomChips((prev) => [...prev, { id, name, category: customCategory }])
    setCustomName('')
    setCustomCategory('OTHER')
    setShowCustomInput(false)
  }

  function removeCustomChip(id: string) {
    setCustomChips((prev) => prev.filter((c) => c.id !== id))
  }

  // Get category for a built-in service name
  function getCategoryForName(name: string): string {
    for (const cat of CATEGORIES) {
      const svc = cat.services.find((s) => s.name === name)
      if (svc) return svc.category
    }
    return 'OTHER'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const builtIn: ServiceData[] = []
    let order = 1
    for (const cat of CATEGORIES) {
      for (const svc of cat.services) {
        if (selected.has(svc.name)) {
          builtIn.push({ name: svc.name, category: getCategoryForName(svc.name), isActive: true, sortOrder: order++ })
        }
      }
    }
    const customs: ServiceData[] = customChips.map((c) => ({
      name: c.name,
      category: c.category,
      isActive: true,
      sortOrder: order++,
    }))

    const all = [...builtIn, ...customs]
    if (all.length === 0) {
      setError('Select at least one service.')
      return
    }

    try {
      await onSave(all)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold mb-1">Service Catalog</h2>
        <p className="text-sm text-muted-foreground">
          Tap to select the treatments your clinic offers. We&apos;ve pre-selected the most common ones.
          You can change this anytime in Settings.
        </p>
      </div>

      {/* Amber prices card */}
      <Card className="bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="pt-4">
          <p className="text-sm font-medium">Prices are NOT set here.</p>
          <p className="text-xs text-muted-foreground mt-1">
            The secretary enters the price per patient at checkout.
          </p>
        </CardContent>
      </Card>

      {/* Chip grid per category */}
      <div className="flex flex-col gap-5">
        {CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
              {cat.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {cat.services.map((svc) => {
                const isSelected = selected.has(svc.name)
                return (
                  <button
                    key={svc.name}
                    type="button"
                    onClick={() => toggleChip(svc.name)}
                    className={[
                      'rounded-full border px-3 py-2 text-sm font-medium min-h-[40px] transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border text-muted-foreground',
                    ].join(' ')}
                  >
                    {svc.name}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Custom chips */}
        {customChips.length > 0 && (
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
              Custom
            </p>
            <div className="flex flex-wrap gap-2">
              {customChips.map((chip) => (
                <span
                  key={chip.id}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium min-h-[40px] bg-primary text-primary-foreground border-primary"
                >
                  {chip.name}
                  <button
                    type="button"
                    onClick={() => removeCustomChip(chip.id)}
                    className="text-primary-foreground/70 hover:text-primary-foreground leading-none"
                    aria-label={`Remove ${chip.name}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add custom service */}
      {showCustomInput ? (
        <div className="flex flex-col gap-3 rounded-xl border bg-background p-4">
          <p className="text-sm font-medium">Add custom service</p>
          <Input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Service name"
            className="min-h-[48px]"
            autoFocus
          />
          <Select value={customCategory} onValueChange={(v) => { if (v) setCustomCategory(v) }}>
            <SelectTrigger className="min-h-[48px] w-full">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setShowCustomInput(false)} className="flex-1 min-h-[48px]">
              Cancel
            </Button>
            <Button type="button" onClick={addCustomChip} disabled={!customName.trim()} className="flex-1 min-h-[48px]">
              Add
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowCustomInput(true)}
          className="min-h-[48px]"
        >
          + Add custom service
        </Button>
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
