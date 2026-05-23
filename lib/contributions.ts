// ─────────────────────────────────────────────────────────────────────────────
// GOVERNMENT CONTRIBUTION RATES — Philippines 2025–2026
// Last reviewed: May 2026
// Sources: SSS Circular 2024-006, HDMF Circular 460, BIR RR 11-2018 Annex E
// ─────────────────────────────────────────────────────────────────────────────

const SSS = {
  EMPLOYEE_RATE: 0.05,         // 5% of MSC (updated from 4.5% per SSS Circular 2024-006)
  EMPLOYER_RATE: 0.10,         // 10% of MSC (updated from 9.5%)
  MSC_MIN: 5000,               // ₱5,000 minimum Monthly Salary Credit (updated from ₱3,000)
  MSC_MAX: 35000,              // ₱35,000 maximum (updated from ₱30,000)
  MSC_STEP: 500,               // Bracket step
  EC_LOW_THRESHOLD: 14500,     // MSC ≤ this → EC premium = ₱10
  EC_LOW_PREMIUM: 10,          // Employees' Compensation, employer-only
  EC_HIGH_PREMIUM: 30,         // EC for MSC ≥ ₱15,000
}

const PHILHEALTH = {
  RATE: 0.05,                  // 5% of basic salary, split 50/50
  MIN_TOTAL: 500,              // Minimum total contribution per month
  MAX_TOTAL: 5000,             // Maximum total contribution per month
}

const PAGIBIG = {
  RATE_LOW: 0.01,              // 1% for salary ≤ LOW_THRESHOLD
  RATE_HIGH: 0.02,             // 2% for salary > LOW_THRESHOLD
  LOW_THRESHOLD: 1500,
  MAX_CONTRIBUTION: 200,       // ₱200/month each (updated from ₱100 per HDMF Circular 460, Feb 2024)
  EMPLOYER_RATE: 0.02,
}

// BIR TRAIN Law — Annual brackets (RA 10963, effective 2023)
const WITHHOLDING_TAX = {
  BRACKET_1_MAX: 20833,
  BRACKET_2_MAX: 33333,
  BRACKET_3_MAX: 66667,
  BRACKET_4_MAX: 166667,
  BRACKET_5_MAX: 666667,
  RATE_2: 0.15,
  RATE_3: 0.20,
  RATE_4: 0.25,
  RATE_5: 0.30,
  RATE_6: 0.35,
  BASE_TAX_2: 0,
  BASE_TAX_3: 1875,
  BASE_TAX_4: 8542,
  BASE_TAX_5: 33542,
  BASE_TAX_6: 183542,
}

// BIR Annex E — Official WEEKLY withholding tax brackets (RR 11-2018)
// Applied directly to weekly taxable income (gross − mandatory deductions)
// Do NOT use monthly ÷ 4 — the non-linear brackets produce different results
const WEEKLY_WT = {
  B1_MAX:  4808,        // ₱250,000 ÷ 52 weeks
  B2_MAX:  7692,        // ₱400,000 ÷ 52
  B3_MAX:  15385,       // ₱800,000 ÷ 52
  B4_MAX:  38462,       // ₱2,000,000 ÷ 52
  B5_MAX:  153846,      // ₱8,000,000 ÷ 52
  BASE_3:  432.60,      // 15% of (₱7,692 − ₱4,808)
  BASE_4:  1971.20,     // base_3 + 20% of (₱15,385 − ₱7,692)
  BASE_5:  7740.45,     // base_4 + 25% of (₱38,462 − ₱15,385)
  BASE_6:  42355.65,    // base_5 + 30% of (₱153,846 − ₱38,462)
}

// Working days per month constant (PH standard: 6-day workweek)
export const WORKING_DAYS_PER_MONTH = 26  // 52 weeks × 6 days ÷ 12 months

// ─── Daily → Monthly equivalent ───────────────────────────────────────────────
export function dailyToMonthly(dailyRate: number): number {
  return Math.round(dailyRate * WORKING_DAYS_PER_MONTH * 100) / 100
}

// ─── SSS ──────────────────────────────────────────────────────────────────────
export function computeSSS(monthlySalary: number): {
  employee: number
  employer: number
  ec: number    // Employees' Compensation — employer-only
} {
  // Round salary to nearest MSC bracket
  const msc = Math.min(
    SSS.MSC_MAX,
    Math.max(
      SSS.MSC_MIN,
      Math.round((monthlySalary - SSS.MSC_MIN) / SSS.MSC_STEP) * SSS.MSC_STEP + SSS.MSC_MIN
    )
  )

  const employee = Math.round(msc * SSS.EMPLOYEE_RATE * 100) / 100
  const employer = Math.round(msc * SSS.EMPLOYER_RATE * 100) / 100
  const ec = msc <= SSS.EC_LOW_THRESHOLD ? SSS.EC_LOW_PREMIUM : SSS.EC_HIGH_PREMIUM

  return { employee, employer, ec }
}

