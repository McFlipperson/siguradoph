import {
  computeSSS,
  computePhilHealth,
  computePagIbig,
  computeWithholdingTaxWeekly,
  dailyToMonthly,
} from './contributions'

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY PAYROLL — daily rate × days worked
//
// Government contributions based on monthly equivalent: dailyRate × 26
// Deductions prorated weekly (monthly ÷ 4) — standard Philippine practice
//
// Withholding tax uses BIR Annex E weekly bracket table (RR 11-2018)
// applied to weeklyTaxable = weeklyGross − mandatory deductions
//
// Holiday pay rules (DOLE / Labor Code):
//   Regular holiday, employee absent  → 100% of daily rate (paid anyway)
//   Regular holiday, employee present → 200% of daily rate
//   Special non-working, absent       → 0% (no pay)
//   Special non-working, present      → 130% of daily rate
//
// In all cases the "extra" premium is captured in holidayPay:
//   - Each regular holiday in the week adds 1× dailyRate to holidayPay
//     (whether absent or present, the base is always +1× on top of basicSalary)
//   - Each special holiday WORKED adds 0.30× dailyRate to holidayPay
//
// 13th Month Pay (PD 851):
//   totalBasicPay (year) ÷ 12 = amount due by Dec 24
// ─────────────────────────────────────────────────────────────────────────────

export type WeeklyPayrollResult = {
  basicSalary: number        // daysWorked × dailyRate
  daysWorked: number
  regularHolidayDays: number
  specialHolidayDays: number // special holidays employee actually worked
  holidayPay: number         // total extra premium
  sssEmployee: number
  sssEmployer: number
  sssEc: number              // Employees' Compensation (employer-only)
  philhealthEmployee: number
  philhealthEmployer: number
  pagibigEmployee: number
  pagibigEmployer: number
  withholdingTax: number
  netPay: number
}

export function computeWeeklyPayroll(
  dailyRate: number,
  daysWorked: number,
  regularHolidayDays = 0,
  specialHolidayDays = 0,
): WeeklyPayrollResult {
  // Monthly equivalent → contribution brackets
  const monthly = dailyToMonthly(dailyRate)
  const sss       = computeSSS(monthly)
  const philhealth = computePhilHealth(monthly)
  const pagibig    = computePagIbig(monthly)

  // Weekly proration of mandatory contributions (monthly ÷ 4)
  const sssEmployee        = Math.round((sss.employee / 4) * 100) / 100
  const sssEmployer        = Math.round((sss.employer / 4) * 100) / 100
  const sssEc              = Math.round((sss.ec / 4) * 100) / 100
  const philhealthEmployee = Math.round((philhealth.employee / 4) * 100) / 100
  const philhealthEmployer = Math.round((philhealth.employer / 4) * 100) / 100
  const pagibigEmployee    = Math.round((pagibig.employee / 4) * 100) / 100
  const pagibigEmployer    = Math.round((pagibig.employer / 4) * 100) / 100

  // Basic salary = regular days worked × daily rate
  const basicSalary = Math.round(dailyRate * daysWorked * 100) / 100

  // Holiday pay premiums
  // Regular: every regular holiday adds 1× dailyRate (100% premium) whether present or absent
  // Special: only if employee worked that day, adds 0.30× dailyRate (30% premium)
  const holidayPay = Math.round(
    (regularHolidayDays * dailyRate + specialHolidayDays * dailyRate * 0.30) * 100
  ) / 100

  const weeklyGross = basicSalary + holidayPay

  // Taxable income for BIR Annex E weekly WT table
  const weeklyMandatory = sssEmployee + philhealthEmployee + pagibigEmployee
  const weeklyTaxable   = Math.max(0, weeklyGross - weeklyMandatory)
  const withholdingTax  = computeWithholdingTaxWeekly(weeklyTaxable)

  const totalDeductions = weeklyMandatory + withholdingTax
  const netPay = Math.round((weeklyGross - totalDeductions) * 100) / 100

  return {
    basicSalary,
    daysWorked,
    regularHolidayDays,
    specialHolidayDays,
    holidayPay,
    sssEmployee,
    sssEmployer,
    sssEc,
    philhealthEmployee,
    philhealthEmployer,
    pagibigEmployee,
    pagibigEmployer,
    withholdingTax,
    netPay,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEK DATE RANGE
// Week 1: days 1–7, Week 2: 8–14, Week 3: 15–21, Week 4: 22–end
// ─────────────────────────────────────────────────────────────────────────────
export function weekDateRange(
  month: number,
  year: number,
  week: number,
): { start: Date; end: Date; dates: string[] } {
  const startDay = (week - 1) * 7 + 1
  const daysInMonth = new Date(year, month, 0).getDate()
  const endDay = week < 4 ? Math.min(startDay + 6, daysInMonth) : daysInMonth

  const dates: string[] = []
  for (let d = startDay; d <= endDay; d++) {
    const m  = String(month).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    dates.push(`${year}-${m}-${dd}`)
  }

  const start = new Date(year, month - 1, startDay)
  const end   = new Date(year, month - 1, endDay)
  return { start, end, dates }
}

// ─────────────────────────────────────────────────────────────────────────────
// 13TH MONTH PAY (PD 851)
// Formula for daily-rate workers: total basicSalary earned in year ÷ 12
// "Basic salary" excludes overtime, allowances, holiday pay premiums
// The basicSalary field in PayrollRecord is already the correct base
// ─────────────────────────────────────────────────────────────────────────────
export function computeThirteenthMonth(totalBasicPayForYear: number): number {
  return Math.round((totalBasicPayForYear / 12) * 100) / 100
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE INCENTIVE LEAVE (SIL) — Article 95, Labor Code
// 5 days/year after 1 year of service (rank and file)
// Unused SIL = cash equivalent at daily rate at year-end
// ─────────────────────────────────────────────────────────────────────────────
export const SIL_DAYS_PER_YEAR = 5

export function isSilEligible(dateHired: Date): boolean {
  const now = new Date()
  const oneYearAfterHire = new Date(dateHired)
  oneYearAfterHire.setFullYear(oneYearAfterHire.getFullYear() + 1)
  return now >= oneYearAfterHire
}

export function computeSilCashValue(unusedDays: number, dailyRate: number): number {
  return Math.round(unusedDays * dailyRate * 100) / 100
}
