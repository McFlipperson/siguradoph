import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return NextResponse.json([], { status: 401 })

  const user = await prisma.user.findUnique({ where: { email: authUser.email! }, select: { clinicId: true } })
  if (!user?.clinicId) return NextResponse.json([])

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  const patients = await prisma.patient.findMany({
    where: {
      clinicId: user.clinicId,
      OR: [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ],
    },
    select: { id: true, firstName: true, lastName: true, phone: true },
    take: 10,
    orderBy: { lastName: 'asc' },
  })

  return NextResponse.json(patients)
}
