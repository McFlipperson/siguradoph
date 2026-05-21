import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'

async function getClinicId() {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return null
  const user = await prisma.user.findUnique({ where: { email: authUser.email! }, select: { clinicId: true } })
  return user?.clinicId ?? null
}

export async function GET() {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const services = await prisma.serviceCatalog.findMany({
    where: { clinicId },
    orderBy: [{ isActive: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json(
    services.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      isActive: s.isActive,
      sortOrder: s.sortOrder,
    }))
  )
}

export async function POST(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, category } = await req.json()
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  // Get max sortOrder
  const max = await prisma.serviceCatalog.aggregate({
    where: { clinicId },
    _max: { sortOrder: true },
  })

  const service = await prisma.serviceCatalog.create({
    data: {
      clinicId,
      name,
      category: category ?? '',
      isActive: true,
      sortOrder: (max._max.sortOrder ?? 0) + 1,
    },
  })

  return NextResponse.json(
    { id: service.id, name: service.name, category: service.category, isActive: service.isActive, sortOrder: service.sortOrder },
    { status: 201 }
  )
}
