import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { withClinicDb } from '@/lib/clinic-db'

async function getClinicId() {
  const user = await getSessionUser()
  return user?.clinicId ?? null
}

// GET /api/payroll/attendance?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const startDate = req.nextUrl.searchParams.get('startDate')
  const endDate   = req.nextUrl.searchParams.get('endDate')

  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate required' }, { status: 400 })
  }

  const records = await withClinicDb(clinicId, (tx) => tx.attendanceRecord.findMany({
    where: {
      clinicId,
      date: { gte: new Date(startDate), lte: new Date(endDate) },
    },
    include: {
      employee:  { select: { fullName: true } },
      coveredBy: { select: { fullName: true } },
    },
    orderBy: [{ date: 'asc' }, { employee: { fullName: 'asc' } }],
  }))

  return NextResponse.json(records.map((r) => ({
    id: r.id,
    employeeId: r.employeeId,
    employeeName: r.employee.fullName,
    date: r.date.toISOString().slice(0, 10),
    status: r.status,
    coveredById: r.coveredById,
    coveredByName: r.coveredBy?.fullName ?? null,
  })))
}

// POST /api/payroll/attendance
// Body: { employeeId, date, status, coveredById? }
export async function POST(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { employeeId, date, status, coveredById } = await req.json()

  const validStatuses = ['PRESENT', 'ABSENT', 'SICK_LEAVE', 'VACATION_LEAVE']
  if (!employeeId || !date || !validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const record = await withClinicDb(clinicId, async (tx) => {
    const employee = await tx.employee.findFirst({ where: { id: employeeId, clinicId } })
    if (!employee) return null
    // Upsert — one record per employee per day
    return tx.attendanceRecord.upsert({
      where: { employeeId_date: { employeeId, date: new Date(date) } },
      update: { status, coveredById: coveredById || null },
      create: {
        clinicId,
        employeeId,
        date: new Date(date),
        status,
        coveredById: coveredById || null,
      },
    })
  })
  if (!record) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

  return NextResponse.json({ id: record.id, status: record.status })
}
