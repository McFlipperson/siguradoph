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
    facebookPageUrl: clinic.facebookPageUrl ?? '',
    messengerPageId: clinic.messengerPageId ?? '',
    tin: clinic.tin,
    rdoCode: clinic.rdoCode,
    corNumber: clinic.corNumber,
    entityType: clinic.entityType,
    filingMethod: clinic.filingMethod,
    vatRegistered: clinic.vatRegistered,
    vatRegistrationDate: clinic.vatRegistrationDate?.toISOString() ?? null,
    orSeriesStart: clinic.orSeriesStart,
    orSeriesCurrentNumber: clinic.orSeriesCurrentNumber,
    enrollmentDate: clinic.enrollmentDate.toISOString(),
    hasEmployees: clinic.hasEmployees,
    sssEmployerNumber: clinic.sssEmployerNumber ?? '',
    philhealthEmployerNumber: clinic.philhealthEmployerNumber ?? '',
    pagibigEmployerNumber: clinic.pagibigEmployerNumber ?? '',
    accountantEmail: clinic.accountantEmail ?? '',
  })
}

export async function PATCH(req: NextRequest) {
  const clinicId = await getClinicId()
  if (!clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Explicitly allow-list every writable field — OR current number and enrollment date are immutable
  const {
    name, ownerName, street, city, province, zip, phone, email,
    facebookPageUrl, messengerPageId,
    orSeriesStart,
    hasEmployees, sssEmployerNumber, philhealthEmployerNumber, pagibigEmployerNumber,
    accountantEmail,
    tin, rdoCode, corNumber, entityType, vatRegistered, vatRegistrationDate, filingMethod,
  } = body

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
      ...(facebookPageUrl !== undefined && { facebookPageUrl: facebookPageUrl || null }),
      ...(messengerPageId !== undefined && { messengerPageId: messengerPageId || null }),
      ...(orSeriesStart !== undefined && { orSeriesStart }),
      ...(hasEmployees !== undefined && { hasEmployees }),
      ...(sssEmployerNumber !== undefined && { sssEmployerNumber: sssEmployerNumber || null }),
      ...(philhealthEmployerNumber !== undefined && { philhealthEmployerNumber: philhealthEmployerNumber || null }),
      ...(pagibigEmployerNumber !== undefined && { pagibigEmployerNumber: pagibigEmployerNumber || null }),
      ...(accountantEmail !== undefined && { accountantEmail: accountantEmail || null }),
      ...(tin !== undefined && { tin }),
      ...(rdoCode !== undefined && { rdoCode }),
      ...(corNumber !== undefined && { corNumber }),
      ...(entityType !== undefined && { entityType }),
      ...(vatRegistered !== undefined && { vatRegistered }),
      ...(vatRegistrationDate !== undefined && { vatRegistrationDate: vatRegistrationDate ? new Date(vatRegistrationDate) : null }),
      ...(filingMethod !== undefined && { filingMethod }),
    },
  })

  return NextResponse.json({ id: updated.id })
}
