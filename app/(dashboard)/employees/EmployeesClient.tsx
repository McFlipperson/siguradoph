'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Trash2, ChevronDown, ChevronUp, History, Gift, Umbrella } from 'lucide-react'
import { dailyToMonthly } from '@/lib/contributions'
import type { Holiday } from '@/lib/ph-holidays'

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
  // SIL
  silEligible: boolean
  silUsed: number
  silEntitlement: number
  // 13th month summary
  thirteenthMonthAccrued: number
  thirteenthMonthPaid: boolean
  thirteenthMidYearPaid: boolean
}

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'SICK_LEAVE' | 'VACATION_LEAVE'

type AttendanceEntry = {
  id: string
  employeeId: string
  date: string
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
  regularHolidayDays: number
  specialHolidayDays: number
  holidayPay: number
  sssEmployee: number
  sssEmployer: number
  sssEc: number
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

type ThirteenthMonthEntry = {
  employeeId: string
  employeeName: string
  dailyRate: number
  totalBasicPay: number
  amount: number
  midYearPaid: boolean
  fullYearPaid: boolean
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
    dates.push(`${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`)
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

function fmt(n: number) { return n.toLocaleString('en-PH', { minimumFractionDigits: 2 }) }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; bg: string; short: string }> = {
  PRESENT:        { label: 'Present',  color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300', short: '✓' },
  ABSENT:         { label: 'Absent',   color: 'text-red-700',     bg: 'bg-red-100 border-red-300',         short: '✗' },
  SICK_LEAVE:     { label: 'Sick',     color: 'text-amber-700',   bg: 'bg-amber-100 border-amber-300',     short: 'S' },
  VACATION_LEAVE: { label: 'Vacation', color: 'text-blue-700',    bg: 'bg-blue-100 border-blue-300',       short: 'V' },
}
const STATUS_CYCLE: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'SICK_LEAVE', 'VACATION_LEAVE']

// ─── EmployeeSheet ────────────────────────────────────────────────────────────

function EmployeeSheet({ open, onClose, onSave, initial }: {
  open: boolean; onClose: () => void
  onSave: (data: EmployeeFormData) => Promise<void>
  initial?: EmployeeFormData
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [fullName, setFullName] = useState(initial?.fullName ?? '')
  const [position, setPosition] = useState(initial?.position ?? '')
  const [dateHired, setDateHired] = useState(initial?.dateHired ?? today)
  const [dailyRate, setDailyRate] = useState(initial?.dailyRate ?? '')
  const [sssNumber, setSssNumber] = useState(initial?.sssNumber ?? '')
  const [philhealthNumber, setPhilhealthNumber] = useState(initial?.philhealthNumber ?? '')
  const [pagibigNumber, setPagibigNumber] = useState(initial?.pagibigNumber ?? '')
  const [tin, setTin] = useState(initial?.tin ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setFullName(initial?.fullName ?? ''); setPosition(initial?.position ?? '')
      setDateHired(initial?.dateHired ?? today); setDailyRate(initial?.dailyRate ?? '')
      setSssNumber(initial?.sssNumber ?? ''); setPhilhealthNumber(initial?.philhealthNumber ?? '')
      setPagibigNumber(initial?.pagibigNumber ?? ''); setTin(initial?.tin ?? '')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const rate = Number(dailyRate)
  const monthly = rate > 0 ? dailyToMonthly(rate) : 0
  const canSave = fullName.trim() !== '' && position.trim() !== '' && dateHired !== '' && rate > 0 && sssNumber.trim() !== '' && philhealthNumber.trim() !== '' && pagibigNumber.trim() !== ''

  async function handleSave() {
    if (!canSave) return; setSaving(true)
    try { await onSave({ fullName, position, dateHired, dailyRate, sssNumber, philhealthNumber, pagibigNumber, tin }) }
    finally { setSaving(false) }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative rounded-t-2xl bg-background max-h-[92vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-muted-foreground/30" /></div>
        <div className="flex items-center justify-between px-4 pb-3">
          <h2 className="text-base font-semibold">{initial ? 'Edit Employee' : 'Add Employee'}</h2>
          <button onClick={onClose} className="p-2 text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
        </div>
        <div className="overflow-y-auto px-4 pb-6 space-y-4">
          {([
            { label: 'Full Name', val: fullName, set: setFullName, ph: 'Maria Santos' },
            { label: 'Position', val: position, set: setPosition, ph: 'Dental Assistant' },
          ] as const).map(f => (
            <div key={f.label}>
              <label className="text-xs font-medium text-muted-foreground">{f.label} <span className="text-red-500">*</span></label>
              <input value={f.val} onChange={e => (f.set as (v: string) => void)(e.target.value)} placeholder={f.ph} className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1" />
            </div>
          ))}
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
            {monthly > 0 && <p className="text-xs text-muted-foreground mt-1">≈ ₱{fmt(monthly)}/month (×26 days) — for SSS/PhilHealth/Pag-IBIG brackets</p>}
          </div>
          {([
            { label: 'SSS Number', val: sssNumber, set: setSssNumber, ph: '34-1234567-8' },
            { label: 'PhilHealth Number', val: philhealthNumber, set: setPhilhealthNumber, ph: '12-123456789-0' },
            { label: 'Pag-IBIG Number', val: pagibigNumber, set: setPagibigNumber, ph: '1234-5678-9012' },
          ] as const).map(f => (
            <div key={f.label}>
              <label className="text-xs font-medium text-muted-foreground">{f.label} <span className="text-red-500">*</span></label>
              <input value={f.val} onChange={e => (f.set as (v: string) => void)(e.target.value)} placeholder={f.ph} className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1" />
            </div>
          ))}
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

// ─── RaiseSheet ───────────────────────────────────────────────────────────────

function RaiseSheet({ employee, open, onClose, onSave }: {
  employee: EmployeeRow; open: boolean; onClose: () => void
  onSave: (dailyRate: number, effectiveDate: string, notes: string) => Promise<void>
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [dailyRate, setDailyRate] = useState(String(employee.dailyRate))
  const [effective, setEffective] = useState(today)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) { setDailyRate(String(employee.dailyRate)); setEffective(today); setNotes('') }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const newRate = Number(dailyRate)
  const changed = newRate > 0 && newRate !== employee.dailyRate
  const monthly = newRate > 0 ? dailyToMonthly(newRate) : 0

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative rounded-t-2xl bg-background max-h-[80vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-muted-foreground/30" /></div>
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
            {monthly > 0 && <p className="text-xs text-muted-foreground mt-1">≈ ₱{fmt(monthly)}/month</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Effective Date</label>
            <input type="date" value={effective} onChange={e => setEffective(e.target.value)} className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Reason (optional)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Annual raise, promotion…" className="w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring mt-1" />
          </div>
          <button
            onClick={async () => { setSaving(true); try { await onSave(newRate, effective, notes) } finally { setSaving(false) } }}
            disabled={!changed || saving}
            className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground font-medium text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save New Rate'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EmployeesClient({
  initialEmployees, initialPayroll, initialAttendance,
  weekHolidays, yearHolidays,
  currentWeek, currentMonth, currentYear,
}: {
  initialEmployees: EmployeeRow[]
  initialPayroll: PayrollRow[]
  initialAttendance: AttendanceEntry[]
  weekHolidays: Holiday[]
  yearHolidays: Holiday[]
  currentWeek: number
  currentMonth: number
  currentYear: number
}) {
  const [tab, setTab] = useState<'employees' | 'attendance' | 'payroll'>('employees')

  // Employees
  const [employees, setEmployees]       = useState<EmployeeRow[]>(initialEmployees)
  const [sheetOpen, setSheetOpen]       = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRow | null>(null)
  const [raiseEmployee, setRaiseEmployee]     = useState<EmployeeRow | null>(null)
  const [expandedEmp, setExpandedEmp]   = useState<string | null>(null)

  // Attendance
  const [attMonth, setAttMonth] = useState(currentMonth)
  const [attYear,  setAttYear]  = useState(currentYear)
  const [attWeek,  setAttWeek]  = useState(currentWeek)
  const [attendance, setAttendance]  = useState<AttendanceEntry[]>(initialAttendance)
  const [attHolidays, setAttHolidays] = useState<Holiday[]>(weekHolidays)
  const [markingDay, setMarkingDay]  = useState<{ empId: string; date: string } | null>(null)

  // Payroll
  const [payMonth, setPayMonth] = useState(currentMonth)
  const [payYear,  setPayYear]  = useState(currentYear)
  const [payWeek,  setPayWeek]  = useState(currentWeek)
  const [payrollRecords, setPayrollRecords]   = useState<PayrollRow[]>(initialPayroll)
  const [loadingPayroll, setLoadingPayroll]   = useState(false)
  const [runDialog, setRunDialog]             = useState(false)
  const [runDays, setRunDays]                 = useState<Record<string, number>>({})
  const [runSpecial, setRunSpecial]           = useState<Record<string, number>>({})
  const [runningPayroll, setRunningPayroll]   = useState(false)
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null)

  // 13th month
  const [thirteenth, setThirteenth]       = useState<ThirteenthMonthEntry[]>([])
  const [loadingThirteenth, setLoadingThirteenth] = useState(false)
  const [showThirteenth, setShowThirteenth] = useState(false)

  const activeEmployees = employees.filter(e => e.isActive)

  // ─── Fetchers ────────────────────────────────────────────────────────────

  async function fetchEmployees() {
    try {
      const res = await fetch('/api/payroll/employees')
      if (!res.ok) throw new Error()
      setEmployees(await res.json())
    } catch { toast.error('Failed to refresh employees') }
  }

  const fetchAttendance = useCallback(async (month: number, year: number, week: number) => {
    const { dates } = weekDateRange(month, year, week)
    const start = dates[0], end = dates[dates.length - 1]
    const [attRes, holRes] = await Promise.all([
      fetch(`/api/payroll/attendance?startDate=${start}&endDate=${end}`),
      fetch(`/api/payroll/holidays?dates=${dates.join(',')}`),
    ])
    if (attRes.ok) setAttendance(await attRes.json())
    if (holRes.ok) setAttHolidays(await holRes.json())
  }, [])

  const fetchPayroll = useCallback(async (month: number, year: number, week: number) => {
    setLoadingPayroll(true)
    try {
      const res = await fetch(`/api/payroll/records?month=${month}&year=${year}&week=${week}`)
      if (!res.ok) throw new Error()
      setPayrollRecords(await res.json())
    } catch { toast.error('Failed to load payroll') } finally { setLoadingPayroll(false) }
  }, [])

  async function fetchThirteenth() {
    setLoadingThirteenth(true)
    try {
      const res = await fetch(`/api/payroll/thirteenth-month?year=${currentYear}`)
      if (!res.ok) throw new Error()
      setThirteenth(await res.json())
    } catch { toast.error('Failed to load 13th month data') } finally { setLoadingThirteenth(false) }
  }

  useEffect(() => {
    if (tab === 'attendance') fetchAttendance(attMonth, attYear, attWeek)
  }, [tab, attMonth, attYear, attWeek, fetchAttendance])

  useEffect(() => {
    if (tab === 'payroll') fetchPayroll(payMonth, payYear, payWeek)
  }, [tab, payMonth, payYear, payWeek, fetchPayroll])

  useEffect(() => {
    if (tab === 'payroll' && showThirteenth && thirteenth.length === 0) fetchThirteenth()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, showThirteenth])

  // ─── Attendance helpers ───────────────────────────────────────────────────

  function getStatus(empId: string, date: string): AttendanceStatus {
    return attendance.find(a => a.employeeId === empId && a.date === date)?.status ?? 'PRESENT'
  }
  function getCoveredBy(empId: string, date: string): string | null {
    return attendance.find(a => a.employeeId === empId && a.date === date)?.coveredById ?? null
  }
  function getHoliday(date: string) { return attHolidays.find(h => h.date === date) ?? null }

  function countDaysWorked(empId: string, dates: string[]): number {
    const presentDays  = dates.filter(d => getStatus(empId, d) === 'PRESENT').length
    const coverageDays = attendance.filter(a => a.coveredById === empId).length
    return presentDays + coverageDays
  }

  async function markAttendance(empId: string, date: string, status: AttendanceStatus, coveredById?: string | null) {
    try {
      await fetch('/api/payroll/attendance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: empId, date, status, coveredById: coveredById ?? null }),
      })
      setAttendance(prev => {
        const entry: AttendanceEntry = { id: Date.now().toString(), employeeId: empId, date, status, coveredById: coveredById ?? null }
        const idx = prev.findIndex(a => a.employeeId === empId && a.date === date)
        if (idx >= 0) { const next = [...prev]; next[idx] = entry; return next }
        return [...prev, entry]
      })
    } catch { toast.error('Failed to mark attendance') }
  }

  function cycleStatus(empId: string, date: string) {
    const current = getStatus(empId, date)
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length]
    if (next === 'ABSENT') setMarkingDay({ empId, date })
    markAttendance(empId, date, next, next !== 'ABSENT' ? null : getCoveredBy(empId, date))
  }

  // ─── Employee actions ─────────────────────────────────────────────────────

  async function handleSaveEmployee(data: EmployeeFormData) {
    const body = { fullName: data.fullName, position: data.position, dateHired: data.dateHired, dailyRate: Number(data.dailyRate), sssNumber: data.sssNumber, philhealthNumber: data.philhealthNumber, pagibigNumber: data.pagibigNumber, tin: data.tin || null }
    try {
      const method = editingEmployee ? 'PATCH' : 'POST'
      const url = editingEmployee ? `/api/payroll/employees/${editingEmployee.id}` : '/api/payroll/employees'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(editingEmployee ? 'Failed to update' : 'Failed to add')
      toast.success(editingEmployee ? 'Employee updated' : 'Employee added')
      setSheetOpen(false); setEditingEmployee(null); fetchEmployees()
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Something went wrong') }
  }

  async function handleRaise(dailyRate: number, effectiveDate: string, notes: string) {
    if (!raiseEmployee) return
    try {
      await fetch(`/api/payroll/employees/${raiseEmployee.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyRate, rateEffectiveDate: effectiveDate, rateNotes: notes }),
      })
      toast.success('Rate updated')
      setRaiseEmployee(null); fetchEmployees()
    } catch { toast.error('Failed to save rate') }
  }

  async function handleToggleActive(emp: EmployeeRow) {
    try {
      await fetch(`/api/payroll/employees/${emp.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !emp.isActive }),
      })
      fetchEmployees()
    } catch { toast.error('Failed to update') }
  }

  // ─── Payroll actions ──────────────────────────────────────────────────────

  function openRunDialog() {
    const { dates } = weekDateRange(payMonth, payYear, payWeek)
    const noRecord = activeEmployees.filter(e => !payrollRecords.find(r => r.employeeId === e.id))
    const days: Record<string, number> = {}
    const special: Record<string, number> = {}
    for (const emp of noRecord) {
      days[emp.id]    = attMonth === payMonth && attYear === payYear && attWeek === payWeek
        ? Math.max(0, Math.min(countDaysWorked(emp.id, dates), 7)) : 6
      special[emp.id] = 0
    }
    setRunDays(days); setRunSpecial(special); setRunDialog(true)
  }

  async function handleRunPayroll() {
    const noRecord = activeEmployees.filter(e => !payrollRecords.find(r => r.employeeId === e.id))
    setRunningPayroll(true)
    try {
      const results = await Promise.allSettled(
        noRecord.map(emp =>
          fetch('/api/payroll/records', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeId: emp.id, periodMonth: payMonth, periodYear: payYear, periodWeek: payWeek,
              daysWorked: runDays[emp.id] ?? 6, specialHolidayDays: runSpecial[emp.id] ?? 0,
            }),
          })
        )
      )
      const failed = results.filter(r => r.status === 'rejected').length
      if (failed) toast.error(`${failed} record(s) failed`)
      else toast.success(`Week ${payWeek} payroll run for ${noRecord.length} employee${noRecord.length !== 1 ? 's' : ''}`)
      setRunDialog(false); fetchPayroll(payMonth, payYear, payWeek)
    } catch { toast.error('Failed to run payroll') } finally { setRunningPayroll(false) }
  }

  async function handleDeleteRecord(id: string) {
    try {
      await fetch(`/api/payroll/records/${id}`, { method: 'DELETE' })
      toast.success('Payroll record deleted'); setDeletingRecordId(null)
      fetchPayroll(payMonth, payYear, payWeek)
    } catch { toast.error('Failed to delete') }
  }

  async function handleMarkThirteenth(employeeId: string, field: 'midYearPaid' | 'fullYearPaid', value: boolean) {
    try {
      await fetch('/api/payroll/thirteenth-month', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, year: currentYear, [field]: value }),
      })
      toast.success(value ? 'Marked as paid' : 'Marked as unpaid')
      fetchThirteenth()
    } catch { toast.error('Failed to update') }
  }

  // ─── Derived ─────────────────────────────────────────────────────────────

  const attDates         = weekDateRange(attMonth, attYear, attWeek).dates
  const payLabel         = weekLabel(payMonth, payYear, payWeek)
  const attLabel         = weekLabel(attMonth, attYear, attWeek)
  const activeWithoutRec = activeEmployees.filter(e => !payrollRecords.find(r => r.employeeId === e.id))

  // Holidays in the payroll week (for "Run Payroll" dialog awareness)
  const payDates    = weekDateRange(payMonth, payYear, payWeek).dates
  const payHolidays = yearHolidays.filter(h => payDates.includes(h.date))
  const payRegularH = payHolidays.filter(h => h.type === 'REGULAR').length

  const totalGross  = payrollRecords.reduce((s, r) => s + r.basicSalary + r.holidayPay, 0)
  const totalEC     = payrollRecords.reduce((s, r) => s + r.sssEc, 0)
  const totalEmployerContribs = payrollRecords.reduce((s, r) => s + r.sssEmployer + r.sssEc + r.philhealthEmployer + r.pagibigEmployer, 0)
  const totalNetPayroll = payrollRecords.reduce((s, r) => s + r.netPay, 0)

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 pb-4">
      <h1 className="text-xl font-bold">Employees & Payroll</h1>

      {/* Tabs */}
      <div className="flex rounded-xl border overflow-hidden text-sm font-medium">
        {(['employees', 'attendance', 'payroll'] as const).map(t => (
          <button key={t}
            className={`flex-1 py-2.5 capitalize transition-colors ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* ══ EMPLOYEES TAB ══════════════════════════════════════════════════ */}
      {tab === 'employees' && (
        <div className="space-y-3">
          <button onClick={() => { setEditingEmployee(null); setSheetOpen(true) }}
            className="w-full min-h-[48px] rounded-xl border-2 border-dashed border-primary text-primary text-sm font-medium flex items-center justify-center gap-2">
            + Add Employee
          </button>

          {employees.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No employees yet.</p>}

          {employees.map(emp => (
            <div key={emp.id} className={`rounded-xl border bg-background overflow-hidden ${!emp.isActive ? 'opacity-60' : ''}`}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{emp.fullName}</span>
                      {!emp.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">Terminated</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{emp.position}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div>
                        <span className="text-sm font-bold">₱{fmt(emp.dailyRate)}</span>
                        <span className="text-xs text-muted-foreground">/day</span>
                        <span className="text-xs text-muted-foreground ml-2">(≈ ₱{fmt(dailyToMonthly(emp.dailyRate))}/mo)</span>
                      </div>
                      {emp.isActive && (
                        <button onClick={() => setRaiseEmployee(emp)} className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary font-medium min-h-[32px]">
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

                    {/* SIL badge */}
                    {emp.silEligible && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs">
                        <Umbrella className="w-3 h-3 text-blue-500" />
                        <span className="text-muted-foreground">SIL:</span>
                        <span className={`font-medium ${emp.silUsed >= emp.silEntitlement ? 'text-red-600' : 'text-blue-600'}`}>
                          {emp.silUsed}/{emp.silEntitlement} days used
                        </span>
                        {emp.silUsed < emp.silEntitlement && (
                          <span className="text-muted-foreground">· {emp.silEntitlement - emp.silUsed} remaining (₱{fmt((emp.silEntitlement - emp.silUsed) * emp.dailyRate)} if cashed)</span>
                        )}
                      </div>
                    )}

                    {/* 13th month badge */}
                    {emp.isActive && emp.thirteenthMonthAccrued > 0 && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs">
                        <Gift className="w-3 h-3 text-emerald-500" />
                        <span className="text-muted-foreground">13th Month:</span>
                        <span className={`font-medium ${emp.thirteenthMonthPaid ? 'text-muted-foreground line-through' : 'text-emerald-700'}`}>
                          ₱{fmt(emp.thirteenthMonthAccrued)}
                        </span>
                        {emp.thirteenthMonthPaid && <span className="text-emerald-600 font-medium">paid ✓</span>}
                      </div>
                    )}
                  </div>

                  <button onClick={() => handleToggleActive(emp)}
                    className={`relative inline-flex h-6 w-10 shrink-0 rounded-full transition-colors mt-1 ${emp.isActive ? 'bg-primary' : 'bg-muted'}`}>
                    <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${emp.isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>

              {/* Salary history */}
              {emp.salaryHistory.length > 0 && (
                <>
                  <button onClick={() => setExpandedEmp(expandedEmp === emp.id ? null : emp.id)}
                    className="w-full flex items-center gap-2 px-4 py-2 border-t border-border/40 text-xs text-muted-foreground bg-muted/20">
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
            <button onClick={() => { const p = prevWeek(attMonth, attYear, attWeek); setAttMonth(p.month); setAttYear(p.year); setAttWeek(p.week) }}
              className="p-2 rounded-lg border min-h-[44px] min-w-[44px] flex items-center justify-center text-lg">‹</button>
            <div className="flex-1 text-center">
              <p className="font-medium text-sm">{attLabel}</p>
              <p className="text-xs text-muted-foreground">Tap a day to cycle status</p>
            </div>
            <button onClick={() => { const n = nextWeek(attMonth, attYear, attWeek); setAttMonth(n.month); setAttYear(n.year); setAttWeek(n.week) }}
              className="p-2 rounded-lg border min-h-[44px] min-w-[44px] flex items-center justify-center text-lg">›</button>
          </div>

          {/* Holiday notice for this week */}
          {attHolidays.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 space-y-0.5">
              {attHolidays.map(h => (
                <div key={h.date} className="flex items-center gap-2 text-xs">
                  <span className={`px-1.5 py-0.5 rounded font-semibold ${h.type === 'REGULAR' ? 'bg-amber-200 text-amber-800' : 'bg-orange-100 text-orange-700'}`}>
                    {h.type === 'REGULAR' ? '★ Regular' : '◆ Special'}
                  </span>
                  <span className="text-amber-800">{h.name} — {new Date(h.date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</span>
                </div>
              ))}
              <p className="text-[10px] text-amber-600 pt-0.5">Regular: paid whether absent or present. Special: only paid if present.</p>
            </div>
          )}

          {/* Legend */}
          <div className="flex gap-2 flex-wrap text-xs">
            {Object.entries(STATUS_CONFIG).map(([s, c]) => (
              <span key={s} className={`px-2 py-0.5 rounded-full border ${c.bg} ${c.color} font-medium`}>{c.label}</span>
            ))}
          </div>

          {activeEmployees.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No active employees.</p>}

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
                    const holiday = getHoliday(date)
                    const dayOfWeek = new Date(date + 'T00:00:00').getDay()
                    const status = getStatus(emp.id, date)
                    const cfg = STATUS_CONFIG[status]
                    return (
                      <button key={date} onClick={() => cycleStatus(emp.id, date)}
                        className={`flex-1 min-w-[38px] rounded-lg border-2 py-1.5 flex flex-col items-center gap-0.5 transition-colors ${holiday ? 'ring-1 ring-amber-400' : ''} ${cfg.bg} ${cfg.color}`}>
                        <span className="text-[10px] font-medium opacity-70">{DAY_NAMES[dayOfWeek]}</span>
                        <span className="text-xs font-bold">{date.slice(8)}</span>
                        <span className="text-xs font-semibold">{holiday ? (holiday.type === 'REGULAR' ? '★' : '◆') : cfg.short}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Coverage picker for absent days */}
                {attDates.some(d => getStatus(emp.id, d) === 'ABSENT') && (
                  <div className="mt-2 pt-2 border-t border-border/40">
                    {attDates.filter(d => getStatus(emp.id, d) === 'ABSENT').map(date => (
                      <div key={date} className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(date + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} covered by:
                        </span>
                        <select value={getCoveredBy(emp.id, date) ?? ''}
                          onChange={e => markAttendance(emp.id, date, 'ABSENT', e.target.value || null)}
                          className="flex-1 min-h-[36px] rounded-lg border border-input bg-background px-2 text-xs outline-none">
                          <option value="">— none —</option>
                          {activeEmployees.filter(e => e.id !== emp.id).map(e => (
                            <option key={e.id} value={e.id}>{e.fullName}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {/* Coverage summary */}
          {attendance.some(a => a.coveredById) && (
            <div className="rounded-xl border bg-muted/30 p-3 text-xs space-y-1">
              <p className="font-semibold text-foreground text-sm mb-1">Coverage this week</p>
              {activeEmployees.map(emp => {
                const count = attendance.filter(a => a.coveredById === emp.id).length
                if (!count) return null
                return (
                  <div key={emp.id} className="flex justify-between">
                    <span className="text-muted-foreground">{emp.fullName}</span>
                    <span className="font-medium text-emerald-700">+{count} day{count !== 1 ? 's' : ''} extra</span>
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
            <button onClick={() => { const p = prevWeek(payMonth, payYear, payWeek); setPayMonth(p.month); setPayYear(p.year); setPayWeek(p.week) }}
              className="p-2 rounded-lg border min-h-[44px] min-w-[44px] flex items-center justify-center text-lg">‹</button>
            <div className="flex-1 text-center">
              <p className="font-medium text-sm">{payLabel}</p>
              <p className="text-xs text-muted-foreground">
                Weekly payroll{payRegularH > 0 ? ` · ${payRegularH} regular holiday${payRegularH !== 1 ? 's' : ''}` : ''}
              </p>
            </div>
            <button onClick={() => { const n = nextWeek(payMonth, payYear, payWeek); setPayMonth(n.month); setPayYear(n.year); setPayWeek(n.week) }}
              className="p-2 rounded-lg border min-h-[44px] min-w-[44px] flex items-center justify-center text-lg">›</button>
          </div>

          {/* Holiday notice */}
          {payHolidays.length > 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 space-y-0.5">
              {payHolidays.map(h => (
                <div key={h.date} className="flex items-center gap-2 text-xs">
                  <span className={`px-1.5 py-0.5 rounded font-semibold ${h.type === 'REGULAR' ? 'bg-amber-200 text-amber-800' : 'bg-orange-100 text-orange-700'}`}>
                    {h.type === 'REGULAR' ? '★ Regular' : '◆ Special'}
                  </span>
                  <span className="text-amber-800">{h.name}</span>
                </div>
              ))}
            </div>
          )}

          {activeWithoutRec.length > 0 && (
            <button onClick={openRunDialog} className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground text-sm font-medium">
              Run Payroll — {activeWithoutRec.length} Employee{activeWithoutRec.length !== 1 ? 's' : ''}
            </button>
          )}

          {loadingPayroll ? (
            <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
          ) : (
            <div className="space-y-3">
              {activeWithoutRec.map(emp => (
                <div key={emp.id} className="rounded-xl border bg-background p-4 opacity-40">
                  <div className="flex items-center justify-between">
                    <div><p className="font-medium text-sm">{emp.fullName}</p><p className="text-xs text-muted-foreground">₱{fmt(emp.dailyRate)}/day</p></div>
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">Not run</span>
                  </div>
                </div>
              ))}

              {payrollRecords.map(rec => (
                <div key={rec.id}>
                  <div className="rounded-xl border bg-background p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{rec.employeeName}</p>
                        <p className="text-xs text-muted-foreground">{payLabel} · ₱{fmt(rec.dailyRate)}/day × {rec.daysWorked}d</p>

                        <div className="mt-3 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Gross ({rec.daysWorked}d × ₱{fmt(rec.dailyRate)})</span>
                            <span>₱{fmt(rec.basicSalary)}</span>
                          </div>
                          {rec.holidayPay > 0 && (
                            <div className="flex justify-between text-amber-700">
                              <span>Holiday Pay
                                {rec.regularHolidayDays > 0 && ` (${rec.regularHolidayDays} reg.)`}
                                {rec.specialHolidayDays > 0 && ` (${rec.specialHolidayDays} spec.)`}
                              </span>
                              <span>+₱{fmt(rec.holidayPay)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-red-600"><span>SSS</span><span>-₱{fmt(rec.sssEmployee)}</span></div>
                          <div className="flex justify-between text-red-600"><span>PhilHealth</span><span>-₱{fmt(rec.philhealthEmployee)}</span></div>
                          <div className="flex justify-between text-red-600"><span>Pag-IBIG</span><span>-₱{fmt(rec.pagibigEmployee)}</span></div>
                          <div className="flex justify-between text-red-600"><span>Withholding Tax</span><span>-₱{fmt(rec.withholdingTax)}</span></div>
                          <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
                            <span>Net Pay</span>
                            <span className="text-emerald-700">₱{fmt(rec.netPay)}</span>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground flex flex-wrap gap-x-3">
                          <span>Employer: SSS ₱{fmt(rec.sssEmployer)}</span>
                          <span>EC ₱{fmt(rec.sssEc)}</span>
                          <span>PhilHealth ₱{fmt(rec.philhealthEmployer)}</span>
                          <span>Pag-IBIG ₱{fmt(rec.pagibigEmployer)}</span>
                        </div>
                      </div>
                      <button onClick={() => setDeletingRecordId(rec.id)}
                        className="p-2 text-muted-foreground hover:text-red-600 min-h-[44px] min-w-[44px] flex items-center justify-center">
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

              {activeEmployees.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No active employees.</p>}
            </div>
          )}

          {/* Summary */}
          {payrollRecords.length > 0 && (
            <div className="rounded-xl border bg-muted/30 p-4 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">Gross Payroll</span><span className="font-medium">₱{fmt(totalGross)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Employer Contributions + EC</span><span className="font-medium">₱{fmt(totalEmployerContribs)}</span></div>
              {totalEC > 0 && <div className="flex justify-between text-xs"><span className="text-muted-foreground pl-3">incl. EC premium</span><span>₱{fmt(totalEC)}</span></div>}
              <div className="flex justify-between font-semibold border-t pt-1 mt-1"><span>Net Payroll</span><span>₱{fmt(totalNetPayroll)}</span></div>
            </div>
          )}

          {/* 13th Month Section */}
          <div className="rounded-xl border bg-background overflow-hidden">
            <button onClick={() => { setShowThirteenth(!showThirteenth); if (!showThirteenth && thirteenth.length === 0) fetchThirteenth() }}
              className="w-full flex items-center gap-3 px-4 py-3">
              <Gift className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">13th Month Pay — {currentYear}</p>
                <p className="text-xs text-muted-foreground">PD 851 — due Dec 24</p>
              </div>
              {showThirteenth ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {showThirteenth && (
              <div className="border-t border-border/40 divide-y divide-border/40">
                {loadingThirteenth && <p className="text-sm text-muted-foreground text-center py-4">Loading…</p>}
                {!loadingThirteenth && thirteenth.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No payroll records found for {currentYear} yet.</p>
                )}
                {thirteenth.map(emp => (
                  <div key={emp.employeeId} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{emp.employeeName}</p>
                        <p className="text-xs text-muted-foreground">Total basic pay: ₱{fmt(emp.totalBasicPay)} ÷ 12</p>
                        <p className="text-lg font-bold text-emerald-700 mt-0.5">₱{fmt(emp.amount)}</p>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                          onClick={() => handleMarkThirteenth(emp.employeeId, 'midYearPaid', !emp.midYearPaid)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border min-h-[32px] ${emp.midYearPaid ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'border-border text-muted-foreground'}`}
                        >
                          {emp.midYearPaid ? '✓ Jun paid' : 'Mark Jun paid'}
                        </button>
                        <button
                          onClick={() => handleMarkThirteenth(emp.employeeId, 'fullYearPaid', !emp.fullYearPaid)}
                          className={`text-xs px-2.5 py-1.5 rounded-lg border min-h-[32px] ${emp.fullYearPaid ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-primary text-primary-foreground border-primary'}`}
                        >
                          {emp.fullYearPaid ? '✓ Dec paid' : 'Mark Dec paid'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="px-4 py-2 bg-muted/20">
                  <p className="text-[10px] text-muted-foreground">
                    13th month = total basic pay (regular days × daily rate) ÷ 12. Holiday pay premiums excluded per PD 851.
                    Accrues weekly — figure updates each time payroll is run.
                  </p>
                </div>
              </div>
            )}
          </div>

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
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-muted-foreground/30" /></div>
            <div className="flex items-center justify-between px-4 pb-3">
              <div>
                <h2 className="text-base font-semibold">Run Payroll</h2>
                <p className="text-xs text-muted-foreground">{payLabel}
                  {payRegularH > 0 && ` · ${payRegularH} regular holiday${payRegularH !== 1 ? 's' : ''} auto-detected`}
                </p>
              </div>
              <button onClick={() => setRunDialog(false)} className="p-2 text-muted-foreground min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
            </div>
            <div className="overflow-y-auto px-4 pb-6 space-y-3">
              {payRegularH > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                  ★ {payRegularH} regular holiday{payRegularH !== 1 ? 's' : ''} in this week — holiday pay is automatically included for all employees.
                </div>
              )}
              <p className="text-xs text-muted-foreground">Adjust days worked. +/- for special holiday days worked (130% premium).</p>

              {activeWithoutRec.map(emp => {
                const gross = (runDays[emp.id] ?? 6) * emp.dailyRate + payRegularH * emp.dailyRate + (runSpecial[emp.id] ?? 0) * emp.dailyRate * 0.30
                return (
                  <div key={emp.id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{emp.fullName}</p>
                        <p className="text-xs text-muted-foreground">₱{fmt(emp.dailyRate)}/day</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setRunDays(d => ({ ...d, [emp.id]: Math.max(0, (d[emp.id] ?? 6) - 1) }))}
                          className="w-8 h-8 rounded-full border flex items-center justify-center text-lg text-muted-foreground">−</button>
                        <div className="text-center w-12">
                          <span className="text-lg font-bold">{runDays[emp.id] ?? 6}</span>
                          <p className="text-[10px] text-muted-foreground">days</p>
                        </div>
                        <button onClick={() => setRunDays(d => ({ ...d, [emp.id]: Math.min(7, (d[emp.id] ?? 6) + 1) }))}
                          className="w-8 h-8 rounded-full border flex items-center justify-center text-lg text-muted-foreground">+</button>
                      </div>
                    </div>
                    {/* Special holiday days worked (optional) */}
                    {payHolidays.some(h => h.type === 'SPECIAL_NON_WORKING') && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40">
                        <span className="text-xs text-muted-foreground flex-1">◆ Special holiday days worked:</span>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setRunSpecial(d => ({ ...d, [emp.id]: Math.max(0, (d[emp.id] ?? 0) - 1) }))}
                            className="w-6 h-6 rounded-full border text-xs text-muted-foreground">−</button>
                          <span className="text-sm font-medium w-4 text-center">{runSpecial[emp.id] ?? 0}</span>
                          <button onClick={() => setRunSpecial(d => ({ ...d, [emp.id]: Math.min(payHolidays.filter(h => h.type === 'SPECIAL_NON_WORKING').length, (d[emp.id] ?? 0) + 1) }))}
                            className="w-6 h-6 rounded-full border text-xs text-muted-foreground">+</button>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-right text-muted-foreground mt-1">Gross: ₱{fmt(gross)}</p>
                  </div>
                )
              })}

              <button onClick={handleRunPayroll} disabled={runningPayroll}
                className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                {runningPayroll ? 'Running…' : 'Confirm & Run Payroll'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coverage day dialog */}
      {markingDay && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMarkingDay(null)} />
          <div className="relative w-full rounded-t-2xl bg-background p-4 pb-8 space-y-3">
            <p className="font-semibold text-sm">Who covered this shift?</p>
            <p className="text-xs text-muted-foreground">The covering employee earns an extra day&apos;s pay at their own daily rate.</p>
            {activeEmployees.filter(e => e.id !== markingDay.empId).map(e => (
              <button key={e.id}
                onClick={() => { markAttendance(markingDay.empId, markingDay.date, 'ABSENT', e.id); setMarkingDay(null) }}
                className="w-full min-h-[48px] rounded-xl border text-left px-4 py-2 text-sm font-medium active:bg-muted">
                {e.fullName} <span className="text-muted-foreground font-normal">— {e.position}</span>
              </button>
            ))}
            <button onClick={() => { markAttendance(markingDay.empId, markingDay.date, 'ABSENT', null); setMarkingDay(null) }}
              className="w-full min-h-[44px] rounded-xl border text-left px-4 py-2 text-sm text-muted-foreground">
              No coverage — shift not filled
            </button>
          </div>
        </div>
      )}

      {/* Employee add/edit sheet */}
      <EmployeeSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setEditingEmployee(null) }}
        onSave={handleSaveEmployee}
        initial={editingEmployee ? {
          fullName: editingEmployee.fullName, position: editingEmployee.position,
          dateHired: editingEmployee.dateHired.slice(0, 10), dailyRate: String(editingEmployee.dailyRate),
          sssNumber: editingEmployee.sssNumber, philhealthNumber: editingEmployee.philhealthNumber,
          pagibigNumber: editingEmployee.pagibigNumber, tin: editingEmployee.tin ?? '',
        } : undefined}
      />

      {/* Raise sheet */}
      {raiseEmployee && (
        <RaiseSheet employee={raiseEmployee} open={!!raiseEmployee}
          onClose={() => setRaiseEmployee(null)} onSave={handleRaise} />
      )}
    </div>
  )
}
