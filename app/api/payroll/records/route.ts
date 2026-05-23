import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'
import { computeWeeklyPayroll } from '@/lib/payroll'

async function getClinicId() {
  const user = await getSessionUser()
  return user?.clinicId ?? null
}

export async function GET(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const employeeId = req.nextUrl.searchParams.get('employeeId')
  const month = req.nextUrl.searchParams.get('month') ? Number(req.nextUrl.searchParams.get('month')) : undefined
  const year  = req.nextUrl.searchParams.get('year')  ? Number(req.nextUrl.searchParams.get('year'))  : undefined
  const week  = req.nextUrl.searchParams.get('week')  ? Number(req.nextUrl.searchParams.get('week'))  : undefined

  const records = await prisma.payrollRecord.findMany({
    where: {
      clinicId,
      ...(employeeId && { employeeId }),
      ...(month !== undefined && { periodMonth: month }),
      ...(year  !== undefined && { periodYear:  year  }),
      ...(week  !== undefined && { periodWeek:  week  }),
    },
    include: { employee: { select: { fullName: true, position: true, dailyRate: true } } },
    orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }, { periodWeek: 'asc' }],
  })

  return NextResponse.json(records.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    employeeName: r.employee.fullName,
    employeePosition: r.employee.position,
    dailyRate: Number(r.employee.dailyRate),
    periodMonth: r.periodMonth,
    periodYear: r.periodYear,
    periodWeek: r.periodWeek,
    daysWorked: r.daysWorked,
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

  const { employeeId, periodMonth, periodYear, periodWeek, daysWorked } = await req.json()

  if (!periodWeek || periodWeek < 1 || periodWeek > 4) {
    return NextResponse.json({ error: 'periodWeek must be 1–4' }, { status: 400 })
  }

  const days = Number(daysWorked ?? 6)
  if (days < 0 || days > 7) {
    return NextResponse.json({ error: 'daysWorked must be 0–7' }, { status: 400 })
  }

  const employee = await prisma.employee.findFirst({ where: { id: employeeId, clinicId } })
  if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  const existing = await prisma.payrollRecord.findFirst({
    where: { employeeId, clinicId, periodMonth, periodYear, periodWeek },
  })
  if (existing) {
    return NextResponse.json(
      { error: `Payroll already exists for Week ${periodWeek} of this period` },
      { status: 409 }
    )
  }

  const weekly = computeWeeklyPayroll(Number(employee.dailyRate), days)

  const record = await prisma.payrollRecord.create({
    data: {
      clinicId,
      employeeId,
      periodMonth,
      periodYear,
      periodWeek,
      daysWorked: weekly.daysWorked,
      basicSalary: weekly.basicSalary,
      sssEmployee: weekly.sssEmployee,
      sssEmployer: weekly.sssEmployer,
      philhealthEmployee: weekly.philhealthEmployee,
      philhealthEmployer: weekly.philhealthEmployer,
      pagibigEmployee: weekly.pagibigEmployee,
      pagibigEmployer: weekly.pagibigEmployer,
      withholdingTax: weekly.withholdingTax,
      netPay: weekly.netPay,
    },
  })

  return NextResponse.json({
    id: record.id,
    employeeName: employee.fullName,
    periodWeek,
    ...weekly,
  }, { status: 201 })
}
