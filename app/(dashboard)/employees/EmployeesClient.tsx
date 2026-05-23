'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Trash2, ChevronDown, ChevronUp, History } from 'lucide-react'
import { dailyToMonthly } from '@/lib/contributions'

// ─── Types ────────────────────────────────────────────────────────────────────

type SalaryHistoryEntry = {
  id: string
  dailyRate: number
  effectiveDate: string
  notes: string | null
}

type EmployeeRow = {
  id: string
  fullName: string
  position: string
  dateHired: string
  dailyRate: number
  sssNumber: string
  philhealthNumber: string
  pagibigNumber: string
  tin: string | null
  isActive: boolean
  salaryHistory: SalaryHistoryEntry[]
}

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'SICK_LEAVE' | 'VACATION_LEAVE'

type AttendanceEntry = {
  id: string
  employeeId: string
  date: string        // YYYY-MM-DD
  status: AttendanceStatus
  coveredById: string | null
}

type PayrollRow = {
  id: string
  employeeId: string
  employeeName: string
  dailyRate: number
  periodMonth: number
  periodYear: number
  periodWeek: number
  daysWorked: number
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
  dailyRate: string
  sssNumber: string
  philhealthNumber: string
  pagibigNumber: string
  tin: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function weekDateRange(month: number, year: number, week: number): { dates: string[] } {
  const startDay = (week - 1) * 7 + 1
  const daysInMonth = new Date(year, month, 0).getDate()
  const endDay = week < 4 ? Math.min(startDay + 6, daysInMonth) : daysInMonth
  const dates: string[] = []
  for (let d = startDay; d <= endDay; d++) {
    const m = String(month).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    dates.push(`${year}-${m}-${dd}`)
  }
  return { dates }
}

function weekLabel(month: number, year: number, week: number): string {
  const daysInMonth = new Date(year, month, 0).getDate()
  const startDay = (week - 1) * 7 + 1
  const endDay = week < 4 ? startDay + 6 : daysInMonth
  return `${MONTH_NAMES[month - 1]} ${startDay}–${endDay}, ${year}`
}

function prevWeek(month: number, year: number, week: number) {
  if (week > 1) return { month, year, week: week - 1 }
  const d = new Date(year, month - 1, 0)
  return { month: d.getMonth() + 1, year: d.getFullYear(), week: 4 }
}

function nextWeek(month: number, year: number, week: number) {
  if (week < 4) return { month, year, week: week + 1 }
  const d = new Date(year, month, 1)
  return { month: d.getMonth() + 1, year: d.getFullYear(), week: 1 }
}

function fmt(n: number) {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2 })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string; short: string }> = {
  PRESENT:        { label: 'Present',       color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300', short: '✓' },
  ABSENT:         { label: 'Absent',        color: 'text-red-700',     bg: 'bg-red-100 border-red-300',         short: '✗' },
  SICK_LEAVE:     { label: 'Sick',          color: 'text-amber-700',   bg: 'bg-amber-100 border-amber-300',     short: 'S' },
  VACATION_LEAVE: { label: 'Vacation',      color: 'text-blue-700',    bg: 'bg-blue-100 border-blue-300',       short: 'V' },
}

const STATUS_CYCLE: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'SICK_LEAVE', 'VACATION_LEAVE']

// ─── EmployeeSheet ────────────────────────────────────────────────────────────

