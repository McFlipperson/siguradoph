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

export async function GET() {
  const user = await getSessionUser()
  if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const clinicId = user.clinicId as string
  if (!planAllows(await getClinicPlan(clinicId), 'data_export')) {
    return NextResponse.json({ error: 'Data export is available on the Basic plan.' }, { status: 403 })
  }

  const invoices = await withClinicDb(clinicId, (tx) => tx.invoice.findMany({
    where: { clinicId },
    orderBy: { transactionDate: 'desc' },
  }))

  const header = [
    'OR Number', 'Date', 'Patient', 'Service Description',
    'Gross', 'Net (ex. VAT)', 'VAT', 'Discount',
    'Payment Method', 'Status',
  ]

  const rows = invoices.map((inv) => [
    inv.orNumber,
    fmtDate(inv.transactionDate),
    inv.buyerName ?? '',
    inv.serviceDescription,
    Number(inv.grossAmount).toFixed(2),
    Number(inv.netAmount).toFixed(2),
    Number(inv.vatAmount).toFixed(2),
    Number(inv.discountAmount).toFixed(2),
    inv.paymentMethod,
    inv.status,
  ])

  const csv = [header, ...rows]
    .map((row) => row.map(escapeCsv).join(','))
    .join('\n')

  // Invoice exports carry patient names/addresses — log the disclosure.
  await writeAudit({
    clinicId,
    userEmail: user.email,
    action: 'EXPORT_INVOICES',
    resourceType: 'INVOICE',
    resourceId: 'BULK_EXPORT',
    detail: `Exported ${invoices.length} invoice(s) to CSV (includes patient names)`,
  })

  const today = new Date().toISOString().split('T')[0]

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="invoices-${today}.csv"`,
    },
  })
}
