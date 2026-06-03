'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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

const SVC_STYLES = `
  @keyframes chipPop {
    0%   { transform: scale(0.85); }
    55%  { transform: scale(1.12); }
    80%  { transform: scale(0.96); }
    100% { transform: scale(1);    }
  }
  .chip-selected { animation: chipPop 0.25s cubic-bezier(0.34,1.56,0.64,1) both; }
`

const CAT_EMOJI: Record<string, string> = {
  Preventive:    '🛡️',
  Restorative:   '🔧',
  'Root Canal':  '🔩',
  Surgical:      '✂️',
  Prosthetics:   '👑',
  Orthodontics:  '😁',
  Cosmetic:      '✨',
  Pediatric:     '👶',
  Periodontic:   '🌿',
  Custom:        '⭐',
}

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

  const selectedCount = selected.size + customChips.length

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <style>{SVC_STYLES}</style>

      {/* Selected count badge */}
      <div className={`flex items-center justify-between rounded-2xl px-5 py-3 font-extrabold text-base transition-colors ${
        selectedCount > 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
      }`}>
        <span>{selectedCount > 0 ? `✓ ${selectedCount} service${selectedCount !== 1 ? 's' : ''} selected` : 'Tap to select services'}</span>
        {selectedCount > 0 && <span className="text-2xl">💪</span>}
      </div>

      {/* Prices note */}
      <div className="rounded-2xl bg-amber-50 border-2 border-amber-200 px-4 py-3 flex items-center gap-3">
        <span className="text-2xl">💡</span>
        <div>
          <p className="font-bold text-sm text-amber-900">Prices are set at checkout</p>
          <p className="text-xs text-amber-700">The secretary enters the price per patient when issuing a receipt.</p>
        </div>
      </div>

      {/* Chip grid per category */}
      <div className="flex flex-col gap-6">
        {CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl leading-none">{CAT_EMOJI[cat.label] ?? '🦷'}</span>
              <p className="text-sm font-extrabold text-foreground tracking-wide">{cat.label}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {cat.services.map((svc) => {
                const isSelected = selected.has(svc.name)
                return (
                  <button
                    key={svc.name}
                    type="button"
                    onClick={() => toggleChip(svc.name)}
                    className={[
                      'rounded-2xl border-2 px-4 py-2.5 text-sm font-bold min-h-[48px] transition-all duration-150 active:scale-95',
                      isSelected
                        ? 'chip-selected bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-white border-gray-200 text-gray-600',
                    ].join(' ')}
                  >
                    {isSelected ? `✓ ${svc.name}` : svc.name}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Custom chips */}
        {customChips.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl leading-none">{CAT_EMOJI['Custom']}</span>
              <p className="text-sm font-extrabold text-foreground tracking-wide">Custom</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {customChips.map((chip) => (
                <span
                  key={chip.id}
                  className="chip-selected inline-flex items-center gap-2 rounded-2xl border-2 px-4 py-2.5 text-sm font-bold min-h-[48px] bg-blue-600 text-white border-blue-600 shadow-md"
                >
                  ✓ {chip.name}
                  <button
                    type="button"
                    onClick={() => removeCustomChip(chip.id)}
                    className="text-white/70 hover:text-white leading-none text-base"
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
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 p-4">
          <p className="text-sm font-bold text-blue-800">Add your own service</p>
          <Input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Service name"
            className="min-h-[48px] rounded-xl"
            autoFocus
          />
          <Select value={customCategory} onValueChange={(v) => { if (v) setCustomCategory(v) }}>
            <SelectTrigger className="min-h-[48px] w-full rounded-xl">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setShowCustomInput(false)} className="flex-1 min-h-[48px] rounded-xl font-bold">
              Cancel
            </Button>
            <Button type="button" onClick={addCustomChip} disabled={!customName.trim()} className="flex-1 min-h-[48px] rounded-xl font-bold">
              Add ✓
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowCustomInput(true)}
          className="w-full min-h-[52px] rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 font-bold text-sm active:bg-gray-50 transition-colors"
        >
          ＋ Add a service not on the list
        </button>
      )}

      {error && <p className="text-sm text-destructive font-semibold">{error}</p>}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1 min-h-[52px] rounded-2xl font-bold text-base">
          ← Back
        </Button>
        <Button type="submit" disabled={isSaving} className="flex-1 min-h-[52px] rounded-2xl font-bold text-base">
          {isSaving ? 'Saving…' : 'Next →'}
        </Button>
      </div>
    </form>
  )
}
