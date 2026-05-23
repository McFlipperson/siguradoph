import { computePayroll, dailyToMonthly } from './contributions'

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY PAYROLL — daily rate × days worked
//
// Government contributions are based on the monthly equivalent:
//   monthlyEquivalent = dailyRate × 26  (6-day work week, PH standard)
// Deductions are prorated per week: monthly ÷ 4
//
// basicSalary = daysWorked × dailyRate  (actual week gross — may vary)
// ─────────────────────────────────────────────────────────────────────────────

export function computeWeeklyPayroll(
  dailyRate: number,
  daysWorked: number,
): {
  basicSalary: number
  daysWorked: number
  sssEmployee: number
  sssEmployer: number
  philhealthEmployee: number
  philhealthEmployer: number
  pagibigEmployee: number
  pagibigEmployer: number
  withholdingTax: number
  netPay: number
} {
  // Monthly equivalent used for government contribution brackets
  const monthly = computePayroll(dailyToMonthly(dailyRate))

  const basicSalary = Math.round(dailyRate * daysWorked * 100) / 100

  // Contributions prorated weekly (÷ 4)
  const sssEmployee        = Math.round((monthly.deductions.sss / 4) * 100) / 100
  const sssEmployer        = Math.round((monthly.employerContributions.sss / 4) * 100) / 100
  const philhealthEmployee = Math.round((monthly.deductions.philhealth / 4) * 100) / 100
  const philhealthEmployer = Math.round((monthly.employerContributions.philhealth / 4) * 100) / 100
  const pagibigEmployee    = Math.round((monthly.deductions.pagibig / 4) * 100) / 100
  const pagibigEmployer    = Math.round((monthly.employerContributions.pagibig / 4) * 100) / 100
  const withholdingTax     = Math.round((monthly.deductions.withholdingTax / 4) * 100) / 100

  const totalDeductions = sssEmployee + philhealthEmployee + pagibigEmployee + withholdingTax
  const netPay = Math.round((basicSalary - totalDeductions) * 100) / 100

  return {
    basicSalary,
    daysWorked,
    sssEmployee,
    sssEmployer,
    philhealthEmployee,
    philhealthEmployer,
    pagibigEmployee,
    pagibigEmployer,
    withholdingTax,
    netPay,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WEEK DATE RANGE — given week 1–4 of month, return first and last dates
// Week 1: days 1–7, Week 2: 8–14, Week 3: 15–21, Week 4: 22–end
// ─────────────────────────────────────────────────────────────────────────────
export function weekDateRange(
  month: number,
  year: number,
  week: number,
): { start: Date; end: Date } {
  const startDay = (week - 1) * 7 + 1
  const start = new Date(year, month - 1, startDay)
  const endDay = week < 4 ? startDay + 6 : new Date(year, month, 0).getDate()
  const end = new Date(year, month - 1, endDay)
  return { start, end }
}
