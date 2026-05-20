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
import type { SupplierData } from '@/app/(onboarding)/onboarding/actions'
import { ExpenseCategory } from '@prisma/client'

interface Step6SuppliersProps {
  clinicId: string
  initialData: SupplierData[]
  onSave: (data: SupplierData[]) => Promise<void>
  onBack: () => void
  isSaving: boolean
}

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'DENTAL_SUPPLIES', label: 'Dental Supplies' },
  { value: 'MEDICAL_SUPPLIES', label: 'Medical Supplies' },
  { value: 'RENT', label: 'Rent' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'INTERNET_PHONE', label: 'Internet / Phone' },
  { value: 'PROFESSIONAL_FEES', label: 'Professional Fees' },
  { value: 'LICENSES_PERMITS', label: 'Licenses & Permits' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OTHER', label: 'Other' },
]

const DEFAULT_SUPPLIERS: SupplierData[] = [
  { name: 'Local Dental Supply Shop', category: 'DENTAL_SUPPLIES', vatRegistered: false, address: '', tin: '' },
]

export function Step6Suppliers({ initialData, onSave, onBack, isSaving }: Step6SuppliersProps) {
  const [suppliers, setSuppliers] = useState<SupplierData[]>(
    initialData.length > 0 ? initialData : DEFAULT_SUPPLIERS
  )
  const [error, setError] = useState<string | null>(null)

  function update(index: number, field: keyof SupplierData, value: string | boolean) {
    setSuppliers(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function addRow() {
    setSuppliers(prev => [...prev, { name: '', category: 'DENTAL_SUPPLIES', vatRegistered: false, address: '', tin: '' }])
  }

  function removeRow(index: number) {
    if (suppliers.length <= 1) return
    setSuppliers(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const valid = suppliers.filter(s => s.name.trim() !== '')
    try {
      await onSave(valid)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold mb-1">Suppliers</h2>
        <p className="text-sm text-muted-foreground">These are the companies or people you buy things from — dental supply shops, your landlord, your internet provider, etc. Adding them here makes it faster to record expenses later and helps track VAT (Value Added Tax) you can claim back. <strong>You can skip this and add them later</strong> — just tap Next.</p>
      </div>

      <div className="flex flex-col gap-4">
        {suppliers.map((supplier, idx) => (
          <Card key={idx}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                Supplier {idx + 1}
                {suppliers.length > 1 && (
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
                <Label>Name *</Label>
                <Input
                  value={supplier.name}
                  onChange={e => update(idx, 'name', e.target.value)}
                  required
                  className="min-h-[48px]"
                  placeholder="Supplier name"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Category *</Label>
                <Select
                  value={supplier.category}
                  onValueChange={(val) => { if (val) update(idx, 'category', val as ExpenseCategory) }}
                >
                  <SelectTrigger className="min-h-[48px] w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-start justify-between min-h-[40px] gap-4">
                <div className="flex-1">
                  <Label>VAT (Value Added Tax) Registered?</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Is this supplier registered for VAT (Value Added Tax)? Check their official receipt — if it shows a TIN (Tax Identification Number) and the word &quot;VAT,&quot; turn this ON. It means you can claim back the tax they charged you.</p>
                </div>
                <Switch
                  checked={supplier.vatRegistered}
                  onCheckedChange={(checked: boolean) => update(idx, 'vatRegistered', checked)}
                  className="mt-1 shrink-0"
                />
              </div>
              {supplier.vatRegistered && (
                <p className="text-xs text-muted-foreground">
                  ✓ You can claim back VAT (Value Added Tax) on purchases from this supplier.
                </p>
              )}
              <div className="flex flex-col gap-2">
                <Label>Address (optional)</Label>
                <Input
                  value={supplier.address ?? ''}
                  onChange={e => update(idx, 'address', e.target.value)}
                  className="min-h-[48px]"
                  placeholder="Street, City"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>TIN (Tax Identification Number) — optional</Label>
                <p className="text-xs text-muted-foreground -mt-1">The supplier&apos;s tax ID number. You can find this printed on any official receipt or invoice they give you. This is optional but useful for your BIR (Bureau of Internal Revenue) records.</p>
                <Input
                  value={supplier.tin ?? ''}
                  onChange={e => update(idx, 'tin', e.target.value)}
                  className="min-h-[48px]"
                  placeholder="XXX-XXX-XXX-XXX"
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button type="button" variant="outline" onClick={addRow} className="min-h-[48px]">
        + Add Supplier
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
