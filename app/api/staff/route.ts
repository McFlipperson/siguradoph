import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

// GET /api/staff — list all SECRETARY users for the caller's clinic
export async function GET() {
  const user = await getSessionUser()
  if (!user?.clinicId || user.role !== 'CLINIC_OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const staff = await prisma.user.findMany({
    where: { clinicId: user.clinicId, role: 'SECRETARY' },
    select: { id: true, email: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(staff)
}
