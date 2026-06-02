export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase'
import { isAdminEmail } from '@/lib/admin'
import { prisma } from '@/lib/prisma'
import PlatformIncidentsClient from './PlatformIncidentsClient'

export default async function PlatformIncidentsPage() {
  const supabase = createServerClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!isAdminEmail(authUser?.email)) redirect('/')

  const incidents = await prisma.platformIncident.findMany({
    orderBy: { discoveryDate: 'desc' },
  })

  return (
    <PlatformIncidentsClient
      incidents={incidents.map((i) => ({
        id: i.id,
        incidentDate: i.incidentDate.toISOString(),
        discoveryDate: i.discoveryDate.toISOString(),
        type: i.type,
        severity: i.severity,
        description: i.description,
        natureOfData: i.natureOfData,
        clinicsAffected: i.clinicsAffected,
        individualsAffected: i.individualsAffected,
        measuresTaken: i.measuresTaken,
        reportedToNpc: i.reportedToNpc,
        npcReportDate: i.npcReportDate?.toISOString() ?? null,
        reportedToSubjects: i.reportedToSubjects,
        status: i.status,
        createdBy: i.createdBy,
        createdAt: i.createdAt.toISOString(),
      }))}
    />
  )
}
