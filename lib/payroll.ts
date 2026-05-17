export function computeDeductions(monthlySalary: number): {
  sssEmployee: number
  sssEmployer: number
  philhealthEmployee: number
  philhealthEmployer: number
  pagibigEmployee: number
  pagibigEmployer: number
  withholdingTax: number
  netPay: number
} {
  const salary = monthlySalary

  // SSS (monthly)
  const sssEmployee = Math.min(salary * 0.045, 900)
  const sssEmployer = Math.min(salary * 0.095, 1900)

  // PhilHealth (5% total, 50/50 split, floor ₱10k, ceiling ₱100k)
  const phSalary = Math.max(10000, Math.min(salary, 100000))
  const philhealthEmployee = Math.round(phSalary * 0.025 * 100) / 100
  const philhealthEmployer = philhealthEmployee

  // Pag-IBIG (2% each, capped at ₱200)
  const pagibigEmployee = Math.min(salary * 0.02, 200)
  const pagibigEmployer = Math.min(salary * 0.02, 200)

  // Withholding tax (monthly TRAIN Law brackets)
  const taxable = salary - sssEmployee - philhealthEmployee - pagibigEmployee
  let wt = 0
  if (taxable <= 20833) {
    wt = 0
  } else if (taxable <= 33332) {
    wt = (taxable - 20833) * 0.20
  } else if (taxable <= 66666) {
    wt = 2500 + (taxable - 33333) * 0.25
  } else if (taxable <= 166666) {
    wt = 10833 + (taxable - 66667) * 0.30
  } else if (taxable <= 666666) {
    wt = 40833 + (taxable - 166667) * 0.32
  } else {
    wt = 200833 + (taxable - 666667) * 0.35
  }
  wt = Math.max(0, Math.round(wt * 100) / 100)

  const netPay = Math.round((salary - sssEmployee - philhealthEmployee - pagibigEmployee - wt) * 100) / 100

  return { sssEmployee, sssEmployer, philhealthEmployee, philhealthEmployer, pagibigEmployee, pagibigEmployer, withholdingTax: wt, netPay }
}
