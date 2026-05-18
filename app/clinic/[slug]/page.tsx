import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'sigurado.xyz'

export default async function ClinicSlugPage({
  params,
}: {
  params: { slug: string }
}) {
  const clinic = await prisma.clinic.findUnique({
    where: { slug: params.slug },
    select: { id: true, name: true, ownerName: true, city: true, province: true },
  })

  if (!clinic) notFound()

  const intakeUrl = `https://${params.slug}.${ROOT_DOMAIN}/intake`
  const loginUrl = `https://${ROOT_DOMAIN}/login`

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{clinic.name}</h1>
          <p className="text-sm text-gray-500">{clinic.city}, {clinic.province}</p>
        </div>

        <div className="space-y-3">
          <a
            href={intakeUrl}
            className="block w-full bg-blue-600 text-white rounded-xl py-4 font-semibold text-base"
          >
            Patient Intake Form
          </a>
          <a
            href={loginUrl}
            className="block w-full border border-gray-200 text-gray-700 rounded-xl py-4 font-semibold text-base"
          >
            Staff Login
          </a>
        </div>

        <p className="text-xs text-gray-400">Powered by Sigurado</p>
      </div>
    </div>
  )
}
