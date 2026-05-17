import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

async function getClinicId() {
  const user = await getSessionUser()
  return user?.clinicId ?? null
}

export async function GET(_req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const employees = await prisma.employee.findMany({
    where: { clinicId },
    orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }],
  })

  return NextResponse.json(employees.map((e) => ({
    id: e.id,
    fullName: e.fullName,
    position: e.position,
    dateHired: e.dateHired.toISOString(),
    monthlySalary: Number(e.monthlySalary),
    sssNumber: e.sssNumber,
    philhealthNumber: e.philhealthNumber,
    pagibigNumber: e.pagibigNumber,
    tin: e.tin,
    isActive: e.isActive,
  })))
}

export async function POST(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fullName, position, dateHired, monthlySalary, sssNumber, philhealthNumber, pagibigNumber, tin } = await req.json()

  if (!fullName || !position || !dateHired || !monthlySalary || !sssNumber || !philhealthNumber || !pagibigNumber) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const employee = await prisma.employee.create({
    data: {
      clinicId,
      fullName,
      position,
      dateHired: new Date(dateHired),
      monthlySalary: Number(monthlySalary),
      sssNumber,
      philhealthNumber,
      pagibigNumber,
      tin: tin || null,
    },
  })

  return NextResponse.json({ id: employee.id }, { status: 201 })
}
