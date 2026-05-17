// SSS: 2024 contribution table. Employee 4.5%, Employer 9.5% of MSC.
// MSC = salary bracket, min ₱4,000, max ₱30,000, steps of ₱500
export function computeSSS(monthlySalary: number): { employee: number; employer: number } {
  const salary = monthlySalary
  let msc: number
  if (salary < 3250) msc = 3000
  else if (salary >= 29750) msc = 30000
  else msc = Math.round((salary - 3250) / 500) * 500 + 3500
  // clamp to ₱30,000
  msc = Math.min(msc, 30000)
  const employee = Math.round(msc * 0.045 * 100) / 100
  const employer = Math.round(msc * 0.095 * 100) / 100
  return { employee, employer }
}

// PhilHealth: 5% of basic salary, 50/50 split
// Min ₱500 total (₱250 each), Max ₱5,000 total (₱2,500 each)
export function computePhilHealth(monthlySalary: number): { employee: number; employer: number } {
  const total = Math.min(Math.max(monthlySalary * 0.05, 500), 5000)
  const share = Math.round((total / 2) * 100) / 100
  return { employee: share, employer: share }
}

// Pag-IBIG: 2% each, minimum ₱100 each
// Combined cap: ₱5,000 (₱2,500 each)
export function computePagIbig(monthlySalary: number): { employee: number; employer: number } {
  const raw = Math.max(monthlySalary * 0.02, 100)
  const share = Math.min(Math.round(raw * 100) / 100, 2500)
  return { employee: share, employer: share }
}

// BIR withholding tax on monthly compensation (TRAIN Law)
export function computeWithholdingTax(monthlySalary: number): number {
  const m = monthlySalary
  if (m <= 20833) return 0
  if (m <= 33333) return Math.round((m - 20833) * 0.15 * 100) / 100
  if (m <= 66667) return Math.round((1875 + (m - 33333) * 0.20) * 100) / 100
  if (m <= 166667) return Math.round((8542 + (m - 66667) * 0.25) * 100) / 100
  if (m <= 666667) return Math.round((33542 + (m - 166667) * 0.30) * 100) / 100
  return Math.round((183542 + (m - 666667) * 0.35) * 100) / 100
}
