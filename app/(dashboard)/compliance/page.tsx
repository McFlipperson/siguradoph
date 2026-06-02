import { prisma } from '@/lib/prisma'
import { withClinicDb } from '@/lib/clinic-db'
import { getSessionUser, getClinicPlan } from '@/lib/auth'
import { planAllows } from '@/lib/entitlements'
import { UpgradeRequired } from '@/components/UpgradeRequired'
import { redirect } from 'next/navigation'
import ComplianceClient from './ComplianceClient'

export const dynamic = 'force-dynamic'

export default async function CompliancePage() {
  const user = await getSessionUser()
  if (!user?.clinicId) redirect('/login')

  const clinicId = user.clinicId

  const plan = await getClinicPlan(clinicId)
  if (!planAllows(plan, 'compliance')) {
    return <UpgradeRequired
      title="Privacy & Compliance Tools"
      description="View your audit log, consent records, SC/PWD log, and log data-breach incidents with the 72-hour NPC clock and annual report. Your records are already being kept safely — upgrade to access and manage them."
      planNeeded="PRO" />
  }

  const [clinic, logs, patientCount, scPwdLogs, incidents] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { name: true, tosAcceptedAt: true, enrollmentDate: true, dpoName: true, dpoEmail: true },
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
    withClinicDb(clinicId, (tx) => tx.incidentLog.findMany({
      where: { clinicId },
      orderBy: { discoveryDate: 'desc' },
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
      incidents={incidents.map(i => ({
        id: i.id,
        incidentDate: i.incidentDate.toISOString(),
        discoveryDate: i.discoveryDate.toISOString(),
        type: i.type,
        severity: i.severity,
        description: i.description,
        natureOfData: i.natureOfData,
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
