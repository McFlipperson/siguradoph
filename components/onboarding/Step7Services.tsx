'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
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

const DEFAULT_SERVICES: ServiceData[] = [
  { name: 'Check-up / Consultation', category: 'CHECKUP', isActive: true, sortOrder: 1 },
  { name: 'Cleaning (Prophylaxis)', category: 'CLEANING', isActive: true, sortOrder: 2 },
  { name: 'Tooth Filling (Composite)', category: 'FILLING', isActive: true, sortOrder: 3 },
  { name: 'Tooth Extraction (Simple)', category: 'EXTRACTION', isActive: true, sortOrder: 4 },
  { name: 'Tooth Extraction (Surgical)', category: 'EXTRACTION', isActive: true, sortOrder: 5 },
  { name: 'Wisdom Tooth Extraction', category: 'EXTRACTION', isActive: true, sortOrder: 6 },
  { name: 'Root Canal Treatment (RCT)', category: 'RCT', isActive: true, sortOrder: 7 },
  { name: 'Jacket Crown', category: 'CROWN', isActive: true, sortOrder: 8 },
  { name: 'Fixed Bridge', category: 'BRIDGE', isActive: true, sortOrder: 9 },
  { name: 'Dentures (Full)', category: 'DENTURES', isActive: true, sortOrder: 10 },
  { name: 'Dentures (Partial)', category: 'DENTURES', isActive: true, sortOrder: 11 },
  { name: 'Braces', category: 'BRACES', isActive: true, sortOrder: 12 },
  { name: 'Retainer', category: 'RETAINER', isActive: true, sortOrder: 13 },
]

export function Step7Services({ initialData, onSave, onBack, isSaving }: Step7ServicesProps) {
  const [services, setServices] = useState<ServiceData[]>(
    initialData.length > 0 ? initialData : DEFAULT_SERVICES
  )
  const [error, setError] = useState<string | null>(null)

  function update(index: number, field: keyof ServiceData, value: string | boolean | number) {
    setServices(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function moveUp(index: number) {
    if (index === 0) return
    setServices(prev => {
      const next = [...prev]
      const tmp = next[index - 1]
      next[index - 1] = { ...next[index], sortOrder: index }
      next[index] = { ...tmp, sortOrder: index + 1 }
      return next
    })
  }

  function moveDown(index: number) {
    if (index === services.length - 1) return
    setServices(prev => {
      const next = [...prev]
      const tmp = next[index + 1]
      next[index + 1] = { ...next[index], sortOrder: index + 2 }
      next[index] = { ...tmp, sortOrder: index + 1 }
      return next
    })
  }

  function addService() {
    setServices(prev => [
      ...prev,
      { name: '', category: 'OTHER', isActive: true, sortOrder: prev.length + 1 },
    ])
  }

  function removeService(index: number) {
    setServices(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, sortOrder: i + 1 })))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const valid = services.filter(s => s.name.trim() !== '')
    if (valid.length === 0) {
      setError('At least one service is required.')
      return
    }
    try {
      await onSave(valid)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold mb-1">Service Catalog</h2>
        <p className="text-sm text-muted-foreground">Set up the services your clinic offers.</p>
      </div>

      <Card className="bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="pt-4">
          <p className="text-sm font-medium">
            Prices are NOT set here.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            The secretary enters the price per patient at checkout.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        {services.map((service, idx) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="text-muted-foreground text-xs">#{idx + 1}</span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    aria-label="Move up"
                  >
                    ↑
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => moveDown(idx)}
                    disabled={idx === services.length - 1}
                    aria-label="Move down"
                  >
                    ↓
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeService(idx)}
                  >
                    Remove
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label>Service Name</Label>
                <Input
                  value={service.name}
                  onChange={e => update(idx, 'name', e.target.value)}
                  className="min-h-[48px]"
                  placeholder="e.g. Tooth Cleaning"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Category</Label>
                <Select
                  value={service.category}
                  onValueChange={(val) => { if (val) update(idx, 'category', val) }}
                >
                  <SelectTrigger className="min-h-[48px] w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between min-h-[40px]">
                <Label>Active</Label>
                <Switch
                  checked={service.isActive}
                  onCheckedChange={(checked: boolean) => update(idx, 'isActive', checked)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addService} className="min-h-[48px]">
        + Add Service
      </Button>

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
