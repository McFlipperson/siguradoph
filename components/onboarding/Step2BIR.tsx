'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Step2Data } from '@/app/(onboarding)/onboarding/actions'
import { EntityType, FilingMethod } from '@prisma/client'

interface Step2BIRProps {
  clinicId: string
  initialData: Partial<Step2Data>
  onSave: (data: Step2Data) => Promise<void>
  onBack: () => void
  isSaving: boolean
}

function formatTin(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 12)
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9), digits.slice(9, 12)]
  return parts.filter(p => p.length > 0).join('-')
}

export function Step2BIR({ initialData, onSave, onBack, isSaving }: Step2BIRProps) {
  const [form, setForm] = useState<Step2Data>({
    tin: initialData.tin ?? '',
    rdoCode: initialData.rdoCode ?? '',
    corNumber: initialData.corNumber ?? '',
    entityType: initialData.entityType ?? 'SOLE_PROPRIETOR',
    vatRegistered: initialData.vatRegistered ?? true,
    vatRegistrationDate: initialData.vatRegistrationDate ?? '',
    orSeriesStart: initialData.orSeriesStart ?? '0001',
    filingMethod: initialData.filingMethod ?? 'EBIRFORMS',
  })
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof Step2Data>(field: K, value: Step2Data[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleTinInput(e: React.ChangeEvent<HTMLInputElement>) {
    set('tin', formatTin(e.target.value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await onSave(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold mb-1">BIR (Bureau of Internal Revenue) Registration</h2>
        <p className="text-sm text-muted-foreground">Your official tax details. These are found on the documents you received when you registered your business with the BIR (Bureau of Internal Revenue).</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tin">TIN (Tax Identification Number) *</Label>
        <Input
          id="tin"
          value={form.tin}
          onChange={handleTinInput}
          required
          className="min-h-[48px]"
          placeholder="XXX-XXX-XXX-XXX"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="rdoCode">RDO (Revenue District Office) Code *</Label>
        <Input
          id="rdoCode"
          value={form.rdoCode}
          onChange={e => set('rdoCode', e.target.value)}
          required
          className="min-h-[48px]"
          placeholder="e.g. 083"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="corNumber">COR (Certificate of Registration) Number *</Label>
        <Input
          id="corNumber"
          value={form.corNumber}
          onChange={e => set('corNumber', e.target.value)}
          required
          className="min-h-[48px]"
          placeholder="Certificate of Registration number"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Entity Type *</Label>
        <Select
          value={form.entityType}
          onValueChange={(val) => { if (val) set('entityType', val as EntityType) }}
        >
          <SelectTrigger className="min-h-[48px] w-full">
            <SelectValue placeholder="Select entity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SOLE_PROPRIETOR">Sole Proprietor</SelectItem>
            <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
            <SelectItem value="CORPORATION">Corporation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between min-h-[48px]">
        <div>
          <Label>VAT (Value Added Tax) Registered</Label>
          <p className="text-xs text-muted-foreground">Are you registered for VAT (Value Added Tax) with the BIR (Bureau of Internal Revenue)?</p>
        </div>
        <Switch
          checked={form.vatRegistered}
          onCheckedChange={(checked: boolean) => set('vatRegistered', checked)}
        />
      </div>

      {form.vatRegistered && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="vatRegistrationDate">VAT (Value Added Tax) Registration Date</Label>
          <Input
            id="vatRegistrationDate"
            type="date"
            value={form.vatRegistrationDate}
            onChange={e => set('vatRegistrationDate', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="min-h-[48px]"
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="orSeriesStart">OR (Official Receipt) Series Start *</Label>
        <Input
          id="orSeriesStart"
          value={form.orSeriesStart}
          onChange={e => set('orSeriesStart', e.target.value)}
          required
          className="min-h-[48px]"
          placeholder="e.g. 0001"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Filing Method *</Label>
        <Select
          value={form.filingMethod}
          onValueChange={(val) => { if (val) set('filingMethod', val as FilingMethod) }}
        >
          <SelectTrigger className="min-h-[48px] w-full">
            <SelectValue placeholder="Select filing method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EBIRFORMS">eBIRForms</SelectItem>
            <SelectItem value="EFPS">eFPS</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Fiscal Year</CardTitle>
          <CardDescription>Calendar Year — January to December</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Your BIR filing follows the calendar year (Jan–Dec).</p>
        </CardContent>
      </Card>

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
