// ─────────────────────────────────────────────────────────────────────────────
// GOVERNMENT CONTRIBUTION RATES — update these when rates change
// Last reviewed: 2024
// ─────────────────────────────────────────────────────────────────────────────

const SSS = {
  EMPLOYEE_RATE: 0.045,      // 4.5% of MSC
  EMPLOYER_RATE: 0.095,      // 9.5% of MSC
  MSC_MIN: 3000,             // Minimum Monthly Salary Credit
  MSC_MAX: 30000,            // Maximum Monthly Salary Credit
  MSC_STEP: 500,             // Bracket step
  MSC_BRACKET_START: 3250,   // Salary at which brackets begin stepping up
}

const PHILHEALTH = {
  RATE: 0.05,                // 5% of basic salary (split 50/50)
  MIN_TOTAL: 500,            // Minimum total contribution per month
  MAX_TOTAL: 5000,           // Maximum total contribution per month
}

const PAGIBIG = {
  RATE_LOW: 0.01,            // 1% for salary ≤ LOW_THRESHOLD
  RATE_HIGH: 0.02,           // 2% for salary > LOW_THRESHOLD
  LOW_THRESHOLD: 1500,       // Salary threshold for lower rate
  MAX_CONTRIBUTION: 100,     // Maximum monthly contribution (employee & employer each)
  EMPLOYER_RATE: 0.02,       // Employer always pays 2%
}

// BIR TRAIN Law — monthly compensation tax brackets
// Annual brackets divided by 12 for monthly computation
const WITHHOLDING_TAX = {
  BRACKET_1_MAX: 20833,      // ₱250,000/yr ÷ 12 — tax exempt below this
  BRACKET_2_MAX: 33333,      // ₱400,000/yr ÷ 12
  BRACKET_3_MAX: 66667,      // ₱800,000/yr ÷ 12
  BRACKET_4_MAX: 166667,     // ₱2,000,000/yr ÷ 12
  BRACKET_5_MAX: 666667,     // ₱8,000,000/yr ÷ 12
  RATE_2: 0.15,              // 15% on excess over bracket 1
  RATE_3: 0.20,              // 20% on excess over bracket 2
  RATE_4: 0.25,              // 25% on excess over bracket 3
  RATE_5: 0.30,              // 30% on excess over bracket 4
  RATE_6: 0.35,              // 35% on excess over bracket 5
  BASE_TAX_2: 0,
  BASE_TAX_3: 1875,          // Fixed tax at start of bracket 3
  BASE_TAX_4: 8542,          // Fixed tax at start of bracket 4
  BASE_TAX_5: 33542,         // Fixed tax at start of bracket 5
  BASE_TAX_6: 183542,        // Fixed tax at start of bracket 6
}

// Working days per month constant (Philippine standard: 6-day workweek)
export const WORKING_DAYS_PER_MONTH = 26  // 52 weeks × 6 days ÷ 12 months

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — convert daily rate to monthly equivalent
// ─────────────────────────────────────────────────────────────────────────────
export function dailyToMonthly(dailyRate: number): number {
  return Math.round(dailyRate * WORKING_DAYS_PER_MONTH * 100) / 100
}

// ─────────────────────────────────────────────────────────────────────────────
// SSS — 2024 contribution table
// ─────────────────────────────────────────────────────────────────────────────
export function computeSSS(monthlySalary: number): { employee: number; employer: number } {
  let msc: number
  if (monthlySalary < SSS.MSC_BRACKET_START) {
    msc = SSS.MSC_MIN
  } else if (monthlySalary >= SSS.MSC_MAX - SSS.MSC_STEP / 2) {
    msc = SSS.MSC_MAX
  } else {
    msc = Math.round((monthlySalary - SSS.MSC_BRACKET_START) / SSS.MSC_STEP) * SSS.MSC_STEP + (SSS.MSC_MIN + SSS.MSC_STEP)
    msc = Math.min(msc, SSS.MSC_MAX)
  }

  return {
    employee: Math.round(msc * SSS.EMPLOYEE_RATE * 100) / 100,
    employer: Math.round(msc * SSS.EMPLOYER_RATE * 100) / 100,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PhilHealth — 5% of basic salary, 50/50 split
// ─────────────────────────────────────────────────────────────────────────────
export function computePhilHealth(monthlySalary: number): { employee: number; employer: number } {
  const total = Math.min(
    Math.max(monthlySalary * PHILHEALTH.RATE, PHILHEALTH.MIN_TOTAL),
    PHILHEALTH.MAX_TOTAL
  )
  const share = Math.round((total / 2) * 100) / 100
  return { employee: share, employer: share }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pag-IBIG — 2% each, capped at ₱100/month each
// ─────────────────────────────────────────────────────────────────────────────
export function computePagIbig(monthlySalary: number): { employee: number; employer: number } {
  const employeeRate = monthlySalary <= PAGIBIG.LOW_THRESHOLD
    ? PAGIBIG.RATE_LOW
    : PAGIBIG.RATE_HIGH

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

// ─────────────────────────────────────────────────────────────────────────────
// BIR Withholding Tax — TRAIN Law monthly brackets
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// FULL PAYROLL SUMMARY — pass monthly salary, get everything back
// ─────────────────────────────────────────────────────────────────────────────
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
      philhealth: philhealth.employer,
      pagibig: pagibig.employer,
      total: Math.round((sss.employer + philhealth.employer + pagibig.employer) * 100) / 100,
    },
    netPay,
  }
}
