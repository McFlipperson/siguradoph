import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, getClinicPlan } from '@/lib/auth'
import { planAllows } from '@/lib/entitlements'
import { withClinicDb } from '@/lib/clinic-db'

async function getClinicId() {
  const user = await getSessionUser()
  return user?.clinicId ?? null
}

export async function GET() {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const employees = await withClinicDb(clinicId, (tx) => tx.employee.findMany({
    where: { clinicId },
    orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }],
    include: {
      salaryHistory: { orderBy: { effectiveDate: 'desc' }, take: 10 },
    },
  }))

  return NextResponse.json(employees.map((e) => ({
    id: e.id,
    fullName: e.fullName,
    position: e.position,
    dateHired: e.dateHired.toISOString(),
    dailyRate: Number(e.dailyRate),
    sssNumber: e.sssNumber,
    philhealthNumber: e.philhealthNumber,
    pagibigNumber: e.pagibigNumber,
    tin: e.tin,
    isActive: e.isActive,
    salaryHistory: e.salaryHistory.map((h) => ({
      id: h.id,
      dailyRate: Number(h.dailyRate),
      effectiveDate: h.effectiveDate.toISOString(),
      notes: h.notes,
    })),
  })))
}

export async function POST(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!planAllows(await getClinicPlan(clinicId), 'payroll')) {
    return NextResponse.json({ error: 'Employees & payroll are available on the Pro plan.' }, { status: 403 })
  }

  const { fullName, position, dateHired, dailyRate, sssNumber, philhealthNumber, pagibigNumber, tin } = await req.json()

  if (!fullName || !position || !dateHired || !dailyRate || !sssNumber || !philhealthNumber || !pagibigNumber) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const employee = await withClinicDb(clinicId, (tx) => tx.employee.create({
    data: {
      clinicId,
      fullName,
      position,
      dateHired: new Date(dateHired),
      dailyRate: Number(dailyRate),
      sssNumber,
      philhealthNumber,
      pagibigNumber,
      tin: tin || null,
      salaryHistory: {
        create: {
          dailyRate: Number(dailyRate),
          effectiveDate: new Date(dateHired),
          notes: 'Starting rate',
        },
      },
    },
  }))

  return NextResponse.json({ id: employee.id }, { status: 201 })
}
