export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

// ─── Auth ─────────────────────────────────────────────────────────────────────
// Called by Vercel Cron with Authorization: Bearer CRON_SECRET
// Can also be triggered manually by an authenticated clinic owner (POST with clinicId in body)

function isCronRequest(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  return !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`
}

// ─── Quarter helpers ──────────────────────────────────────────────────────────
function previousQuarter(now: Date): { year: number; q: number; start: Date; end: Date; label: string } {
  // now is always the 1st of a quarter month (Jan, Apr, Jul, Oct) in cron mode
  const month = now.getMonth() // 0-11
  const currentQ = Math.floor(month / 3) + 1
  const prevQ = currentQ === 1 ? 4 : currentQ - 1
  const prevYear = currentQ === 1 ? now.getFullYear() - 1 : now.getFullYear()
  const startMonth = (prevQ - 1) * 3
  const start = new Date(prevYear, startMonth, 1)
  const end = new Date(prevYear, startMonth + 3, 0, 23, 59, 59, 999)
  const quarterLabel = `Q${prevQ} ${prevYear}`
  return { year: prevYear, q: prevQ, start, end, label: quarterLabel }
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(n)
}

function escapeCsv(v: string | null | undefined) {
  return `"${String(v ?? '').replace(/"/g, '""')}"`
}

// ─── Report builder ───────────────────────────────────────────────────────────
async function buildAndSendReport(clinicId: string): Promise<{ ok: boolean; reason?: string }> {
  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } })
  if (!clinic) return { ok: false, reason: 'Clinic not found' }
  if (!clinic.accountantEmail) return { ok: false, reason: 'No accountant email configured' }

  const { start, end, label } = previousQuarter(new Date())

  const [invoices, expenses, patientCount] = await Promise.all([
    prisma.invoice.findMany({
      where: { clinicId, transactionDate: { gte: start, lte: end } },
      orderBy: { transactionDate: 'asc' },
    }),
    prisma.expense.findMany({
      where: { clinicId, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    }),
    prisma.visit.count({
      where: { clinicId, visitDate: { gte: start, lte: end } },
    }),
  ])

  const issued = invoices.filter((i) => i.status === 'ISSUED')
  const totalGross = issued.reduce((s, i) => s + Number(i.grossAmount), 0)
  const totalNet   = issued.reduce((s, i) => s + Number(i.netAmount), 0)
  const outputVat  = issued.reduce((s, i) => s + Number(i.vatAmount), 0)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.grossAmount), 0)
  const inputVat   = expenses.reduce((s, e) => s + Number(e.inputVatAmount), 0)
  const netVat     = outputVat - inputVat

  // ── Invoice CSV ──
  const invHeader = ['OR Number', 'Date', 'Buyer', 'Service', 'Gross', 'Net', 'VAT', 'Discount', 'Method', 'Status']
  const invRows = invoices.map((i) => [
    i.orNumber,
    new Date(i.transactionDate).toLocaleDateString('en-PH'),
    i.buyerName ?? '',
    i.serviceDescription,
    Number(i.grossAmount).toFixed(2),
    Number(i.netAmount).toFixed(2),
    Number(i.vatAmount).toFixed(2),
    Number(i.discountAmount).toFixed(2),
    i.paymentMethod,
    i.status,
  ])
  const invoiceCsv = [invHeader, ...invRows].map((r) => r.map(escapeCsv).join(',')).join('\n')

  // ── Expense CSV ──
  const expHeader = ['Date', 'Description', 'Category', 'Gross', 'Input VAT', 'Net', 'Payment', 'Receipt No.']
  const expRows = expenses.map((e) => [
    new Date(e.date).toLocaleDateString('en-PH'),
    e.description,
    e.category,
    Number(e.grossAmount).toFixed(2),
    Number(e.inputVatAmount).toFixed(2),
    Number(e.netAmount).toFixed(2),
    e.paymentMethod,
    e.receiptNumber ?? '',
  ])
  const expenseCsv = [expHeader, ...expRows].map((r) => r.map(escapeCsv).join(',')).join('\n')

  // ── Email ──
  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">

        <tr>
          <td style="background:#0f172a;padding:24px 28px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#fff;">${clinic.name}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">TIN: ${clinic.tin}</p>
          </td>
        </tr>

        <tr>
          <td style="background:#f0fdf4;padding:16px 28px;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:.08em;">Quarterly Financial Report</p>
            <p style="margin:4px 0 0;font-size:22px;font-weight:700;color:#15803d;">${label}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">
              ${start.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })} –
              ${end.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 28px;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;">Revenue</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
              <tr><td style="color:#374151;padding:3px 0;">Total Invoices</td><td style="text-align:right;">${issued.length} issued / ${invoices.length} total</td></tr>
              <tr><td style="color:#374151;padding:3px 0;">Gross Sales</td><td style="text-align:right;font-weight:600;">₱${fmt(totalGross)}</td></tr>
              <tr><td style="color:#374151;padding:3px 0;">Net Sales (ex. VAT)</td><td style="text-align:right;">₱${fmt(totalNet)}</td></tr>
              <tr><td style="color:#374151;padding:3px 0;">Output VAT (12%)</td><td style="text-align:right;">₱${fmt(outputVat)}</td></tr>
              <tr><td style="color:#374151;padding:3px 0;">Patient Visits</td><td style="text-align:right;">${patientCount}</td></tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 28px;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;">Expenses</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
              <tr><td style="color:#374151;padding:3px 0;">Total Expenses</td><td style="text-align:right;font-weight:600;">₱${fmt(totalExpenses)}</td></tr>
              <tr><td style="color:#374151;padding:3px 0;">Input VAT</td><td style="text-align:right;">₱${fmt(inputVat)}</td></tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 28px;border-bottom:1px solid #e5e7eb;background:#fafafa;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;">VAT Summary</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
              <tr><td style="color:#374151;padding:3px 0;">Output VAT</td><td style="text-align:right;">₱${fmt(outputVat)}</td></tr>
              <tr><td style="color:#374151;padding:3px 0;">Less: Input VAT</td><td style="text-align:right;">-₱${fmt(inputVat)}</td></tr>
              <tr>
                <td style="font-size:15px;font-weight:700;color:#111;padding-top:8px;">Net VAT Payable</td>
                <td style="text-align:right;font-size:18px;font-weight:700;color:#111;padding-top:8px;">₱${fmt(netVat)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:16px 28px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              Two CSV attachments are included: invoices and expenses for ${label}.<br>
              For BIR filing reference. Powered by Sigurado.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@sigurado.xyz',
    to: clinic.accountantEmail,
    subject: `${label} Financial Report — ${clinic.name}`,
    html,
    attachments: [
      {
        filename: `invoices-${label.replace(' ', '-')}.csv`,
        content: Buffer.from(invoiceCsv, 'utf-8'),
      },
      {
        filename: `expenses-${label.replace(' ', '-')}.csv`,
        content: Buffer.from(expenseCsv, 'utf-8'),
      },
    ],
  })

  if (error) return { ok: false, reason: error.message }
  return { ok: true }
}

