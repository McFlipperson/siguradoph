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
import type { RecurringExpenseData } from '@/app/(onboarding)/onboarding/actions'
import { ExpenseCategory } from '@prisma/client'

interface Step4ExpensesProps {
  clinicId: string
  initialData: RecurringExpenseData[]
  onSave: (data: RecurringExpenseData[]) => Promise<void>
  onBack: () => void
  isSaving: boolean
}

const DEFAULT_EXPENSES: RecurringExpenseData[] = [
  { description: 'Monthly Rent', category: 'RENT', amount: 0, payeeName: '', vatRegistered: false },
  { description: 'Electricity', category: 'UTILITIES', amount: 0, payeeName: '', vatRegistered: false },
  { description: 'Water', category: 'UTILITIES', amount: 0, payeeName: '', vatRegistered: false },
  { description: 'Internet / Phone', category: 'INTERNET_PHONE', amount: 0, payeeName: '', vatRegistered: false },
]

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

function fmt(n: number) {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function Step4Expenses({ initialData, onSave, onBack, isSaving }: Step4ExpensesProps) {
  const [expenses, setExpenses] = useState<RecurringExpenseData[]>(
    initialData.length > 0 ? initialData : DEFAULT_EXPENSES
  )
  const [error, setError] = useState<string | null>(null)

  function update(index: number, field: keyof RecurringExpenseData, value: string | number | boolean) {
    setExpenses(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  function addRow() {
    setExpenses(prev => [...prev, { description: '', category: 'OTHER', amount: 0, payeeName: '', vatRegistered: false }])
  }

  function removeRow(index: number) {
    if (expenses.length <= 1) return
    setExpenses(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const valid = expenses.filter(ex => ex.description.trim() !== '')
    try {
      await onSave(valid)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-semibold mb-1">Recurring Expenses</h2>
        <p className="text-sm text-muted-foreground">These are bills your clinic pays every month — like rent, electricity, and internet. Adding them here lets Sigurado automatically track them against your income for tax purposes. <strong>You can skip this and add them later</strong> — just tap Next.</p>
      </div>

      <div className="flex flex-col gap-4">
        {expenses.map((expense, idx) => {
          const inputVat = expense.vatRegistered && expense.amount > 0
            ? expense.amount / 1.12 * 0.12
            : 0

          return (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  Expense {idx + 1}
                  {expenses.length > 1 && (
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
                  <Label>Description *</Label>
                  <Input
                    value={expense.description}
                    onChange={e => update(idx, 'description', e.target.value)}
                    className="min-h-[48px]"
                    placeholder="e.g. Monthly Rent"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Category *</Label>
                  <Select
                    value={expense.category}
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
                <div className="flex flex-col gap-2">
                  <Label>Amount (₱) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={expense.amount || ''}
                    onChange={e => update(idx, 'amount', parseFloat(e.target.value) || 0)}
                    className="min-h-[48px]"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Payee Name (optional)</Label>
                  <p className="text-xs text-muted-foreground -mt-1">Who do you pay this bill to? For example, your landlord&apos;s name for rent, or &quot;Meralco&quot; for electricity. This is just for your records.</p>
                  <Input
                    value={expense.payeeName ?? ''}
                    onChange={e => update(idx, 'payeeName', e.target.value)}
                    className="min-h-[48px]"
                    placeholder="e.g. Building Owner, Meralco, PLDT"
                  />
                </div>
                <div className="flex items-start justify-between min-h-[40px] gap-4">
                  <div className="flex-1">
                    <Label>VAT (Value Added Tax) Registered Payee?</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">Does the company or person you&apos;re paying charge VAT (Value Added Tax) on their invoices? If yes, turn this ON — you can claim back that tax from the BIR (Bureau of Internal Revenue). Check their official receipt or invoice for the word &quot;VAT.&quot;</p>
                  </div>
                  <Switch
                    checked={expense.vatRegistered}
                    onCheckedChange={(checked: boolean) => update(idx, 'vatRegistered', checked)}
                    className="mt-1 shrink-0"
                  />
                </div>
                {expense.vatRegistered && expense.amount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    ✓ You can claim back ₱{fmt(inputVat)} in input VAT (Value Added Tax) from this expense.
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Button type="button" variant="outline" onClick={addRow} className="min-h-[48px]">
        + Add Expense
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
