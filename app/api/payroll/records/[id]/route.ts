import { NextRequest, NextResponse } from 'next/server'
import { withClinicDb } from '@/lib/clinic-db'
import { getSessionUser } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clinicId = user.clinicId as string

  const record = await withClinicDb(clinicId, (tx) => tx.payrollRecord.findFirst({
    where: { id: params.id, clinicId },
    include: { employee: true },
  }))
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    id: record.id,
    employeeId: record.employeeId,
    employeeName: record.employee.fullName,
    dailyRate: Number(record.employee.dailyRate),
    periodMonth: record.periodMonth,
    periodYear: record.periodYear,
    periodWeek: record.periodWeek,
    daysWorked: record.daysWorked,
    basicSalary: Number(record.basicSalary),
    regularHolidayDays: record.regularHolidayDays,
    specialHolidayDays: record.specialHolidayDays,
    holidayPay: Number(record.holidayPay),
    sssEc: Number(record.sssEc),
    sssEmployee: Number(record.sssEmployee),
    sssEmployer: Number(record.sssEmployer),
    philhealthEmployee: Number(record.philhealthEmployee),
    philhealthEmployer: Number(record.philhealthEmployer),
    pagibigEmployee: Number(record.pagibigEmployee),
    pagibigEmployer: Number(record.pagibigEmployer),
    withholdingTax: Number(record.withholdingTax),
    netPay: Number(record.netPay),
  })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clinicId2 = user.clinicId as string

  await withClinicDb(clinicId2, async (tx) => {
    const record = await tx.payrollRecord.findFirst({ where: { id: params.id, clinicId: clinicId2 } })
    if (!record) return
    await tx.payrollRecord.delete({ where: { id: params.id } })
  })
  return NextResponse.json({ ok: true, note: 'Payroll record deleted. This action is permanent.' })
}
