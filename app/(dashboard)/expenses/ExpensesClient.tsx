'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const EXPENSE_CATEGORIES = [
  { value: 'DENTAL_SUPPLIES', label: 'Dental Supplies' },
  { value: 'MEDICAL_SUPPLIES', label: 'Medical Supplies' },
  { value: 'RENT', label: 'Rent' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'INTERNET_PHONE', label: 'Internet & Phone' },
  { value: 'PROFESSIONAL_FEES', label: 'Professional Fees' },
  { value: 'LICENSES_PERMITS', label: 'Licenses & Permits' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OTHER', label: 'Other' },
] as const


type ExpenseRow = {
  id: string
  date: string
  description: string
  category: string
  grossAmount: number
  inputVatAmount: number
  netAmount: number
  receiptNumber: string | null
  paymentMethod: string
  notes: string | null
  supplierId: string | null
  supplierName: string | null
}

type RecurringRow = {
  id: string
  description: string
  amount: number
  category: string
  frequency: string
  nextDueDate: string | null
  isActive: boolean
}

type SupplierOption = {
  id: string
  name: string
  category: string
}

type ExpenseFormData = {
  category: string
  description: string
  grossAmount: number
  inputVatAmount: number
  receiptNumber: string
  date: string
  paymentMethod: string
  supplierId: string
  notes: string
}

type RecurringFormData = {
  description: string
  amount: number
  category: string
  frequency: string
  nextDueDate: string
}

// ─── AddExpenseSheet ──────────────────────────────────────────────────────────

