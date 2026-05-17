'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

type EmployeeRow = {
  id: string
  fullName: string
  position: string
  dateHired: string
  monthlySalary: number
  sssNumber: string
  philhealthNumber: string
  pagibigNumber: string
  tin: string | null
  isActive: boolean
}

type PayrollRow = {
  id: string
  employeeId: string
  employeeName: string
  periodMonth: number
  periodYear: number
  basicSalary: number
  sssEmployee: number
  sssEmployer: number
  philhealthEmployee: number
  philhealthEmployer: number
  pagibigEmployee: number
  pagibigEmployer: number
  withholdingTax: number
  netPay: number
}

type EmployeeFormData = {
  fullName: string
  position: string
  dateHired: string
  monthlySalary: string
  sssNumber: string
  philhealthNumber: string
  pagibigNumber: string
  tin: string
}

// ─── EmployeeSheet ────────────────────────────────────────────────────────────

function EmployeeSheet({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: EmployeeFormData) => Promise<void>
  initial?: EmployeeFormData
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [fullName, setFullName] = useState(initial?.fullName ?? '')
  const [position, setPosition] = useState(initial?.position ?? '')
  const [dateHired, setDateHired] = useState(initial?.dateHired ?? today)
  const [monthlySalary, setMonthlySalary] = useState(initial?.monthlySalary ?? '')
  const [sssNumber, setSssNumber] = useState(initial?.sssNumber ?? '')
  const [philhealthNumber, setPhilhealthNumber] = useState(initial?.philhealthNumber ?? '')
  const [pagibigNumber, setPagibigNumber] = useState(initial?.pagibigNumber ?? '')
  const [tin, setTin] = useState(initial?.tin ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setFullName(initial?.fullName ?? '')
      setPosition(initial?.position ?? '')
      setDateHired(initial?.dateHired ?? today)
      setMonthlySalary(initial?.monthlySalary ?? '')
      setSssNumber(initial?.sssNumber ?? '')
      setPhilhealthNumber(initial?.philhealthNumber ?? '')
      setPagibigNumber(initial?.pagibigNumber ?? '')
      setTin(initial?.tin ?? '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const canSave = fullName.trim() !== '' && position.trim() !== '' && dateHired !== '' && Number(monthlySalary) > 0 && sssNumber.trim() !== '' && philhealthNumber.trim() !== '' && pagibigNumber.trim() !== ''

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      await onSave({ fullName, position, dateHired, monthlySalary, sssNumber, philhealthNumber, pagibigNumber, tin })
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative rounded-t-2xl bg-background max-h-[92vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex items-center justify-between px-4 pb-3">
          <h2 className="text-base font-semibold">{initial ? 'Edit Employee' : 'Add Employee'}</h2>
          <button onClick={onClose} className="p-2 text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
        </div>
        <div className="overflow-y-auto px-4 pb-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Full Name <span className="text-red-500">*</span></label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Maria Santos" className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Position <span className="text-red-500">*</span></label>
            <input value={position} onChange={e => setPosition(e.target.value)} placeholder="e.g. Dental Assistant" className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Date Hired <span className="text-red-500">*</span></label>
            <input type="date" value={dateHired} onChange={e => setDateHired(e.target.value)} className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Monthly Salary (₱) <span className="text-red-500">*</span></label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₱</span>
              <input type="number" min="0" step="0.01" value={monthlySalary} onChange={e => setMonthlySalary(e.target.value)} placeholder="0.00" className="w-full min-h-[48px] rounded-lg border border-input bg-background pl-8 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">SSS Number <span className="text-red-500">*</span></label>
            <input value={sssNumber} onChange={e => setSssNumber(e.target.value)} placeholder="e.g. 34-1234567-8" className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">PhilHealth Number <span className="text-red-500">*</span></label>
            <input value={philhealthNumber} onChange={e => setPhilhealthNumber(e.target.value)} placeholder="e.g. 12-123456789-0" className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Pag-IBIG Number <span className="text-red-500">*</span></label>
            <input value={pagibigNumber} onChange={e => setPagibigNumber(e.target.value)} placeholder="e.g. 1234-5678-9012" className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">TIN (optional)</label>
            <input value={tin} onChange={e => setTin(e.target.value)} placeholder="e.g. 123-456-789-000" className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1" />
          </div>
          <button onClick={handleSave} disabled={!canSave || saving} className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50">
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Employee'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── EmployeesClient ──────────────────────────────────────────────────────────

export default function EmployeesClient({
  initialEmployees,
  initialPayroll,
}: {
  initialEmployees: EmployeeRow[]
  initialPayroll: PayrollRow[]
}) {
  const [tab, setTab] = useState<'employees' | 'payroll'>('employees')
  const [employees, setEmployees] = useState<EmployeeRow[]>(initialEmployees)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRow | null>(null)

  // Payroll tab state
  const now = new Date()
  const [payrollMonth, setPayrollMonth] = useState(now.getMonth() + 1)
  const [payrollYear, setPayrollYear] = useState(now.getFullYear())
  const [payrollRecords, setPayrollRecords] = useState<PayrollRow[]>(initialPayroll)
  const [loadingPayroll, setLoadingPayroll] = useState(false)
  const [runningPayroll, setRunningPayroll] = useState(false)
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null)

  function fmt(n: number) {
    return n.toLocaleString('en-PH', { minimumFractionDigits: 2 })
  }
  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const monthLabel = new Date(payrollYear, payrollMonth - 1, 1).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })

  function prevPayrollMonth() {
    if (payrollMonth === 1) { setPayrollMonth(12); setPayrollYear(y => y - 1) }
    else setPayrollMonth(m => m - 1)
  }
  function nextPayrollMonth() {
    if (payrollMonth === 12) { setPayrollMonth(1); setPayrollYear(y => y + 1) }
    else setPayrollMonth(m => m + 1)
  }

  const fetchPayroll = useCallback(async (month: number, year: number) => {
    setLoadingPayroll(true)
    try {
      const res = await fetch(`/api/payroll/records?month=${month}&year=${year}`)
      if (!res.ok) throw new Error('Failed to load payroll')
      setPayrollRecords(await res.json())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load payroll')
    } finally {
      setLoadingPayroll(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'payroll') fetchPayroll(payrollMonth, payrollYear)
  }, [tab, payrollMonth, payrollYear, fetchPayroll])

  async function fetchEmployees() {
    try {
      const res = await fetch('/api/payroll/employees')
      if (!res.ok) throw new Error('Failed to load employees')
      setEmployees(await res.json())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load employees')
    }
  }

  async function handleSaveEmployee(data: EmployeeFormData) {
    const body = {
      fullName: data.fullName,
      position: data.position,
      dateHired: data.dateHired,
      monthlySalary: Number(data.monthlySalary),
      sssNumber: data.sssNumber,
      philhealthNumber: data.philhealthNumber,
      pagibigNumber: data.pagibigNumber,
      tin: data.tin || null,
    }
    try {
      if (editingEmployee) {
        const res = await fetch(`/api/payroll/employees/${editingEmployee.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Failed to update employee')
        toast.success('Employee updated')
      } else {
        const res = await fetch('/api/payroll/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Failed to add employee')
        toast.success('Employee added')
      }
      setSheetOpen(false)
      setEditingEmployee(null)
      fetchEmployees()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  async function handleToggleActive(emp: EmployeeRow) {
    try {
      const res = await fetch(`/api/payroll/employees/${emp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !emp.isActive }),
      })
      if (!res.ok) throw new Error('Failed to update')
      fetchEmployees()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  async function handleRunPayroll() {
    const activeWithoutRecord = employees.filter(e => e.isActive && !payrollRecords.find(r => r.employeeId === e.id))
    if (activeWithoutRecord.length === 0) return
    setRunningPayroll(true)
    try {
      await Promise.all(
        activeWithoutRecord.map(emp =>
          fetch('/api/payroll/records', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId: emp.id, periodMonth: payrollMonth, periodYear: payrollYear }),
          })
        )
      )
      toast.success(`Payroll run for ${activeWithoutRecord.length} employee(s)`)
      fetchPayroll(payrollMonth, payrollYear)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to run payroll')
    } finally {
      setRunningPayroll(false)
    }
  }

  async function handleDeleteRecord(id: string) {
    try {
      const res = await fetch(`/api/payroll/records/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete record')
      toast.success('Payroll record deleted')
      setDeletingRecordId(null)
      fetchPayroll(payrollMonth, payrollYear)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  // Payroll summary
  const totalGrossPayroll = payrollRecords.reduce((s, r) => s + r.basicSalary, 0)
  const totalEmployerContributions = payrollRecords.reduce((s, r) => s + r.sssEmployer + r.philhealthEmployer + r.pagibigEmployer, 0)
  const totalNetPayroll = payrollRecords.reduce((s, r) => s + r.netPay, 0)

  const activeEmployees = employees.filter(e => e.isActive)
  const activeWithoutRecord = activeEmployees.filter(e => !payrollRecords.find(r => r.employeeId === e.id))

  return (
    <div className="space-y-4 pb-4">
      <h1 className="text-xl font-bold">Employees & Payroll</h1>

      {/* Tab selector */}
      <div className="flex rounded-xl border overflow-hidden">
        <button
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === 'employees' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'}`}
          onClick={() => setTab('employees')}
        >
          Employees
        </button>
        <button
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === 'payroll' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'}`}
          onClick={() => setTab('payroll')}
        >
          Payroll
        </button>
      </div>

      {/* ── EMPLOYEES TAB ── */}
      {tab === 'employees' && (
        <div className="space-y-3">
          <button
            onClick={() => { setEditingEmployee(null); setSheetOpen(true) }}
            className="w-full min-h-[48px] rounded-xl border-2 border-dashed border-primary text-primary text-sm font-medium flex items-center justify-center gap-2"
          >
            + Add Employee
          </button>

          {employees.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No employees yet. Add your first employee above.</p>
          )}

          {employees.map(emp => (
            <div
              key={emp.id}
              className={`rounded-xl border bg-background p-4 ${!emp.isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => { setEditingEmployee(emp); setSheetOpen(true) }}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{emp.fullName}</span>
                    {!emp.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Terminated</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{emp.position}</p>
                  <p className="text-sm font-medium mt-1">₱{fmt(emp.monthlySalary)}<span className="text-xs text-muted-foreground font-normal">/month</span></p>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span>SSS: {emp.sssNumber}</span>
                    <span>PhilHealth: {emp.philhealthNumber}</span>
                    <span>Pag-IBIG: {emp.pagibigNumber}</span>
                    {emp.tin && <span>TIN: {emp.tin}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Hired: {fmtDate(emp.dateHired)}</p>
                </div>
                {/* Toggle active */}
                <button
                  onClick={() => handleToggleActive(emp)}
                  className={`relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors mt-1 ${emp.isActive ? 'bg-primary' : 'bg-muted'}`}
                  title={emp.isActive ? 'Deactivate' : 'Reactivate'}
                >
                  <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${emp.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── PAYROLL TAB ── */}
      {tab === 'payroll' && (
        <div className="space-y-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between gap-2">
            <button onClick={prevPayrollMonth} className="p-2 rounded-lg border min-h-[44px] min-w-[44px] flex items-center justify-center text-lg">‹</button>
            <span className="font-medium text-sm">{monthLabel}</span>
            <button onClick={nextPayrollMonth} className="p-2 rounded-lg border min-h-[44px] min-w-[44px] flex items-center justify-center text-lg">›</button>
          </div>

          {/* Run Payroll button */}
          {activeWithoutRecord.length > 0 && (
            <button
              onClick={handleRunPayroll}
              disabled={runningPayroll}
              className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              {runningPayroll ? 'Running…' : `Run Payroll for ${activeWithoutRecord.length} Employee${activeWithoutRecord.length !== 1 ? 's' : ''}`}
            </button>
          )}

          {loadingPayroll ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
          ) : (
            <div className="space-y-3">
              {/* Active employees with no record */}
              {activeWithoutRecord.map(emp => (
                <div key={emp.id} className="rounded-xl border bg-background p-4 opacity-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{emp.fullName}</p>
                      <p className="text-xs text-muted-foreground">{emp.position} · ₱{fmt(emp.monthlySalary)}/month</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">No payroll run</span>
                  </div>
                </div>
              ))}

              {/* Records */}
              {payrollRecords.map(rec => (
                <div key={rec.id}>
                  <div className="rounded-xl border bg-background p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{rec.employeeName}</p>
                        <p className="text-xs text-muted-foreground">{monthLabel}</p>

                        <div className="mt-3 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Basic Salary</span>
                            <span>₱{fmt(rec.basicSalary)}</span>
                          </div>
                          <div className="flex justify-between text-red-600">
                            <span>SSS</span>
                            <span>-₱{fmt(rec.sssEmployee)}</span>
                          </div>
                          <div className="flex justify-between text-red-600">
                            <span>PhilHealth</span>
                            <span>-₱{fmt(rec.philhealthEmployee)}</span>
                          </div>
                          <div className="flex justify-between text-red-600">
                            <span>Pag-IBIG</span>
                            <span>-₱{fmt(rec.pagibigEmployee)}</span>
                          </div>
                          <div className="flex justify-between text-red-600">
                            <span>Withholding Tax</span>
                            <span>-₱{fmt(rec.withholdingTax)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                            <span>Net Pay</span>
                            <span className="text-green-700">₱{fmt(rec.netPay)}</span>
                          </div>
                        </div>

                        {/* Employer contributions */}
                        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5">
                          <span>Employer: SSS ₱{fmt(rec.sssEmployer)}</span>
                          <span>PhilHealth ₱{fmt(rec.philhealthEmployer)}</span>
                          <span>Pag-IBIG ₱{fmt(rec.pagibigEmployer)}</span>
                        </div>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={() => setDeletingRecordId(rec.id)}
                        className="p-2 text-muted-foreground hover:text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        title="Delete payroll record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Delete confirmation */}
                  {deletingRecordId === rec.id && (
                    <div className="mt-1 rounded-xl border border-red-200 bg-red-50 p-3 flex items-center justify-between gap-2">
                      <span className="text-sm text-red-800">Delete this payroll record?</span>
                      <div className="flex gap-2">
                        <button onClick={() => setDeletingRecordId(null)} className="text-xs px-3 py-1.5 rounded-lg border min-h-[36px]">Cancel</button>
                        <button onClick={() => handleDeleteRecord(rec.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white min-h-[36px]">Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {activeEmployees.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No active employees. Add employees first.</p>
              )}
            </div>
          )}

          {/* Summary footer */}
          {payrollRecords.length > 0 && (
            <div className="rounded-xl border bg-muted/30 p-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Payroll</span>
                <span className="font-medium">₱{fmt(totalGrossPayroll)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employer Contributions</span>
                <span className="font-medium">₱{fmt(totalEmployerContributions)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                <span>Net Payroll</span>
                <span>₱{fmt(totalNetPayroll)}</span>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center px-2">
            ⚠ Estimated deductions — verify with your accountant before government remittance.
          </p>
        </div>
      )}

      {/* ── EMPLOYEE SHEET ── */}
      <EmployeeSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditingEmployee(null) }}
        onSave={handleSaveEmployee}
        initial={editingEmployee ? {
          fullName: editingEmployee.fullName,
          position: editingEmployee.position,
          dateHired: editingEmployee.dateHired.slice(0, 10),
          monthlySalary: String(editingEmployee.monthlySalary),
          sssNumber: editingEmployee.sssNumber,
          philhealthNumber: editingEmployee.philhealthNumber,
          pagibigNumber: editingEmployee.pagibigNumber,
          tin: editingEmployee.tin ?? '',
        } : undefined}
      />
    </div>
  )
}
