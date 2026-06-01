import { prisma } from '@/lib/prisma'
import { withClinicDb } from '@/lib/clinic-db'
import { getSessionUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ComplianceClient from './ComplianceClient'

export const dynamic = 'force-dynamic'

export default async function CompliancePage() {
  const user = await getSessionUser()
  if (!user?.clinicId) redirect('/login')

  const clinicId = user.clinicId
  const [clinic, logs, patientCount, scPwdLogs] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { name: true, tosAcceptedAt: true, enrollmentDate: true },
    }),
    withClinicDb(clinicId, (tx) => tx.auditLog.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })),
    withClinicDb(clinicId, (tx) => tx.patient.count({ where: { clinicId } })),
    withClinicDb(clinicId, (tx) => tx.scPwdAuditLog.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })),
  ])

  return (
    <ComplianceClient
      clinicName={clinic?.name ?? ''}
      tosAcceptedAt={clinic?.tosAcceptedAt?.toISOString() ?? null}
      enrollmentDate={clinic?.enrollmentDate?.toISOString() ?? null}
      patientCount={patientCount}
      logs={logs.map(l => ({
        id: l.id,
        action: l.action,
        resourceType: l.resourceType,
        resourceId: l.resourceId,
        detail: l.detail ?? '',
        userEmail: l.userEmail,
        createdAt: l.createdAt.toISOString(),
      }))}
      scPwdLogs={scPwdLogs.map(l => ({
        id: l.id,
        patientId: l.patientId,
        invoiceId: l.invoiceId,
        discountType: l.discountType,
        idNumber: l.idNumber,
        discountPct: Number(l.discountPct),
        discountAmount: Number(l.discountAmount),
        createdAt: l.createdAt.toISOString(),
      }))}
    />
  )
}
