import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

async function getClinicId() {
  const user = await getSessionUser()
  return user?.clinicId ?? null
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const employee = await prisma.employee.findFirst({ where: { id: params.id, clinicId } })
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { fullName, position, dateHired, monthlySalary, sssNumber, philhealthNumber, pagibigNumber, tin, isActive } = body

  const updated = await prisma.employee.update({
    where: { id: params.id },
    data: {
      ...(fullName !== undefined && { fullName }),
      ...(position !== undefined && { position }),
      ...(dateHired !== undefined && { dateHired: new Date(dateHired) }),
      ...(monthlySalary !== undefined && { monthlySalary: Number(monthlySalary) }),
      ...(sssNumber !== undefined && { sssNumber }),
      ...(philhealthNumber !== undefined && { philhealthNumber }),
      ...(pagibigNumber !== undefined && { pagibigNumber }),
      ...(tin !== undefined && { tin: tin || null }),
      ...(isActive !== undefined && { isActive }),
    },
  })

  return NextResponse.json({ id: updated.id })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const employee = await prisma.employee.findFirst({ where: { id: params.id, clinicId } })
  if (!employee) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const recordCount = await prisma.payrollRecord.count({ where: { employeeId: params.id } })
  if (recordCount > 0) {
    return NextResponse.json({ error: `Cannot delete — ${recordCount} payroll record(s) reference this employee. Deactivate instead.` }, { status: 409 })
  }

  await prisma.employee.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
