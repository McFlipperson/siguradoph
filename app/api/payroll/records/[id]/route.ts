import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const record = await prisma.payrollRecord.findFirst({
    where: { id: params.id, clinicId: user.clinicId },
    include: { employee: true },
  })
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    id: record.id,
    employeeId: record.employeeId,
    employeeName: record.employee.fullName,
    periodMonth: record.periodMonth,
    periodYear: record.periodYear,
    basicSalary: Number(record.basicSalary),
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

  const record = await prisma.payrollRecord.findFirst({ where: { id: params.id, clinicId: user.clinicId } })
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.payrollRecord.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true, note: 'Payroll record deleted. This action is permanent.' })
}
