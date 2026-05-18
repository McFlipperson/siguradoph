import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function GET() {
  const user = await getSessionUser()
  if (!user || user.role !== 'CPA') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const assignments = await prisma.cpaClinicAssignment.findMany({
    where: { cpaUserId: user.id },
    include: { clinic: true },
    orderBy: { assignedAt: 'desc' },
  })

  return NextResponse.json(
    assignments.map(({ clinic, assignedAt }) => ({
      clinicId: clinic.id,
      name: clinic.name,
      tin: clinic.tin,
      enrollmentDate: clinic.enrollmentDate.toISOString(),
      assignedAt: assignedAt.toISOString(),
    }))
  )
}
