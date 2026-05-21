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

  const suppliers = await prisma.supplier.findMany({
    where: { clinicId },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(
    suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      tin: s.tin,
      vatRegistered: s.vatRegistered,
      category: s.category,
    }))
  )
}

export async function POST(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, address, tin, vatRegistered, category } = await req.json()
  if (!name || !category) return NextResponse.json({ error: 'Name and category required' }, { status: 400 })

  const supplier = await prisma.supplier.create({
    data: {
      clinicId,
      name,
      address: address || null,
      tin: tin || null,
      vatRegistered: vatRegistered ?? false,
      category,
    },
  })

  return NextResponse.json({ id: supplier.id }, { status: 201 })
}
