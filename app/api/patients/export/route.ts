import { NextResponse } from 'next/server'
import { withClinicDb } from '@/lib/clinic-db'
import { getSessionUser } from '@/lib/auth'

function escapeCsv(value: string | null | undefined): string {
  const s = String(value ?? '')
  return `"${s.replace(/"/g, '""')}"`
}

function fmtDate(d: Date | null): string {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export async function GET() {
  const user = await getSessionUser()
  if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clinicId = user.clinicId as string
  const patients = await withClinicDb(clinicId, (tx) =>
    tx.patient.findMany({
      where: { clinicId },
      orderBy: { lastName: 'asc' },
      include: {
        visits: {
          orderBy: { visitDate: 'desc' },
          take: 1,
          select: { visitDate: true },
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
    fmtDate(p.visits[0]?.visitDate ?? null),
    p.reminderChannel,
    p.bracesComplete ? 'Yes' : 'No',
    fmtDate(p.consentRecords[0]?.consentDate ?? null),
    p.consentRecords[0]?.consentMethod ?? '',
    p.consentRecords[0]?.isMinor ? 'Yes' : 'No',
    p.consentRecords[0]?.guardianName ?? '',
  ])

  const csv = [header, ...rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n')

  const today = new Date().toISOString().split('T')[0]

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="patients-${today}.csv"`,
    },
  })
}
