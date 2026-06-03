export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getActorDb } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import CertificateBuilder from './CertificateBuilder'

function computeAge(dob: Date): number {
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  const m = now.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--
  return age
}

export default async function CertificatePage({ params }: { params: { id: string } }) {
  const { clinicId, db } = await getActorDb()

  const patient = await db((tx) => tx.patient.findUnique({
    where: { id: params.id },
    select: {
      id: true, clinicId: true, firstName: true, middleName: true, lastName: true,
      dateOfBirth: true, address: true, addressLine2: true, email: true,
      visits: {
        where: { status: { not: 'VOID' } },
        orderBy: { visitDate: 'desc' },
        take: 1,
        select: { visitDate: true, treatment: true, toothNumber: true, diagnosis: true, notes: true },
      },
    },
  }))
  if (!patient || patient.clinicId !== clinicId) redirect('/patients')

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId },
    select: { name: true, ownerName: true, street: true, city: true, province: true, zip: true, phone: true, prcLicenseNo: true, signatureUrl: true, logoUrl: true },
  })

  const latest = patient.visits[0] ?? null
  const fullName = [patient.firstName, patient.middleName, patient.lastName].filter(Boolean).join(' ')
  const address = [patient.address, patient.addressLine2].filter(Boolean).join(', ')
  const clinicAddress = clinic ? `${clinic.street}, ${clinic.city}, ${clinic.province} ${clinic.zip}` : ''

  return (
    <CertificateBuilder
      patientId={patient.id}
      patientEmail={patient.email ?? ''}
      patientName={fullName}
      age={computeAge(patient.dateOfBirth)}
      address={address}
      clinicName={clinic?.name ?? ''}
      dentistName={clinic?.ownerName ?? ''}
      prcLicenseNo={clinic?.prcLicenseNo ?? ''}
      signatureUrl={clinic?.signatureUrl ?? null}
      logoUrl={clinic?.logoUrl ?? null}
      clinicAddress={clinicAddress}
      clinicPhone={clinic?.phone ?? ''}
      latestVisit={latest ? {
        date: latest.visitDate.toISOString(),
        treatment: latest.treatment,
        toothNumber: latest.toothNumber ?? '',
        diagnosis: latest.diagnosis,
        notes: latest.notes ?? '',
      } : null}
    />
  )
}