function EmployeeSheet({
  open, onClose, onSave, initial,
}: {
  open: boolean
  onClose: () => void
  onSave: (data: EmployeeFormData) => Promise<void>
  initial?: EmployeeFormData
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [fullName, setFullName]               = useState(initial?.fullName ?? '')
  const [position, setPosition]               = useState(initial?.position ?? '')
  const [dateHired, setDateHired]             = useState(initial?.dateHired ?? today)
  const [dailyRate, setDailyRate]             = useState(initial?.dailyRate ?? '')
  const [sssNumber, setSssNumber]             = useState(initial?.sssNumber ?? '')
  const [philhealthNumber, setPhilhealthNumber] = useState(initial?.philhealthNumber ?? '')
  const [pagibigNumber, setPagibigNumber]     = useState(initial?.pagibigNumber ?? '')
  const [tin, setTin]                         = useState(initial?.tin ?? '')
  const [saving, setSaving]                   = useState(false)

  useEffect(() => {
    if (open) {
      setFullName(initial?.fullName ?? '')
      setPosition(initial?.position ?? '')
      setDateHired(initial?.dateHired ?? today)
      setDailyRate(initial?.dailyRate ?? '')
      setSssNumber(initial?.sssNumber ?? '')
      setPhilhealthNumber(initial?.philhealthNumber ?? '')
      setPagibigNumber(initial?.pagibigNumber ?? '')
      setTin(initial?.tin ?? '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const rate = Number(dailyRate)
  const monthly = rate > 0 ? dailyToMonthly(rate) : 0
  const canSave = fullName.trim() !== '' && position.trim() !== '' && dateHired !== '' && rate > 0 && sssNumber.trim() !== '' && philhealthNumber.trim() !== '' && pagibigNumber.trim() !== ''

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      await onSave({ fullName, position, dateHired, dailyRate, sssNumber, philhealthNumber, pagibigNumber, tin })
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
            <label className="text-xs font-medium text-muted-foreground">Daily Rate (₱) <span className="text-red-500">*</span></label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₱</span>
              <input type="number" min="0" step="0.01" value={dailyRate} onChange={e => setDailyRate(e.target.value)} placeholder="0.00" className="w-full min-h-[48px] rounded-lg border border-input bg-background pl-8 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            {monthly > 0 && (
              <p className="text-xs text-muted-foreground mt-1">≈ ₱{fmt(monthly)}/month (×26 days) — used for SSS/PhilHealth/Pag-IBIG brackets</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">SSS Number <span className="text-red-500">*</span></label>
            <input value={sssNumber} onChange={e => setSssNumber(e.target.value)} placeholder="34-1234567-8" className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">PhilHealth Number <span className="text-red-500">*</span></label>
            <input value={philhealthNumber} onChange={e => setPhilhealthNumber(e.target.value)} placeholder="12-123456789-0" className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Pag-IBIG Number <span className="text-red-500">*</span></label>
            <input value={pagibigNumber} onChange={e => setPagibigNumber(e.target.value)} placeholder="1234-5678-9012" className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">TIN (optional)</label>
            <input value={tin} onChange={e => setTin(e.target.value)} placeholder="123-456-789-000" className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1" />
          </div>
          <button onClick={handleSave} disabled={!canSave || saving} className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50">
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Add Employee'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── RaiseSheet ────────────────────────────────────────────────────────────────

function RaiseSheet({
  employee,
  open,
  onClose,
  onSave,
}: {
  employee: EmployeeRow
  open: boolean
  onClose: () => void
  onSave: (dailyRate: number, effectiveDate: string, notes: string) => Promise<void>
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [dailyRate, setDailyRate]   = useState(String(employee.dailyRate))
  const [effective, setEffective]   = useState(today)
  const [notes, setNotes]           = useState('')
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    if (open) {
      setDailyRate(String(employee.dailyRate))
      setEffective(today)
      setNotes('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const newRate = Number(dailyRate)
  const changed = newRate > 0 && newRate !== employee.dailyRate
  const monthly = newRate > 0 ? dailyToMonthly(newRate) : 0

  async function handleSave() {
    if (!changed) return
    setSaving(true)
    try {
      await onSave(newRate, effective, notes)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative rounded-t-2xl bg-background max-h-[80vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>
        <div className="flex items-center justify-between px-4 pb-3">
          <h2 className="text-base font-semibold">Adjust Rate — {employee.fullName}</h2>
          <button onClick={onClose} className="p-2 text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
        </div>
        <div className="overflow-y-auto px-4 pb-6 space-y-4">
          <div className="rounded-xl bg-muted/40 p-3 text-sm">
            <span className="text-muted-foreground">Current: </span>
            <span className="font-semibold">₱{fmt(employee.dailyRate)}/day</span>
            <span className="text-muted-foreground ml-2">(≈ ₱{fmt(dailyToMonthly(employee.dailyRate))}/month)</span>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">New Daily Rate (₱) <span className="text-red-500">*</span></label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₱</span>
              <input type="number" min="0" step="0.01" value={dailyRate} onChange={e => setDailyRate(e.target.value)} className="w-full min-h-[48px] rounded-lg border border-input bg-background pl-8 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            {monthly > 0 && (
              <p className="text-xs text-muted-foreground mt-1">≈ ₱{fmt(monthly)}/month (×26)</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Effective Date</label>
            <input type="date" value={effective} onChange={e => setEffective(e.target.value)} className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Reason (optional)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Annual raise, promotion" className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1" />
          </div>
          <button onClick={handleSave} disabled={!changed || saving} className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50">
            {saving ? 'Saving…' : 'Save New Rate'}
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
  initialAttendance,
  currentWeek,
  currentMonth,
  currentYear,
}: {
  initialEmployees: EmployeeRow[]
  initialPayroll: PayrollRow[]
  initialAttendance: AttendanceEntry[]
  currentWeek: number
  currentMonth: number
  currentYear: number
}) {
  const [tab, setTab] = useState<'employees' | 'attendance' | 'payroll'>('employees')

  // ── Employees tab ──
  const [employees, setEmployees]       = useState<EmployeeRow[]>(initialEmployees)
  const [sheetOpen, setSheetOpen]       = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRow | null>(null)
  const [raiseEmployee, setRaiseEmployee]     = useState<EmployeeRow | null>(null)
  const [expandedEmp, setExpandedEmp]   = useState<string | null>(null)

  // ── Attendance tab ──
  const [attMonth, setAttMonth] = useState(currentMonth)
  const [attYear,  setAttYear]  = useState(currentYear)
  const [attWeek,  setAttWeek]  = useState(currentWeek)
  const [attendance, setAttendance]     = useState<AttendanceEntry[]>(initialAttendance)
  const [markingDay, setMarkingDay]     = useState<{ empId: string; date: string } | null>(null)

  // ── Payroll tab ──
  const [payMonth, setPayMonth] = useState(currentMonth)
  const [payYear,  setPayYear]  = useState(currentYear)
  const [payWeek,  setPayWeek]  = useState(currentWeek)
  const [payrollRecords, setPayrollRecords] = useState<PayrollRow[]>(initialPayroll)
  const [loadingPayroll, setLoadingPayroll] = useState(false)
  const [runDialog, setRunDialog]           = useState(false)
  const [runDays, setRunDays]               = useState<Record<string, number>>({})
  const [runningPayroll, setRunningPayroll] = useState(false)
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null)

  // ── Active employees ──
  const activeEmployees = employees.filter(e => e.isActive)

  // ─── Fetch helpers ────────────────────────────────────────────────────────

  async function fetchEmployees() {
    try {
      const res = await fetch('/api/payroll/employees')
      if (!res.ok) throw new Error('Failed to load')
      setEmployees(await res.json())
    } catch { toast.error('Failed to refresh employees') }
  }

  const fetchAttendance = useCallback(async (month: number, year: number, week: number) => {
    const { dates } = weekDateRange(month, year, week)
    const start = dates[0], end = dates[dates.length - 1]
    try {
      const res = await fetch(`/api/payroll/attendance?startDate=${start}&endDate=${end}`)
      if (!res.ok) throw new Error('Failed to load attendance')
      setAttendance(await res.json())
    } catch { toast.error('Failed to load attendance') }
  }, [])

  const fetchPayroll = useCallback(async (month: number, year: number, week: number) => {
    setLoadingPayroll(true)
    try {
      const res = await fetch(`/api/payroll/records?month=${month}&year=${year}&week=${week}`)
      if (!res.ok) throw new Error('Failed to load payroll')
      setPayrollRecords(await res.json())
    } catch { toast.error('Failed to load payroll') } finally { setLoadingPayroll(false) }
  }, [])

  useEffect(() => {
    if (tab === 'attendance') fetchAttendance(attMonth, attYear, attWeek)
  }, [tab, attMonth, attYear, attWeek, fetchAttendance])

  useEffect(() => {
    if (tab === 'payroll') fetchPayroll(payMonth, payYear, payWeek)
  }, [tab, payMonth, payYear, payWeek, fetchPayroll])

  // ─── Attendance helpers ───────────────────────────────────────────────────

  function getStatus(empId: string, date: string): AttendanceStatus {
    return attendance.find(a => a.employeeId === empId && a.date === date)?.status ?? 'PRESENT'
  }

  function getCoveredBy(empId: string, date: string): string | null {
    return attendance.find(a => a.employeeId === empId && a.date === date)?.coveredById ?? null
  }

  // Count days worked for an employee in the current attendance week
  function countDaysWorked(empId: string, dates: string[]): number {
    // PRESENT by default if not marked
    // Also count days they COVERED another employee (as coverage earns extra day)
    const presentDays = dates.filter(d => getStatus(empId, d) === 'PRESENT').length
    const coverageDays = attendance.filter(a => a.coveredById === empId).length
    return presentDays + coverageDays
  }

  async function markAttendance(empId: string, date: string, status: AttendanceStatus, coveredById?: string | null) {
    try {
      await fetch('/api/payroll/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: empId, date, status, coveredById: coveredById ?? null }),
      })
      // Optimistic update
      setAttendance(prev => {
        const existing = prev.findIndex(a => a.employeeId === empId && a.date === date)
        const entry: AttendanceEntry = { id: Date.now().toString(), employeeId: empId, date, status, coveredById: coveredById ?? null }
        if (existing >= 0) {
          const next = [...prev]; next[existing] = entry; return next
        }
        return [...prev, entry]
      })
    } catch { toast.error('Failed to mark attendance') }
  }

  function cycleStatus(empId: string, date: string) {
    const current = getStatus(empId, date)
    const idx = STATUS_CYCLE.indexOf(current)
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    // If going to absent, open coverage picker
    if (next === 'ABSENT') {
      setMarkingDay({ empId, date })
    }
    markAttendance(empId, date, next, next !== 'ABSENT' ? null : getCoveredBy(empId, date))
  }

  // ─── Employee actions ─────────────────────────────────────────────────────

  async function handleSaveEmployee(data: EmployeeFormData) {
    const body = {
      fullName: data.fullName, position: data.position, dateHired: data.dateHired,
      dailyRate: Number(data.dailyRate), sssNumber: data.sssNumber,
      philhealthNumber: data.philhealthNumber, pagibigNumber: data.pagibigNumber,
      tin: data.tin || null,
    }
    try {
      if (editingEmployee) {
        const res = await fetch(`/api/payroll/employees/${editingEmployee.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Failed to update employee')
        toast.success('Employee updated')
      } else {
        const res = await fetch('/api/payroll/employees', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Failed to add employee')
        toast.success('Employee added')
      }
      setSheetOpen(false); setEditingEmployee(null); fetchEmployees()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Something went wrong') }
  }

  async function handleRaise(dailyRate: number, effectiveDate: string, notes: string) {
    if (!raiseEmployee) return
    try {
      const res = await fetch(`/api/payroll/employees/${raiseEmployee.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyRate, rateEffectiveDate: effectiveDate, rateNotes: notes }),
      })
      if (!res.ok) throw new Error('Failed to save')
      toast.success('Rate updated')
      setRaiseEmployee(null); fetchEmployees()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Something went wrong') }
  }

  async function handleToggleActive(emp: EmployeeRow) {
    try {
      const res = await fetch(`/api/payroll/employees/${emp.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !emp.isActive }),
      })
      if (!res.ok) throw new Error('Failed to update')
      fetchEmployees()
    } catch { toast.error('Failed to update') }
  }

  // ─── Payroll actions ──────────────────────────────────────────────────────

  function openRunDialog() {
    const { dates } = weekDateRange(payMonth, payYear, payWeek)
    const activeWithoutRecord = activeEmployees.filter(e => !payrollRecords.find(r => r.employeeId === e.id))
    // Pre-fill days from attendance if available (attendance week must match payroll week)
    const days: Record<string, number> = {}
    for (const emp of activeWithoutRecord) {
      // Try to get attendance count if weeks match
      const attDays = attMonth === payMonth && attYear === payYear && attWeek === payWeek
        ? countDaysWorked(emp.id, dates)
        : 6
      days[emp.id] = Math.max(0, Math.min(attDays, 7))
    }
    setRunDays(days)
    setRunDialog(true)
  }

  async function handleRunPayroll() {
    const activeWithoutRecord = activeEmployees.filter(e => !payrollRecords.find(r => r.employeeId === e.id))
    setRunningPayroll(true)
    try {
      const results = await Promise.allSettled(
        activeWithoutRecord.map(emp =>
          fetch('/api/payroll/records', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeId: emp.id,
              periodMonth: payMonth,
              periodYear: payYear,
              periodWeek: payWeek,
              daysWorked: runDays[emp.id] ?? 6,
            }),
          })
        )
      )
      const failed = results.filter(r => r.status === 'rejected').length
      if (failed > 0) toast.error(`${failed} record(s) failed — check for duplicates`)
      else toast.success(`Week ${payWeek} payroll run for ${activeWithoutRecord.length} employee${activeWithoutRecord.length !== 1 ? 's' : ''}`)
      setRunDialog(false)
      fetchPayroll(payMonth, payYear, payWeek)
    } catch { toast.error('Failed to run payroll') } finally { setRunningPayroll(false) }
  }

  async function handleDeleteRecord(id: string) {
    try {
      const res = await fetch(`/api/payroll/records/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Payroll record deleted')
      setDeletingRecordId(null)
      fetchPayroll(payMonth, payYear, payWeek)
    } catch { toast.error('Failed to delete') }
  }

  // ─── Computed ─────────────────────────────────────────────────────────────

  const attDates = weekDateRange(attMonth, attYear, attWeek).dates
  const payLabel = weekLabel(payMonth, payYear, payWeek)
  const attLabel = weekLabel(attMonth, attYear, attWeek)

  const totalWeeklyGross        = payrollRecords.reduce((s, r) => s + r.basicSalary, 0)
  const totalEmployerContribs   = payrollRecords.reduce((s, r) => s + r.sssEmployer + r.philhealthEmployer + r.pagibigEmployer, 0)
  const totalNetPayroll         = payrollRecords.reduce((s, r) => s + r.netPay, 0)
  const activeWithoutRecord     = activeEmployees.filter(e => !payrollRecords.find(r => r.employeeId === e.id))

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 pb-4">
      <h1 className="text-xl font-bold">Employees & Payroll</h1>

      {/* Tab selector */}
      <div className="flex rounded-xl border overflow-hidden text-sm font-medium">
        {(['employees', 'attendance', 'payroll'] as const).map((t) => (
          <button
            key={t}
            className={`flex-1 py-2.5 capitalize transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'}`}
            onClick={() => setTab(t)}
          >
            {t === 'attendance' ? 'Attendance' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ══ EMPLOYEES TAB ══════════════════════════════════════════════════ */}
      {tab === 'employees' && (
        <div className="space-y-3">
          <button
            onClick={() => { setEditingEmployee(null); setSheetOpen(true) }}
            className="w-full min-h-[48px] rounded-xl border-2 border-dashed border-primary text-primary text-sm font-medium flex items-center justify-center gap-2"
          >
            + Add Employee
          </button>

          {employees.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No employees yet.</p>
          )}

          {employees.map(emp => (
            <div key={emp.id} className={`rounded-xl border bg-background overflow-hidden ${!emp.isActive ? 'opacity-60' : ''}`}>
              {/* Header row */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{emp.fullName}</span>
                      {!emp.isActive && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Terminated</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{emp.position}</p>

                    {/* Rate + action row */}
                    <div className="flex items-center gap-3 mt-2">
                      <div>
                        <span className="text-sm font-bold">₱{fmt(emp.dailyRate)}</span>
                        <span className="text-xs text-muted-foreground">/day</span>
                        <span className="text-xs text-muted-foreground ml-2">(≈ ₱{fmt(dailyToMonthly(emp.dailyRate))}/mo)</span>
                      </div>
                      {emp.isActive && (
                        <button
                          onClick={() => setRaiseEmployee(emp)}
                          className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary font-medium min-h-[32px]"
                        >
                          Adjust Rate
                        </button>
                      )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>SSS: {emp.sssNumber}</span>
                      <span>PhilHealth: {emp.philhealthNumber}</span>
                      <span>Pag-IBIG: {emp.pagibigNumber}</span>
                      {emp.tin && <span>TIN: {emp.tin}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Hired: {fmtDate(emp.dateHired)}</p>
                  </div>

                  {/* Active toggle */}
                  <button
                    onClick={() => handleToggleActive(emp)}
                    className={`relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors mt-1 ${emp.isActive ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${emp.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>

              {/* Salary history expandable */}
              {emp.salaryHistory.length > 0 && (
                <>
                  <button
                    onClick={() => setExpandedEmp(expandedEmp === emp.id ? null : emp.id)}
                    className="w-full flex items-center gap-2 px-4 py-2 border-t border-border/40 text-xs text-muted-foreground bg-muted/20"
                  >
                    <History className="w-3 h-3" />
                    <span>Rate history ({emp.salaryHistory.length})</span>
                    {expandedEmp === emp.id ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                  </button>
                  {expandedEmp === emp.id && (
                    <div className="px-4 py-2 border-t border-border/40 bg-muted/10 space-y-1">
                      {emp.salaryHistory.map((h, i) => (
                        <div key={h.id} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{fmtDate(h.effectiveDate)}{h.notes ? ` — ${h.notes}` : ''}</span>
                          <span className={`font-medium ${i === 0 ? 'text-primary' : ''}`}>₱{fmt(h.dailyRate)}/day</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ══ ATTENDANCE TAB ═════════════════════════════════════════════════ */}
      {tab === 'attendance' && (
        <div className="space-y-4">
          {/* Week nav */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { const p = prevWeek(attMonth, attYear, attWeek); setAttMonth(p.month); setAttYear(p.year); setAttWeek(p.week) }}
              className="p-2 rounded-lg border min-h-[44px] min-w-[44px] flex items-center justify-center text-lg"
            >‹</button>
            <div className="flex-1 text-center">
              <p className="font-medium text-sm">{attLabel}</p>
              <p className="text-xs text-muted-foreground">Tap day to mark</p>
            </div>
            <button
              onClick={() => { const n = nextWeek(attMonth, attYear, attWeek); setAttMonth(n.month); setAttYear(n.year); setAttWeek(n.week) }}
              className="p-2 rounded-lg border min-h-[44px] min-w-[44px] flex items-center justify-center text-lg"
            >›</button>
          </div>

          {/* Legend */}
          <div className="flex gap-2 flex-wrap text-xs">
            {Object.entries(STATUS_CONFIG).map(([s, c]) => (
              <span key={s} className={`px-2 py-0.5 rounded-full border ${c.bg} ${c.color} font-medium`}>{c.label}</span>
            ))}
          </div>

          {activeEmployees.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No active employees.</p>
          )}

          {activeEmployees.map(emp => {
            const daysWorked = countDaysWorked(emp.id, attDates)
            return (
              <div key={emp.id} className="rounded-xl border bg-background p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-sm">{emp.fullName}</p>
                    <p className="text-xs text-muted-foreground">{emp.position} · ₱{fmt(emp.dailyRate)}/day</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">{daysWorked}</span>
                    <span className="text-xs text-muted-foreground">/{attDates.length} days</span>
                  </div>
                </div>

                {/* Day grid */}
                <div className="flex gap-1 flex-wrap">
                  {attDates.map(date => {
                    const dayOfWeek = new Date(date + 'T00:00:00').getDay()
                    const dayName = DAY_NAMES[dayOfWeek]
                    const dayNum = date.slice(8)
                    const status = getStatus(emp.id, date)
                    const cfg = STATUS_CONFIG[status]
                    return (
                      <button
                        key={date}
                        onClick={() => cycleStatus(emp.id, date)}
                        className={`flex-1 min-w-[38px] rounded-lg border-2 py-1.5 flex flex-col items-center gap-0.5 transition-colors ${cfg.bg} ${cfg.color}`}
                      >
                        <span className="text-[10px] font-medium opacity-70">{dayName}</span>
                        <span className="text-xs font-bold">{dayNum}</span>
                        <span className="text-xs font-semibold">{cfg.short}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Coverage picker — show when someone is absent */}
                {attDates.some(d => getStatus(emp.id, d) === 'ABSENT') && (
                  <div className="mt-2 pt-2 border-t border-border/40">
                    {attDates.filter(d => getStatus(emp.id, d) === 'ABSENT').map(date => {
                      const coveredById = getCoveredBy(emp.id, date)
                      return (
                        <div key={date} className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} covered by:
                          </span>
                          <select
                            value={coveredById ?? ''}
                            onChange={e => markAttendance(emp.id, date, 'ABSENT', e.target.value || null)}
                            className="flex-1 min-h-[36px] rounded-lg border border-input bg-background px-2 text-xs outline-none"
                          >
                            <option value="">— none —</option>
                            {activeEmployees.filter(e => e.id !== emp.id).map(e => (
                              <option key={e.id} value={e.id}>{e.fullName}</option>
                            ))}
                          </select>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* Coverage summary */}
          {attendance.some(a => a.coveredById) && (
            <div className="rounded-xl border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground text-sm mb-1">Coverage this week</p>
              {activeEmployees.map(emp => {
                const coverageCount = attendance.filter(a => a.coveredById === emp.id).length
                if (coverageCount === 0) return null
                return (
                  <div key={emp.id} className="flex justify-between">
                    <span>{emp.fullName}</span>
                    <span className="font-medium text-emerald-700">+{coverageCount} day{coverageCount !== 1 ? 's' : ''} extra</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══ PAYROLL TAB ════════════════════════════════════════════════════ */}
      {tab === 'payroll' && (
        <div className="space-y-4">
          {/* Week nav */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { const p = prevWeek(payMonth, payYear, payWeek); setPayMonth(p.month); setPayYear(p.year); setPayWeek(p.week) }}
              className="p-2 rounded-lg border min-h-[44px] min-w-[44px] flex items-center justify-center text-lg"
            >‹</button>
            <div className="flex-1 text-center">
              <p className="font-medium text-sm">{payLabel}</p>
              <p className="text-xs text-muted-foreground">Weekly payroll</p>
            </div>
            <button
              onClick={() => { const n = nextWeek(payMonth, payYear, payWeek); setPayMonth(n.month); setPayYear(n.year); setPayWeek(n.week) }}
              className="p-2 rounded-lg border min-h-[44px] min-w-[44px] flex items-center justify-center text-lg"
            >›</button>
          </div>

          {/* Run Payroll button */}
          {activeWithoutRecord.length > 0 && (
            <button
              onClick={openRunDialog}
              className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground text-sm font-medium"
            >
              Run Payroll — {activeWithoutRecord.length} Employee{activeWithoutRecord.length !== 1 ? 's' : ''}
            </button>
          )}

          {loadingPayroll ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
          ) : (
            <div className="space-y-3">
              {/* Active employees with no record — greyed out */}
              {activeWithoutRecord.map(emp => (
                <div key={emp.id} className="rounded-xl border bg-background p-4 opacity-40">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{emp.fullName}</p>
                      <p className="text-xs text-muted-foreground">₱{fmt(emp.dailyRate)}/day</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Not run</span>
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
                        <p className="text-xs text-muted-foreground">
                          {payLabel} · ₱{fmt(rec.dailyRate)}/day × {rec.daysWorked} days
                        </p>

                        <div className="mt-3 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Gross ({rec.daysWorked}d × ₱{fmt(rec.dailyRate)})</span>
                            <span>₱{fmt(rec.basicSalary)}</span>
                          </div>
                          <div className="flex justify-between text-red-600">
                            <span>SSS</span><span>-₱{fmt(rec.sssEmployee)}</span>
                          </div>
                          <div className="flex justify-between text-red-600">
                            <span>PhilHealth</span><span>-₱{fmt(rec.philhealthEmployee)}</span>
                          </div>
                          <div className="flex justify-between text-red-600">
                            <span>Pag-IBIG</span><span>-₱{fmt(rec.pagibigEmployee)}</span>
                          </div>
                          <div className="flex justify-between text-red-600">
                            <span>Withholding Tax</span><span>-₱{fmt(rec.withholdingTax)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                            <span>Net Pay</span>
                            <span className="text-emerald-700">₱{fmt(rec.netPay)}</span>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground flex flex-wrap gap-x-3">
                          <span>Employer: SSS ₱{fmt(rec.sssEmployer)}</span>
                          <span>PhilHealth ₱{fmt(rec.philhealthEmployer)}</span>
                          <span>Pag-IBIG ₱{fmt(rec.pagibigEmployer)}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setDeletingRecordId(rec.id)}
                        className="p-2 text-muted-foreground hover:text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {deletingRecordId === rec.id && (
                    <div className="mt-1 rounded-xl border border-red-200 bg-red-50 p-3 flex items-center justify-between gap-2">
                      <span className="text-sm text-red-800">Delete this record?</span>
                      <div className="flex gap-2">
                        <button onClick={() => setDeletingRecordId(null)} className="text-xs px-3 py-1.5 rounded-lg border min-h-[36px]">Cancel</button>
                        <button onClick={() => handleDeleteRecord(rec.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white min-h-[36px]">Delete</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {activeEmployees.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No active employees.</p>
              )}
            </div>
          )}

          {/* Summary */}
          {payrollRecords.length > 0 && (
            <div className="rounded-xl border bg-muted/30 p-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gross Payroll</span>
                <span className="font-medium">₱{fmt(totalWeeklyGross)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employer Contributions</span>
                <span className="font-medium">₱{fmt(totalEmployerContribs)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-1 mt-1">
                <span>Net Payroll</span>
                <span>₱{fmt(totalNetPayroll)}</span>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center px-2">
            ⚠ Estimated deductions — verify with your accountant before government remittance.
          </p>
        </div>
      )}

      {/* ══ RUN PAYROLL DIALOG ═════════════════════════════════════════════ */}
      {runDialog && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRunDialog(false)} />
          <div className="relative rounded-t-2xl bg-background max-h-[85vh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="flex items-center justify-between px-4 pb-3">
              <div>
                <h2 className="text-base font-semibold">Run Payroll</h2>
                <p className="text-xs text-muted-foreground">{payLabel}</p>
              </div>
              <button onClick={() => setRunDialog(false)} className="p-2 text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
            </div>
            <div className="overflow-y-auto px-4 pb-6 space-y-3">
              <p className="text-xs text-muted-foreground">Adjust days worked per employee. Pre-filled from attendance where available.</p>

              {activeWithoutRecord.map(emp => (
                <div key={emp.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{emp.fullName}</p>
                      <p className="text-xs text-muted-foreground">₱{fmt(emp.dailyRate)}/day</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRunDays(d => ({ ...d, [emp.id]: Math.max(0, (d[emp.id] ?? 6) - 1) }))}
                        className="w-8 h-8 rounded-full border flex items-center justify-center text-lg font-bold text-muted-foreground"
                      >−</button>
                      <div className="text-center w-12">
                        <span className="text-lg font-bold">{runDays[emp.id] ?? 6}</span>
                        <p className="text-[10px] text-muted-foreground">days</p>
                      </div>
                      <button
                        onClick={() => setRunDays(d => ({ ...d, [emp.id]: Math.min(7, (d[emp.id] ?? 6) + 1) }))}
                        className="w-8 h-8 rounded-full border flex items-center justify-center text-lg font-bold text-muted-foreground"
                      >+</button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    Gross: ₱{fmt((runDays[emp.id] ?? 6) * emp.dailyRate)}
                  </p>
                </div>
              ))}

              <button
                onClick={handleRunPayroll}
                disabled={runningPayroll}
                className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
              >
                {runningPayroll ? 'Running…' : 'Confirm & Run Payroll'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Coverage day marking dialog (when marking absent) ─────────────── */}
      {markingDay && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMarkingDay(null)} />
          <div className="relative w-full rounded-t-2xl bg-background p-4 pb-8 space-y-3">
            <p className="font-semibold text-sm">Who covered this shift?</p>
            <p className="text-xs text-muted-foreground">The covering employee earns an extra day&apos;s pay.</p>
            <div className="space-y-2">
              {activeEmployees.filter(e => e.id !== markingDay.empId).map(e => (
                <button
                  key={e.id}
                  onClick={() => {
                    markAttendance(markingDay.empId, markingDay.date, 'ABSENT', e.id)
                    setMarkingDay(null)
                  }}
                  className="w-full min-h-[48px] rounded-xl border text-left px-4 py-2 text-sm font-medium active:bg-muted"
                >
                  {e.fullName} <span className="text-muted-foreground font-normal">— {e.position}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  markAttendance(markingDay.empId, markingDay.date, 'ABSENT', null)
                  setMarkingDay(null)
                }}
                className="w-full min-h-[44px] rounded-xl border text-left px-4 py-2 text-sm text-muted-foreground"
              >
                No coverage — shift not filled
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Employee add/edit sheet ─────────────────────────────────────── */}
      <EmployeeSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditingEmployee(null) }}
        onSave={handleSaveEmployee}
        initial={editingEmployee ? {
          fullName: editingEmployee.fullName,
          position: editingEmployee.position,
          dateHired: editingEmployee.dateHired.slice(0, 10),
          dailyRate: String(editingEmployee.dailyRate),
          sssNumber: editingEmployee.sssNumber,
          philhealthNumber: editingEmployee.philhealthNumber,
          pagibigNumber: editingEmployee.pagibigNumber,
          tin: editingEmployee.tin ?? '',
        } : undefined}
      />

      {/* ── Raise sheet ────────────────────────────────────────────────── */}
      {raiseEmployee && (
        <RaiseSheet
          employee={raiseEmployee}
          open={!!raiseEmployee}
          onClose={() => setRaiseEmployee(null)}
          onSave={handleRaise}
        />
      )}
    </div>
  )
}
