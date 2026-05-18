import { computePayroll } from './contributions'

// ─────────────────────────────────────────────────────────────────────────────
// WEEKLY PAYROLL — government deductions computed monthly, split across 4 weeks
// Basic salary stored per-record = monthlySalary ÷ 4 (weekly gross)
// ─────────────────────────────────────────────────────────────────────────────

export function computeWeeklyDeductions(monthlySalary: number): {
  basicSalary: number
  sssEmployee: number
  sssEmployer: number
  philhealthEmployee: number
  philhealthEmployer: number
  pagibigEmployee: number
  pagibigEmployer: number
  withholdingTax: number
  netPay: number
} {
  const monthly = computePayroll(monthlySalary)
  const weeklyGross = Math.round((monthlySalary / 4) * 100) / 100

  const sssEmployee        = Math.round((monthly.deductions.sss / 4) * 100) / 100
  const sssEmployer        = Math.round((monthly.employerContributions.sss / 4) * 100) / 100
  const philhealthEmployee = Math.round((monthly.deductions.philhealth / 4) * 100) / 100
  const philhealthEmployer = Math.round((monthly.employerContributions.philhealth / 4) * 100) / 100
  const pagibigEmployee    = Math.round((monthly.deductions.pagibig / 4) * 100) / 100
  const pagibigEmployer    = Math.round((monthly.employerContributions.pagibig / 4) * 100) / 100
  const withholdingTax     = Math.round((monthly.deductions.withholdingTax / 4) * 100) / 100

  const totalWeeklyDeductions = sssEmployee + philhealthEmployee + pagibigEmployee + withholdingTax
  const netPay = Math.round((weeklyGross - totalWeeklyDeductions) * 100) / 100

  return {
    basicSalary: weeklyGross,
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
