import { NextResponse } from 'next/server'
import { withClinicDb } from '@/lib/clinic-db'
import { getSessionUser, getClinicPlan } from '@/lib/auth'
import { planAllows } from '@/lib/entitlements'
import { writeAudit } from '@/lib/audit'

function escapeCsv(value: string | null | undefined): string {
  const s = String(value ?? '')
  return `"${s.replace(/"/g, '""')}"`
}

function fmtDate(d: Date | null): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

type ProcedureAmount = { name: string; amount: number }

function fmtVisitHistory(visits: { visitDate: Date; procedureAmounts: unknown; notes: string | null }[]): string {
  if (!visits.length) return ''
  return visits.map((v) => {
    const date = fmtDate(v.visitDate)
    const procs = Array.isArray(v.procedureAmounts)
      ? (v.procedureAmounts as ProcedureAmount[])
          .map((p) => `${p.name} (₱${Number(p.amount).toLocaleString('en-PH')})`)
          .join(', ')
      : ''
    const note = v.notes ? ` [${v.notes}]` : ''
    return procs ? `${date}: ${procs}${note}` : `${date}${note}`
  }).join(' | ')
}

export async function GET() {
  const user = await getSessionUser()
  if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clinicId = user.clinicId as string
  if (!planAllows(await getClinicPlan(clinicId), 'data_export')) {
    return NextResponse.json({ error: 'Data export is available on the Basic plan.' }, { status: 403 })
  }
  const patients = await withClinicDb(clinicId, (tx) =>
    tx.patient.findMany({
      where: { clinicId },
      orderBy: { lastName: 'asc' },
      include: {
        visits: {
          orderBy: { visitDate: 'asc' },
          select: { visitDate: true, procedureAmounts: true, notes: true },
        },
        consentRecords: {
          orderBy: { consentDate: 'desc' },
          take: 1,
          select: { consentDate: true, consentMethod: true, isMinor: true, guardianName: true },
        },
      },
    })
  )

  const header = [
    'Last Name', 'First Name', 'Date of Birth', 'Phone', 'Email', 'Address',
    'Medical History', 'Medications', 'Allergies',
    'Enrolled', 'Last Visit',
    'Reminder Channel', 'Braces Complete',
    'Consent Date', 'Consent Method', 'Is Minor', 'Guardian Name',
    'Visit History (Date: Procedures)',
  ]

  const rows = patients.map((p) => [
    p.lastName,
    p.firstName,
    fmtDate(p.dateOfBirth),
    p.phone,
    p.email ?? '',
    p.address,
    p.medicalHistory ?? '',
    p.medications ?? '',
    p.allergies ?? '',
    fmtDate(p.enrolledAt),
    fmtDate(p.visits[p.visits.length - 1]?.visitDate ?? null),
    p.reminderChannel,
    p.bracesComplete ? 'Yes' : 'No',
    fmtDate(p.consentRecords[0]?.consentDate ?? null),
    p.consentRecords[0]?.consentMethod ?? '',
    p.consentRecords[0]?.isMinor ? 'Yes' : 'No',
    p.consentRecords[0]?.guardianName ?? '',
    fmtVisitHistory(p.visits),
  ])

  const csv = [header, ...rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n')

  // RA 10173: a bulk export is a mass disclosure of Sensitive Personal
  // Information — record who exported what, and when.
  await writeAudit({
    clinicId,
    userEmail: user.email,
    action: 'EXPORT_PATIENTS',
    resourceType: 'PATIENT',
    resourceId: 'BULK_EXPORT',
    detail: `Exported ${patients.length} patient record(s) to CSV (includes medical history, medications, allergies, full visit & procedure history)`,
  })

  const today = new Date().toISOString().split('T')[0]

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="patients-${today}.csv"`,
    },
  })
}
