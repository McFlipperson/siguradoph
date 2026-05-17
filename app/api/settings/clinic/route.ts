import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'

async function getClinicId() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const user = await prisma.user.findUnique({ where: { email: session.user.email! }, select: { clinicId: true } })
  return user?.clinicId ?? null
}

export async function GET(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } })
  if (!clinic) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    id: clinic.id,
    name: clinic.name,
    ownerName: clinic.ownerName,
    street: clinic.street,
    city: clinic.city,
    province: clinic.province,
    zip: clinic.zip,
    phone: clinic.phone,
    email: clinic.email,
    tin: clinic.tin,
    vatRegistered: clinic.vatRegistered,
    orSeriesStart: clinic.orSeriesStart,
    orSeriesCurrentNumber: clinic.orSeriesCurrentNumber,
    enrollmentDate: clinic.enrollmentDate.toISOString(),
  })
}

export async function PATCH(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  // Only allow safe fields — never accept orSeriesCurrentNumber or tin
  const { name, ownerName, street, city, province, zip, phone, email, orSeriesStart } = body

  const updated = await prisma.clinic.update({
    where: { id: clinicId },
    data: {
      ...(name !== undefined && { name }),
      ...(ownerName !== undefined && { ownerName }),
      ...(street !== undefined && { street }),
      ...(city !== undefined && { city }),
      ...(province !== undefined && { province }),
      ...(zip !== undefined && { zip }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(orSeriesStart !== undefined && { orSeriesStart }),
    },
  })

  return NextResponse.json({ id: updated.id })
}