// ─── POST — cron endpoint ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!isCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find all clinics that have an accountant email configured
  const clinics = await prisma.clinic.findMany({
    where: { accountantEmail: { not: null }, onboardingComplete: true },
    select: { id: true },
  })

  const results = await Promise.allSettled(
    clinics.map((c) => buildAndSendReport(c.id))
  )

  const sent    = results.filter((r) => r.status === 'fulfilled' && r.value.ok).length
  const skipped = results.filter((r) => r.status === 'fulfilled' && !r.value.ok).length
  const failed  = results.filter((r) => r.status === 'rejected').length

  return NextResponse.json({ processed: clinics.length, sent, skipped, failed })
}

// ─── GET — manual trigger for a single clinic (authenticated) ─────────────────
// Called from Settings UI for "Send now" test
export async function GET(req: NextRequest) {
  // Allow cron secret as well as normal session auth
  const { getSessionUser } = await import('@/lib/auth')
  const user = await getSessionUser()
  if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Honour explicit clinicId from owner if provided
  const clinicId = req.nextUrl.searchParams.get('clinicId') ?? user.clinicId

  // Owners can only trigger their own clinic
  if (clinicId !== user.clinicId && user.role !== 'CPA') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const result = await buildAndSendReport(clinicId)
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: result.reason === 'Clinic not found' ? 404 : 422 })
  }

  return NextResponse.json({ ok: true })
}
