import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { computeDeductions } from '@/lib/payroll'

async function getClinicId() {
  const user = await getSessionUser()
  return user?.clinicId ?? null
}

export async function GET(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const employeeId = req.nextUrl.searchParams.get('employeeId')
  const month = req.nextUrl.searchParams.get('month') ? Number(req.nextUrl.searchParams.get('month')) : undefined
  const year = req.nextUrl.searchParams.get('year') ? Number(req.nextUrl.searchParams.get('year')) : undefined

  const records = await prisma.payrollRecord.findMany({
    where: {
      clinicId,
      ...(employeeId && { employeeId }),
      ...(month !== undefined && { periodMonth: month }),
      ...(year !== undefined && { periodYear: year }),
    },
    include: { employee: { select: { fullName: true, position: true } } },
    orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
  })

  return NextResponse.json(records.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    employeeName: r.employee.fullName,
    employeePosition: r.employee.position,
    periodMonth: r.periodMonth,
    periodYear: r.periodYear,
    basicSalary: Number(r.basicSalary),
    sssEmployee: Number(r.sssEmployee),
    sssEmployer: Number(r.sssEmployer),
    philhealthEmployee: Number(r.philhealthEmployee),
    philhealthEmployer: Number(r.philhealthEmployer),
    pagibigEmployee: Number(r.pagibigEmployee),
    pagibigEmployer: Number(r.pagibigEmployer),
    withholdingTax: Number(r.withholdingTax),
    netPay: Number(r.netPay),
    createdAt: r.createdAt.toISOString(),
  })))
}

export async function POST(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { employeeId, periodMonth, periodYear } = await req.json()

  const employee = await prisma.employee.findFirst({ where: { id: employeeId, clinicId } })
  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  const existing = await prisma.payrollRecord.findFirst({ where: { employeeId, clinicId, periodMonth, periodYear } })
  if (existing) return NextResponse.json({ error: 'Payroll record already exists for this employee and period' }, { status: 409 })

  const deductions = computeDeductions(Number(employee.monthlySalary))

  const record = await prisma.payrollRecord.create({
    data: {
      clinicId,
      employeeId,
      periodMonth,
      periodYear,
      basicSalary: Number(employee.monthlySalary),
      ...deductions,
    },
  })

  return NextResponse.json({
    id: record.id,
    employeeName: employee.fullName,
    basicSalary: Number(record.basicSalary),
    ...deductions,
  }, { status: 201 })
}
