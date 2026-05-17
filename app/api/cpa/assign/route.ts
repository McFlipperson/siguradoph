import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionUser } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { cpaUserId, clinicId } = await req.json()

  const existing = await prisma.cpaClinicAssignment.findFirst({
    where: { cpaUserId, clinicId },
  })
  if (existing) return NextResponse.json({ error: 'Already assigned' }, { status: 409 })

  const assignment = await prisma.cpaClinicAssignment.create({
    data: { cpaUserId, clinicId },
  })

  return NextResponse.json({ id: assignment.id }, { status: 201 })
}
