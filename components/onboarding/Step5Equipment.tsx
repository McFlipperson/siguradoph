'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { EquipmentData } from '@/app/(onboarding)/onboarding/actions'

interface Step5EquipmentProps {
  clinicId: string
  initialData: EquipmentData[]
  onSave: (data: EquipmentData[]) => Promise<void>
  onBack: () => void
  isSaving: boolean
}

const SUGGESTIONS = [
  'Dental Chair',
  'Dental Unit',
  'Autoclave',
  'X-Ray Machine',
  'Dental Compressor',
  'Light Cure Unit',
  'Ultrasonic Scaler',
]

const LIFE_OPTIONS = [3, 5, 10] as const

const today = new Date().toISOString().split('T')[0]

function emptyRow(): EquipmentData & { usefulLifeCustom?: number; lifeOption?: string } {
  return { name: '', purchaseDate: '', purchaseCost: 0, usefulLifeYears: 5, usefulLifeCustom: undefined, lifeOption: '5' }
}

type EquipmentRow = EquipmentData & { lifeOption?: string; usefulLifeCustom?: number }

function fmt(n: number) {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function Step5Equipment({ initialData, onSave, onBack, isSaving }: Step5EquipmentProps) {
  const [rows, setRows] = useState<EquipmentRow[]>(() => {
    if (initialData.length > 0) {
      return initialData.map(eq => ({
        ...eq,
        lifeOption: [3, 5, 10].includes(eq.usefulLifeYears) ? String(eq.usefulLifeYears) : 'other',
        usefulLifeCustom: [3, 5, 10].includes(eq.usefulLifeYears) ? undefined : eq.usefulLifeYears,
      }))
    }
    return [emptyRow(), emptyRow(), emptyRow()]
  })
  const [error, setError] = useState<string | null>(null)

  function update(index: number, field: keyof EquipmentRow, value: string | number) {
    setRows(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function fillFromChip(name: string) {
    const firstEmpty = rows.findIndex(r => r.name.trim() === '')
    if (firstEmpty >= 0) {
      update(firstEmpty, 'name', name)
    } else {
      setRows(prev => [...prev, { ...emptyRow(), name }])
    }
  }

  function addRow() {
    setRows(prev => [...prev, emptyRow()])
  }

  function removeRow(index: number) {
    if (rows.length <= 1) return
    setRows(prev => prev.filter((_, i) => i !== index))
  }

  function handleLifeChange(index: number, val: string) {
    setRows(prev => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        lifeOption: val,
        usefulLifeYears: val === 'other' ? (next[index].usefulLifeCustom ?? 5) : Number(val),
      }
      return next
    })
  }

  function handleLifeCustom(index: number, val: number) {
    setRows(prev => {
      const next = [...prev]
      next[index] = {
        ...next[index],
        usefulLifeCustom: val,
        usefulLifeYears: val,
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const valid = rows.filter(r => r.name.trim() !== '' && r.purchaseDate !== '' && r.purchaseCost > 0)
    try {
      await onSave(valid.map(r => ({
        name: r.name,
        purchaseDate: r.purchaseDate,
        purchaseCost: r.purchaseCost,
        usefulLifeYears: r.usefulLifeYears,
      })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold mb-1">Equipment</h2>
        <p className="text-sm text-muted-foreground">Track clinic equipment for depreciation and asset management.</p>
      </div>

      {/* Chip suggestions */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Tap to add:</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map(name => (
            <Badge
              key={name}
              variant="outline"
              className="cursor-pointer min-h-[36px] px-3 select-none hover:bg-muted"
              onClick={() => fillFromChip(name)}
            >
              {name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {rows.map((row, idx) => {
          const annualDep = row.purchaseCost > 0 && row.usefulLifeYears > 0
            ? row.purchaseCost / row.usefulLifeYears
            : 0

          return (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  Equipment {idx + 1}
                  {rows.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeRow(idx)}
                    >
                      Remove
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label>Name</Label>
                  <Input
                    value={row.name}
                    onChange={e => update(idx, 'name', e.target.value)}
                    className="min-h-[48px]"
                    placeholder="e.g. Dental Chair"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Purchase Date</Label>
                  <Input
                    type="date"
                    value={row.purchaseDate}
                    onChange={e => update(idx, 'purchaseDate', e.target.value)}
                    max={today}
                    className="min-h-[48px]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Purchase Cost (₱)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.purchaseCost || ''}
                    onChange={e => update(idx, 'purchaseCost', parseFloat(e.target.value) || 0)}
                    className="min-h-[48px]"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Useful Life (Years)</Label>
                  <Select
                    value={row.lifeOption ?? '5'}
                    onValueChange={(val) => { if (val) handleLifeChange(idx, val) }}
                  >
                    <SelectTrigger className="min-h-[48px] w-full">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {LIFE_OPTIONS.map(y => (
                        <SelectItem key={y} value={String(y)}>{y} years</SelectItem>
                      ))}
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {row.lifeOption === 'other' && (
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={row.usefulLifeCustom ?? ''}
                      onChange={e => handleLifeCustom(idx, parseInt(e.target.value) || 1)}
                      className="min-h-[48px]"
                      placeholder="Enter years"
                    />
                  )}
                </div>
                {annualDep > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Annual depreciation: ₱{fmt(annualDep)}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Button type="button" variant="outline" onClick={addRow} className="min-h-[48px]">
        + Add Equipment
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
