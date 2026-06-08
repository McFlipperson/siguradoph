import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

// PATCH /api/staff/[id] — activate or deactivate a secretary (CLINIC_OWNER only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser()
  if (!user?.clinicId || user.role !== 'CLINIC_OWNER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } })
  if (!target || target.clinicId !== user.clinicId || target.role !== 'SECRETARY') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const { isActive } = await request.json() as { isActive: boolean }
  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { isActive },
    select: { id: true, email: true, isActive: true },
  })

  return NextResponse.json(updated)
}
