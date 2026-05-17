import { prisma } from '@/lib/prisma'
import { IntakeForm } from './IntakeForm'

export default async function IntakePage({
  params,
}: {
  params: { clinicId: string }
}) {
  const clinic = await prisma.clinic.findUnique({
    where: { id: params.clinicId },
    select: { id: true, name: true, enrollmentDate: true },
  })

  if (!clinic) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <p className="text-center text-gray-600 text-lg leading-relaxed">
          This link is not valid. Please ask the front desk for assistance.
        </p>
      </div>
    )
  }

  return <IntakeForm clinic={{ id: clinic.id, name: clinic.name }} />
}
