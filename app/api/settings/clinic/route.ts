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
    // Clinic's own DPO + NPC registration (clinic = PIC)
    dpoName: clinic.dpoName ?? '',
    dpoEmail: clinic.dpoEmail ?? '',
    dpoPhone: clinic.dpoPhone ?? '',
    npcRegistrationNumber: clinic.npcRegistrationNumber ?? '',
    npcRegistrationDate: clinic.npcRegistrationDate?.toISOString() ?? null,
    prcLicenseNo: clinic.prcLicenseNo ?? '',
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
    dpoName, dpoEmail, dpoPhone, npcRegistrationNumber, npcRegistrationDate, prcLicenseNo,
    tin, rdoCode, corNumber, entityType, vatRegistered, vatRegistrationDate, filingMethod,
  } = body

  // Validate enum fields when provided — a bad value would otherwise throw a 500.
  if (entityType !== undefined && !['SOLE_PROPRIETOR', 'PARTNERSHIP', 'CORPORATION'].includes(entityType)) {
    return NextResponse.json({ error: 'Invalid entityType' }, { status: 400 })
  }
  if (filingMethod !== undefined && !['EBIRFORMS', 'EFPS'].includes(filingMethod)) {
    return NextResponse.json({ error: 'Invalid filingMethod' }, { status: 400 })
  }
  if (vatRegistrationDate !== undefined && vatRegistrationDate !== null && isNaN(new Date(vatRegistrationDate).getTime())) {
    return NextResponse.json({ error: 'Invalid vatRegistrationDate' }, { status: 400 })
  }
  if (npcRegistrationDate !== undefined && npcRegistrationDate !== null && npcRegistrationDate !== '' && isNaN(new Date(npcRegistrationDate).getTime())) {
    return NextResponse.json({ error: 'Invalid npcRegistrationDate' }, { status: 400 })
  }

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
      ...(dpoName !== undefined && { dpoName: dpoName || null }),
      ...(dpoEmail !== undefined && { dpoEmail: dpoEmail || null }),
      ...(dpoPhone !== undefined && { dpoPhone: dpoPhone || null }),
      ...(npcRegistrationNumber !== undefined && { npcRegistrationNumber: npcRegistrationNumber || null }),
      ...(npcRegistrationDate !== undefined && { npcRegistrationDate: npcRegistrationDate ? new Date(npcRegistrationDate) : null }),
      ...(prcLicenseNo !== undefined && { prcLicenseNo: prcLicenseNo || null }),
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
