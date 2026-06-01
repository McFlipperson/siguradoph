import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { withClinicDb } from '@/lib/clinic-db'
import { computeThirteenthMonth } from '@/lib/payroll'

async function getClinicId() {
  const user = await getSessionUser()
  return user?.clinicId ?? null
}

// GET /api/payroll/thirteenth-month?year=2026
// Returns per-employee 13th month accrual + payment status for the year
export async function GET(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const year = Number(req.nextUrl.searchParams.get('year') ?? new Date().getFullYear())

  const [employees, payrollTotals, paymentRecords] = await withClinicDb(clinicId, (tx) => Promise.all([
    tx.employee.findMany({
      where: { clinicId, isActive: true },
      select: { id: true, fullName: true, position: true, dailyRate: true, dateHired: true },
      orderBy: { fullName: 'asc' },
    }),
    // Sum basicSalary (not holidayPay — PD 851 excludes premiums) for each employee for the year
    tx.payrollRecord.groupBy({
      by: ['employeeId'],
      where: { clinicId, periodYear: year },
      _sum: { basicSalary: true },
    }),
    tx.thirteenthMonthRecord.findMany({
      where: { clinicId, year },
    }),
  ]))

  const totalsByEmployee = new Map(
    payrollTotals.map(r => [r.employeeId, Number(r._sum.basicSalary ?? 0)])
  )
  const paymentByEmployee = new Map(
    paymentRecords.map(r => [r.employeeId, r])
  )

  return NextResponse.json(employees.map(emp => {
    const totalBasicPay  = totalsByEmployee.get(emp.id) ?? 0
    const amount         = computeThirteenthMonth(totalBasicPay)
    const payment        = paymentByEmployee.get(emp.id)
    return {
      employeeId:   emp.id,
      employeeName: emp.fullName,
      position:     emp.position,
      dailyRate:    Number(emp.dailyRate),
      dateHired:    emp.dateHired.toISOString(),
      year,
      totalBasicPay,
      amount,
      midYearPaid:  payment?.midYearPaid ?? false,
      fullYearPaid: payment?.fullYearPaid ?? false,
    }
  }))
}

// PATCH /api/payroll/thirteenth-month
// Body: { employeeId, year, midYearPaid?, fullYearPaid? }
export async function PATCH(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { employeeId, year, midYearPaid, fullYearPaid } = await req.json()
  if (!employeeId || !year) return NextResponse.json({ error: 'employeeId and year required' }, { status: 400 })

  const record = await withClinicDb(clinicId, async (tx) => {
    const employee = await tx.employee.findFirst({ where: { id: employeeId, clinicId } })
    if (!employee) return null

    // Recompute the current totals
    const totals = await tx.payrollRecord.aggregate({
      where: { clinicId, employeeId, periodYear: year },
      _sum: { basicSalary: true },
    })
    const totalBasicPay = Number(totals._sum.basicSalary ?? 0)
    const amount        = computeThirteenthMonth(totalBasicPay)

    return tx.thirteenthMonthRecord.upsert({
      where: { employeeId_year: { employeeId, year } },
      update: {
        totalBasicPay,
        amount,
        ...(midYearPaid  !== undefined && { midYearPaid }),
        ...(fullYearPaid !== undefined && { fullYearPaid }),
      },
      create: {
        clinicId,
        employeeId,
        year,
        totalBasicPay,
        amount,
        midYearPaid:  midYearPaid  ?? false,
        fullYearPaid: fullYearPaid ?? false,
      },
    })
  })

  if (!record) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
  return NextResponse.json({ id: record.id, amount: Number(record.amount) })
}