// ─── PhilHealth ───────────────────────────────────────────────────────────────
export function computePhilHealth(monthlySalary: number): { employee: number; employer: number } {
  const total = Math.min(
    Math.max(monthlySalary * PHILHEALTH.RATE, PHILHEALTH.MIN_TOTAL),
    PHILHEALTH.MAX_TOTAL
  )
  const share = Math.round((total / 2) * 100) / 100
  return { employee: share, employer: share }
}

// ─── Pag-IBIG ─────────────────────────────────────────────────────────────────
export function computePagIbig(monthlySalary: number): { employee: number; employer: number } {
  const employeeRate = monthlySalary <= PAGIBIG.LOW_THRESHOLD ? PAGIBIG.RATE_LOW : PAGIBIG.RATE_HIGH
  const employee = Math.min(
    Math.round(monthlySalary * employeeRate * 100) / 100,
    PAGIBIG.MAX_CONTRIBUTION
  )
  const employer = Math.min(
    Math.round(monthlySalary * PAGIBIG.EMPLOYER_RATE * 100) / 100,
    PAGIBIG.MAX_CONTRIBUTION
  )
  return { employee, employer }
}

// ─── Withholding Tax — Monthly (BIR TRAIN, for reference / annual computation)
export function computeWithholdingTax(monthlySalary: number): number {
  const m = monthlySalary
  if (m <= WITHHOLDING_TAX.BRACKET_1_MAX) return 0
  if (m <= WITHHOLDING_TAX.BRACKET_2_MAX)
    return Math.round((m - WITHHOLDING_TAX.BRACKET_1_MAX) * WITHHOLDING_TAX.RATE_2 * 100) / 100
  if (m <= WITHHOLDING_TAX.BRACKET_3_MAX)
    return Math.round((WITHHOLDING_TAX.BASE_TAX_3 + (m - WITHHOLDING_TAX.BRACKET_2_MAX) * WITHHOLDING_TAX.RATE_3) * 100) / 100
  if (m <= WITHHOLDING_TAX.BRACKET_4_MAX)
    return Math.round((WITHHOLDING_TAX.BASE_TAX_4 + (m - WITHHOLDING_TAX.BRACKET_3_MAX) * WITHHOLDING_TAX.RATE_4) * 100) / 100
  if (m <= WITHHOLDING_TAX.BRACKET_5_MAX)
    return Math.round((WITHHOLDING_TAX.BASE_TAX_5 + (m - WITHHOLDING_TAX.BRACKET_4_MAX) * WITHHOLDING_TAX.RATE_5) * 100) / 100
  return Math.round((WITHHOLDING_TAX.BASE_TAX_6 + (m - WITHHOLDING_TAX.BRACKET_5_MAX) * WITHHOLDING_TAX.RATE_6) * 100) / 100
}

// ─── Withholding Tax — WEEKLY (BIR Annex E, RR 11-2018) ──────────────────────
// Input: weeklyTaxableIncome = weeklyGross − weekly mandatory deductions
// This is the correct table to use for weekly payroll — NOT monthly ÷ 4
export function computeWithholdingTaxWeekly(weeklyTaxableIncome: number): number {
  const w = weeklyTaxableIncome
  if (w <= 0)                  return 0
  if (w <= WEEKLY_WT.B1_MAX)   return 0
  if (w <= WEEKLY_WT.B2_MAX)   return Math.round((w - WEEKLY_WT.B1_MAX) * 0.15 * 100) / 100
  if (w <= WEEKLY_WT.B3_MAX)   return Math.round((WEEKLY_WT.BASE_3 + (w - WEEKLY_WT.B2_MAX) * 0.20) * 100) / 100
  if (w <= WEEKLY_WT.B4_MAX)   return Math.round((WEEKLY_WT.BASE_4 + (w - WEEKLY_WT.B3_MAX) * 0.25) * 100) / 100
  if (w <= WEEKLY_WT.B5_MAX)   return Math.round((WEEKLY_WT.BASE_5 + (w - WEEKLY_WT.B4_MAX) * 0.30) * 100) / 100
  return Math.round((WEEKLY_WT.BASE_6 + (w - WEEKLY_WT.B5_MAX) * 0.35) * 100) / 100
}

// ─── Full monthly payroll summary ─────────────────────────────────────────────
export function computePayroll(monthlySalary: number) {
  const sss = computeSSS(monthlySalary)
  const philhealth = computePhilHealth(monthlySalary)
  const pagibig = computePagIbig(monthlySalary)
  const withholdingTax = computeWithholdingTax(monthlySalary)

  const totalDeductions = sss.employee + philhealth.employee + pagibig.employee + withholdingTax
  const netPay = Math.round((monthlySalary - totalDeductions) * 100) / 100

  return {
    grossPay: monthlySalary,
    deductions: {
      sss: sss.employee,
      philhealth: philhealth.employee,
      pagibig: pagibig.employee,
      withholdingTax,
      total: Math.round(totalDeductions * 100) / 100,
    },
    employerContributions: {
      sss: sss.employer,
      ec: sss.ec,
      philhealth: philhealth.employer,
      pagibig: pagibig.employer,
      total: Math.round((sss.employer + sss.ec + philhealth.employer + pagibig.employer) * 100) / 100,
    },
    netPay,
  }
}