function AddExpenseSheet({
  open,
  onClose,
  onSave,
  initial,
  suppliers,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: ExpenseFormData) => Promise<void>
  initial?: ExpenseFormData
  suppliers: SupplierOption[]
}) {
  const today = new Date().toISOString().slice(0, 10)

  const [category, setCategory] = useState(initial?.category ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [grossAmount, setGrossAmount] = useState(initial?.grossAmount ? String(initial.grossAmount) : '')
  const [inputVatAmount, setInputVatAmount] = useState(initial?.inputVatAmount ? String(initial.inputVatAmount) : '')
  const [receiptNumber, setReceiptNumber] = useState(initial?.receiptNumber ?? '')
  const [date, setDate] = useState(initial?.date ?? today)
  const [paymentMethod, setPaymentMethod] = useState(initial?.paymentMethod ?? 'CASH')
  const [supplierId, setSupplierId] = useState(initial?.supplierId ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [saving, setSaving] = useState(false)

  // Sync when initial changes (edit mode)
  useEffect(() => {
    if (initial) {
      setCategory(initial.category)
      setDescription(initial.description)
      setGrossAmount(initial.grossAmount ? String(initial.grossAmount) : '')
      setInputVatAmount(initial.inputVatAmount ? String(initial.inputVatAmount) : '')
      setReceiptNumber(initial.receiptNumber)
      setDate(initial.date)
      setPaymentMethod(initial.paymentMethod)
      setSupplierId(initial.supplierId)
      setNotes(initial.notes)
    } else {
      setCategory('')
      setDescription('')
      setGrossAmount('')
      setInputVatAmount('')
      setReceiptNumber('')
      setDate(today)
      setPaymentMethod('CASH')
      setSupplierId('')
      setNotes('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const canSave = category.trim() !== '' && description.trim() !== '' && Number(grossAmount) > 0

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      await onSave({
        category,
        description,
        grossAmount: Number(grossAmount),
        inputVatAmount: Number(inputVatAmount) || 0,
        receiptNumber,
        date,
        paymentMethod,
        supplierId,
        notes,
      })
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* Sheet */}
      <div className="relative rounded-t-2xl bg-background max-h-[90vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex items-center justify-between px-4 pb-3">
          <h2 className="text-base font-semibold">{initial ? 'Edit Expense' : 'Add Expense'}</h2>
          <button onClick={onClose} className="p-2 text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
        </div>
        <div className="overflow-y-auto px-4 pb-6 space-y-4">
          {/* Category chip grid */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Category <span className="text-red-500">*</span></p>
            <div className="grid grid-cols-3 gap-2">
              {EXPENSE_CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`min-h-[44px] px-2 py-2 rounded-lg border text-xs font-medium transition-colors text-center ${category === c.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Description <span className="text-red-500">*</span></label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Dental burs"
              className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1"
            />
          </div>

          {/* Gross Amount */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Amount <span className="text-red-500">*</span></label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₱</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={grossAmount}
                onChange={e => setGrossAmount(e.target.value)}
                placeholder="0.00"
                className="w-full min-h-[48px] rounded-lg border border-input bg-background pl-8 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Input VAT */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Input VAT (claimable)</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₱</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={inputVatAmount}
                onChange={e => setInputVatAmount(e.target.value)}
                placeholder="0.00"
                className="w-full min-h-[48px] rounded-lg border border-input bg-background pl-8 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1"
            />
          </div>

          {/* Payment Method */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'CASH', label: 'Cash' },
                { value: 'GCASH', label: 'GCash' },
                { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
              ].map(m => (
                <button
                  key={m.value}
                  onClick={() => setPaymentMethod(m.value)}
                  className={`min-h-[44px] px-2 py-2 rounded-lg border text-xs font-medium transition-colors ${paymentMethod === m.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Receipt Number */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Receipt Number (optional)</label>
            <input
              value={receiptNumber}
              onChange={e => setReceiptNumber(e.target.value)}
              placeholder="e.g. OR-001234"
              className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1"
            />
          </div>

          {/* Supplier */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Supplier (optional)</label>
            <select
              value={supplierId}
              onChange={e => setSupplierId(e.target.value)}
              className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1"
            >
              <option value="">None</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional notes…"
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1 resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Expense'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── AddRecurringSheet ────────────────────────────────────────────────────────

function AddRecurringSheet({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: RecurringFormData) => Promise<void>
  initial?: RecurringFormData
}) {
  const [description, setDescription] = useState(initial?.description ?? '')
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [frequency, setFrequency] = useState(initial?.frequency ?? 'MONTHLY')
  const [nextDueDate, setNextDueDate] = useState(initial?.nextDueDate ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initial) {
      setDescription(initial.description)
      setAmount(initial.amount ? String(initial.amount) : '')
      setCategory(initial.category)
      setFrequency(initial.frequency)
      setNextDueDate(initial.nextDueDate)
    } else {
      setDescription('')
      setAmount('')
      setCategory('')
      setFrequency('MONTHLY')
      setNextDueDate('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const canSave = description.trim() !== '' && Number(amount) > 0 && category.trim() !== ''

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      await onSave({
        description,
        amount: Number(amount),
        category,
        frequency,
        nextDueDate,
      })
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative rounded-t-2xl bg-background max-h-[90vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex items-center justify-between px-4 pb-3">
          <h2 className="text-base font-semibold">{initial ? 'Edit Recurring Expense' : 'Add Recurring Expense'}</h2>
          <button onClick={onClose} className="p-2 text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
        </div>
        <div className="overflow-y-auto px-4 pb-6 space-y-4">
          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Description <span className="text-red-500">*</span></label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Monthly rent"
              className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Amount <span className="text-red-500">*</span></label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₱</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full min-h-[48px] rounded-lg border border-input bg-background pl-8 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Category chip grid */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Category <span className="text-red-500">*</span></p>
            <div className="grid grid-cols-3 gap-2">
              {EXPENSE_CATEGORIES.map(c => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`min-h-[44px] px-2 py-2 rounded-lg border text-xs font-medium transition-colors text-center ${category === c.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Frequency</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'MONTHLY', label: 'Monthly' },
                { value: 'QUARTERLY', label: 'Quarterly' },
                { value: 'ANNUAL', label: 'Annual' },
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setFrequency(f.value)}
                  className={`min-h-[44px] px-2 py-2 rounded-lg border text-xs font-medium transition-colors ${frequency === f.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Next Due Date */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Next Due Date (optional)</label>
            <input
              type="date"
              value={nextDueDate}
              onChange={e => setNextDueDate(e.target.value)}
              className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Recurring Expense'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── ExpensesClient ───────────────────────────────────────────────────────────

export default function ExpensesClient({ initialSuppliers }: { initialSuppliers: SupplierOption[] }) {
  const [tab, setTab] = useState<'expenses' | 'recurring'>('expenses')

  // Expenses tab state
  const [expenses, setExpenses] = useState<ExpenseRow[]>([])
  const [loadingExpenses, setLoadingExpenses] = useState(false)
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [categoryFilter, setCategoryFilter] = useState('')
  const [addExpenseOpen, setAddExpenseOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseRow | null>(null)
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null)

  // Recurring tab state
  const [recurring, setRecurring] = useState<RecurringRow[]>([])
  const [addRecurringOpen, setAddRecurringOpen] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringRow | null>(null)

  async function fetchExpenses() {
    setLoadingExpenses(true)
    try {
      const params = new URLSearchParams({ month })
      if (categoryFilter) params.set('category', categoryFilter)
      const res = await fetch(`/api/expenses?${params}`)
      if (!res.ok) throw new Error('Failed to load expenses')
      setExpenses(await res.json())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load expenses')
    } finally {
      setLoadingExpenses(false)
    }
  }

  async function fetchRecurring() {
    try {
      const res = await fetch('/api/expenses/recurring')
      if (!res.ok) throw new Error('Failed to load recurring expenses')
      setRecurring(await res.json())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load recurring expenses')
    }
  }

  useEffect(() => { fetchExpenses() }, [month, categoryFilter]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchRecurring() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function prevMonth() {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 2, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  function nextMonth() {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m, 1)
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  const monthLabel = new Date(month + '-01').toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })

  const totalGross = expenses.reduce((s, e) => s + e.grossAmount, 0)
  const totalInputVat = expenses.reduce((s, e) => s + e.inputVatAmount, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueCount = recurring.filter(r => r.isActive && r.nextDueDate && new Date(r.nextDueDate) <= today).length

  function fmt(n: number) {
    return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(n)
  }
  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
  }
  function categoryLabel(val: string) {
    return EXPENSE_CATEGORIES.find(c => c.value === val)?.label ?? val
  }

  async function handleSaveExpense(data: ExpenseFormData, id?: string) {
    const body = {
      category: data.category,
      description: data.description,
      grossAmount: data.grossAmount,
      inputVatAmount: data.inputVatAmount,
      receiptNumber: data.receiptNumber || null,
      date: data.date,
      paymentMethod: data.paymentMethod,
      supplierId: data.supplierId || null,
      notes: data.notes || null,
    }
    try {
      if (id) {
        const res = await fetch(`/api/expenses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (!res.ok) throw new Error('Failed to update expense')
        toast.success('Expense updated')
      } else {
        const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (!res.ok) throw new Error('Failed to add expense')
        toast.success('Expense added')
      }
      setAddExpenseOpen(false)
      setEditingExpense(null)
      fetchExpenses()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  async function handleDeleteExpense(id: string) {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete expense')
      toast.success('Expense deleted')
      setDeletingExpenseId(null)
      fetchExpenses()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete expense')
    }
  }

  async function handleSaveRecurring(data: RecurringFormData, id?: string) {
    const body = { ...data, nextDueDate: data.nextDueDate || null }
    try {
      if (id) {
        const res = await fetch(`/api/expenses/recurring/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (!res.ok) throw new Error('Failed to update recurring expense')
        toast.success('Recurring expense updated')
      } else {
        const res = await fetch('/api/expenses/recurring', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (!res.ok) throw new Error('Failed to add recurring expense')
        toast.success('Recurring expense added')
      }
      setAddRecurringOpen(false)
      setEditingRecurring(null)
      fetchRecurring()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  async function handleToggleRecurring(id: string, isActive: boolean) {
    try {
      const res = await fetch(`/api/expenses/recurring/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive }) })
      if (!res.ok) throw new Error('Failed to update')
      fetchRecurring()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  return (
    <div className="space-y-4 pb-4">
      <h1 className="text-xl font-bold">Expenses</h1>

      {/* Tab selector */}
      <div className="flex rounded-xl border overflow-hidden">
        <button
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === 'expenses' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'}`}
          onClick={() => setTab('expenses')}
        >
          Expenses
        </button>
        <button
          className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${tab === 'recurring' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'}`}
          onClick={() => setTab('recurring')}
        >
          Recurring
          {dueCount > 0 && (
            <span className="absolute top-1.5 right-3 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {dueCount}
            </span>
          )}
        </button>
      </div>

      {/* ── EXPENSES TAB ── */}
      {tab === 'expenses' && (
        <div className="space-y-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between gap-2">
            <button onClick={prevMonth} className="p-2 rounded-lg border min-h-[44px] min-w-[44px] flex items-center justify-center">‹</button>
            <span className="font-medium text-sm">{monthLabel}</span>
            <button onClick={nextMonth} className="p-2 rounded-lg border min-h-[44px] min-w-[44px] flex items-center justify-center">›</button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">Total Spent</p>
              <p className="text-lg font-bold mt-1">₱{fmt(totalGross)}</p>
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-xs text-muted-foreground">Input VAT (claimable)</p>
              <p className="text-lg font-bold mt-1">₱{fmt(totalInputVat)}</p>
            </div>
          </div>

          {/* Category filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {[{ value: '', label: 'All' }, ...EXPENSE_CATEGORIES].map(c => (
              <button
                key={c.value}
                onClick={() => setCategoryFilter(c.value)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${categoryFilter === c.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border'}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Add button */}
          <button
            onClick={() => setAddExpenseOpen(true)}
            className="w-full min-h-[48px] rounded-xl border-2 border-dashed border-primary text-primary text-sm font-medium flex items-center justify-center gap-2"
          >
            + Add Expense
          </button>

          {/* Expense list */}
          {loadingExpenses ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
          ) : expenses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No expenses for this month.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {expenses.map(e => (
                <div key={e.id}>
                  <div
                    className="rounded-xl border bg-background p-4 cursor-pointer active:opacity-80"
                    onClick={() => setEditingExpense(e)}
                    onContextMenu={(ev) => { ev.preventDefault(); setDeletingExpenseId(e.id) }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">{e.description}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">{categoryLabel(e.category)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{fmtDate(e.date)}</span>
                          <span>·</span>
                          <span>{e.paymentMethod === 'BANK_TRANSFER' ? 'Bank' : e.paymentMethod === 'GCASH' ? 'GCash' : 'Cash'}</span>
                          {e.receiptNumber && <><span>·</span><span>#{e.receiptNumber}</span></>}
                          {e.supplierName && <><span>·</span><span>{e.supplierName}</span></>}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm">₱{fmt(e.grossAmount)}</p>
                        {e.inputVatAmount > 0 && (
                          <p className="text-xs text-muted-foreground">VAT ₱{fmt(e.inputVatAmount)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Delete confirmation */}
                  {deletingExpenseId === e.id && (
                    <div className="mt-1 rounded-xl border border-red-200 bg-red-50 p-3 flex items-center justify-between gap-2">
                      <span className="text-sm text-red-800">Delete this expense?</span>
                      <div className="flex gap-2">
                        <button onClick={() => setDeletingExpenseId(null)} className="text-xs px-3 py-1.5 rounded-lg border min-h-[36px]">Cancel</button>
                        <button onClick={() => handleDeleteExpense(e.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white min-h-[36px]">Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── RECURRING TAB ── */}
      {tab === 'recurring' && (
        <div className="space-y-3">
          <button
            onClick={() => setAddRecurringOpen(true)}
            className="w-full min-h-[48px] rounded-xl border-2 border-dashed border-primary text-primary text-sm font-medium flex items-center justify-center gap-2"
          >
            + Add Recurring Expense
          </button>

          {recurring.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No recurring expenses set up.</p>
          ) : (
            recurring.map(r => {
              const isDue = r.nextDueDate && new Date(r.nextDueDate) <= today
              return (
                <div key={r.id} className={`rounded-xl border p-4 ${!r.isActive ? 'opacity-50' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditingRecurring(r)}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{r.description}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {r.frequency === 'MONTHLY' ? 'Monthly' : r.frequency === 'QUARTERLY' ? 'Quarterly' : 'Annual'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span>{categoryLabel(r.category)}</span>
                        {r.nextDueDate && (
                          <>
                            <span>·</span>
                            <span className={isDue ? 'text-red-600 font-medium' : ''}>
                              Due {fmtDate(r.nextDueDate)}{isDue ? ' ⚠' : ''}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="font-semibold text-sm">₱{fmt(r.amount)}</p>
                      <button
                        onClick={() => handleToggleRecurring(r.id, !r.isActive)}
                        className={`relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors ${r.isActive ? 'bg-primary' : 'bg-muted'}`}
                      >
                        <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${r.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── SHEETS ── */}
      <AddExpenseSheet
        open={addExpenseOpen || editingExpense !== null}
        onClose={() => { setAddExpenseOpen(false); setEditingExpense(null) }}
        onSave={(data) => handleSaveExpense(data, editingExpense?.id)}
        initial={editingExpense ? {
          category: editingExpense.category,
          description: editingExpense.description,
          grossAmount: editingExpense.grossAmount,
          inputVatAmount: editingExpense.inputVatAmount,
          receiptNumber: editingExpense.receiptNumber ?? '',
          date: editingExpense.date.slice(0, 10),
          paymentMethod: editingExpense.paymentMethod,
          supplierId: editingExpense.supplierId ?? '',
          notes: editingExpense.notes ?? '',
        } : undefined}
        suppliers={initialSuppliers}
      />
      <AddRecurringSheet
        open={addRecurringOpen || editingRecurring !== null}
        onClose={() => { setAddRecurringOpen(false); setEditingRecurring(null) }}
        onSave={(data) => handleSaveRecurring(data, editingRecurring?.id)}
        initial={editingRecurring ? {
          description: editingRecurring.description,
          amount: editingRecurring.amount,
          category: editingRecurring.category,
          frequency: editingRecurring.frequency,
          nextDueDate: editingRecurring.nextDueDate?.slice(0, 10) ?? '',
        } : undefined}
      />
    </div>
  )
}
