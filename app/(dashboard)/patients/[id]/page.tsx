import { getPatient } from '../actions'
import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PatientProfile from './PatientProfile'
import { redirect } from 'next/navigation'

export default async function PatientProfilePage({
  params,
}: {
  params: { id: string }
}) {
  const user = await getSessionUser()
  if (!user?.clinicId) redirect('/login')

  const [patient, clinic] = await Promise.all([
    getPatient(params.id),
    prisma.clinic.findUnique({
      where: { id: user.clinicId },
      select: { facebookPageUrl: true },
    }),
  ])

  return <PatientProfile patient={patient} facebookPageUrl={clinic?.facebookPageUrl ?? null} />
}
