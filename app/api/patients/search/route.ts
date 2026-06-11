import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withClinicDb } from '@/lib/clinic-db'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json([], { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: authUser.email! }, select: { clinicId: true } })
  if (!user?.clinicId) return NextResponse.json([])

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  const clinicId = user.clinicId as string
  const patients = await withClinicDb(clinicId, (tx) =>
    tx.patient.findMany({
      where: {
        clinicId,
        archived: false,
        OR: [
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        enrolledAt: true,
        visits: {
          orderBy: { visitDate: 'desc' },
          take: 1,
          select: { visitDate: true },
        },
        loyaltyCards: {
          where: { isActive: true },
          take: 1,
          select: { id: true },
        },
      },
      take: 10,
      orderBy: { lastName: 'asc' },
    })
  )

  return NextResponse.json(patients.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    middleName: p.middleName ?? null,
    lastName: p.lastName,
    phone: p.phone,
    dateOfBirth: p.dateOfBirth,
    enrolledAt: p.enrolledAt,
    lastVisitDate: p.visits[0]?.visitDate ?? null,
    hasActiveLoyaltyCard: p.loyaltyCards.length > 0,
  })))
}
