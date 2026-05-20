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
        <p className="text-sm text-muted-foreground">All the information on this page comes from one document — your BIR Certificate of Registration (COR).</p>
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 space-y-1">
        <p className="text-xs font-semibold text-amber-800">📄 Before you continue — get this document out</p>
        <p className="text-xs text-amber-700 leading-relaxed">
          Find your <strong>BIR (Bureau of Internal Revenue) Certificate of Registration (COR)</strong> — it&apos;s the official document your BIR branch gave you when you registered your clinic as a business. By law it should be displayed on your clinic wall. Every answer on this page is printed on that one piece of paper. If you can&apos;t find it, ask your accountant.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tin">TIN (Tax Identification Number) *</Label>
        <p className="text-xs text-muted-foreground -mt-1">Your 12-digit tax ID number from the BIR (Bureau of Internal Revenue). Find it on your COR (Certificate of Registration) — the document you received when you registered your business. It looks like: 123-456-789-000.</p>
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
        <p className="text-xs text-muted-foreground -mt-1">A 2–3 digit number that identifies the BIR (Bureau of Internal Revenue) branch your business belongs to. It&apos;s printed on your COR (Certificate of Registration) — look for "RDO" or "Revenue District Office." Example: 044, 083.</p>
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
        <p className="text-xs text-muted-foreground -mt-1">The reference number printed at the top of your BIR (Bureau of Internal Revenue) Certificate of Registration. This is the physical document issued by the BIR that says you are officially registered as a business.</p>
        <Input
          id="corNumber"
          value={form.corNumber}
          onChange={e => set('corNumber', e.target.value)}
          required
          className="min-h-[48px]"
          placeholder="e.g. RC0000123456"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Entity Type *</Label>
        <p className="text-xs text-muted-foreground -mt-1">How is your business legally set up? <strong>Sole Proprietor</strong> = you own and run it yourself. <strong>Partnership</strong> = two or more people own it together. <strong>Corporation</strong> = registered as a company (has its own separate legal identity). Most individual dentists choose Sole Proprietor.</p>
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

      <div className="flex items-start justify-between min-h-[48px] gap-4">
        <div className="flex-1">
          <Label>VAT (Value Added Tax) Registered</Label>
          <p className="text-xs text-muted-foreground mt-0.5">Turn this ON if you are registered for VAT (Value Added Tax) with the BIR (Bureau of Internal Revenue). Your COR (Certificate of Registration) will say "VAT" if you are. If you&apos;re not sure, check with your accountant — most clinics earning over ₱3 million a year are VAT registered.</p>
        </div>
        <Switch
          checked={form.vatRegistered}
          onCheckedChange={(checked: boolean) => set('vatRegistered', checked)}
          className="mt-1 shrink-0"
        />
      </div>

      {form.vatRegistered && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="vatRegistrationDate">VAT (Value Added Tax) Registration Date</Label>
          <p className="text-xs text-muted-foreground -mt-1">The date you officially became VAT (Value Added Tax) registered. This is printed on your VAT certificate or COR (Certificate of Registration). If you&apos;re not sure of the exact date, check with your accountant.</p>
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
        <p className="text-xs text-muted-foreground -mt-1">Every receipt you give a patient needs a unique number. Type what you want your very first receipt number to look like — for example <strong>OR-000001</strong> or just <strong>0001</strong>. Sigurado will count up automatically from there. If your BIR (Bureau of Internal Revenue) issued you a specific series to start from, use that number.</p>
        <Input
          id="orSeriesStart"
          value={form.orSeriesStart}
          onChange={e => set('orSeriesStart', e.target.value)}
          required
          className="min-h-[48px]"
          placeholder="e.g. OR-000001"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Filing Method *</Label>
        <p className="text-xs text-muted-foreground -mt-1">How do you submit your tax returns to the BIR (Bureau of Internal Revenue)? <strong>eBIRForms (Electronic BIR Forms)</strong> — you fill out forms on your computer and submit online. Most small clinics use this. <strong>eFPS (Electronic Filing and Payment System)</strong> — used by larger businesses. If you&apos;re not sure, choose eBIRForms.</p>
        <Select
          value={form.filingMethod}
          onValueChange={(val) => { if (val) set('filingMethod', val as FilingMethod) }}
        >
          <SelectTrigger className="min-h-[48px] w-full">
            <SelectValue placeholder="Select filing method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EBIRFORMS">eBIRForms (Electronic BIR Forms)</SelectItem>
            <SelectItem value="EFPS">eFPS (Electronic Filing and Payment System)</SelectItem>
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
