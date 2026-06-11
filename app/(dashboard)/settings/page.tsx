import { prisma } from '@/lib/prisma'
import { withClinicDb } from '@/lib/clinic-db'
import { createServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: authUser.email! },
    include: { clinic: true },
  })
  if (!user?.clinic) redirect('/onboarding')
  if (user.role === 'SECRETARY') redirect('/')
  const clinic = user.clinic

  const [[services, suppliers], staff] = await Promise.all([
    withClinicDb(clinic.id, (tx) => Promise.all([
      tx.serviceCatalog.findMany({
        where: { clinicId: clinic.id },
        orderBy: [{ isActive: 'desc' }, { sortOrder: 'asc' }],
      }),
      tx.supplier.findMany({
        where: { clinicId: clinic.id },
        orderBy: { name: 'asc' },
      }),
    ])),
    prisma.user.findMany({
      where: { clinicId: clinic.id, role: 'SECRETARY' },
      select: { id: true, email: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  return (
    <SettingsClient
      clinic={{
        id: clinic.id,
        slug: clinic.slug ?? null,
        logoUrl: clinic.logoUrl ?? null,
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
        dpoName: clinic.dpoName ?? '',
        dpoEmail: clinic.dpoEmail ?? '',
        dpoPhone: clinic.dpoPhone ?? '',
        npcRegistrationNumber: clinic.npcRegistrationNumber ?? '',
        npcRegistrationDate: clinic.npcRegistrationDate?.toISOString() ?? null,
        prcLicenseNo: clinic.prcLicenseNo ?? '',
        signatureUrl: clinic.signatureUrl ?? null,
        gcashNumber: clinic.gcashNumber ?? '',
        deletionRequestedAt: clinic.deletionRequestedAt?.toISOString() ?? null,
      }}
      initialServices={services.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        isActive: s.isActive,
        sortOrder: s.sortOrder,
      }))}
      initialSuppliers={suppliers.map(s => ({
        id: s.id,
        name: s.name,
        address: s.address ?? null,
        tin: s.tin ?? null,
        vatRegistered: s.vatRegistered,
        category: s.category,
      }))}
      initialStaff={staff.map(s => ({
        id: s.id,
        email: s.email,
        isActive: s.isActive,
        createdAt: s.createdAt.toISOString(),
      }))}
    />
  )
}
