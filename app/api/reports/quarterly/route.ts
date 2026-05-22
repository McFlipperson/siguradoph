export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

function isCronRequest(req: NextRequest): boolean {
  const auth = req.headers.get('authorization')
  return !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`
}

function previousQuarter(now: Date): { year: number; q: number; start: Date; end: Date; label: string } {
  const month = now.getMonth()
  const currentQ = Math.floor(month / 3) + 1
  const prevQ = currentQ === 1 ? 4 : currentQ - 1
  const prevYear = currentQ === 1 ? now.getFullYear() - 1 : now.getFullYear()
  const startMonth = (prevQ - 1) * 3
  const start = new Date(prevYear, startMonth, 1)
  const end = new Date(prevYear, startMonth + 3, 0, 23, 59, 59, 999)
  return { year: prevYear, q: prevQ, start, end, label: `Q${prevQ} ${prevYear}` }
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2 }).format(n)
}

function csv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
}

// EWT applies to these categories when a supplier TIN is on file
const EWT_CATEGORIES = new Set(['RENT', 'PROFESSIONAL_FEES'])
// ATC codes per BIR regulations
const ATC: Record<string, string> = {
  RENT: 'WC158',
  PROFESSIONAL_FEES: 'WC010',
}
// EWT rate for each category
const EWT_RATE: Record<string, number> = {
  RENT: 0.05,
  PROFESSIONAL_FEES: 0.10,
}

async function buildAndSendReport(clinicId: string): Promise<{ ok: boolean; reason?: string }> {
  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } })
  if (!clinic) return { ok: false, reason: 'Clinic not found' }
  if (!clinic.accountantEmail) return { ok: false, reason: 'No accountant email configured' }

  const { start, end, label, q, year } = previousQuarter(new Date())

  const [invoices, expenses, patientCount, payrollRecords] = await Promise.all([
    prisma.invoice.findMany({
      where: { clinicId, transactionDate: { gte: start, lte: end } },
      orderBy: { transactionDate: 'asc' },
    }),
    prisma.expense.findMany({
      where: { clinicId, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
      include: { supplier: true },
    }),
    prisma.visit.count({ where: { clinicId, visitDate: { gte: start, lte: end } } }),
    clinic.hasEmployees
      ? prisma.payrollRecord.findMany({
          where: {
            clinicId,
            periodYear: { gte: start.getFullYear(), lte: end.getFullYear() },
          },
          include: { employee: true },
        })
      : Promise.resolve([]),
  ])

  const issued = invoices.filter((i) => i.status === 'ISSUED')
  const totalGross  = issued.reduce((s, i) => s + Number(i.grossAmount), 0)
  const totalNet    = issued.reduce((s, i) => s + Number(i.netAmount), 0)
  const outputVat   = issued.reduce((s, i) => s + Number(i.vatAmount), 0)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.grossAmount), 0)
  const inputVat    = expenses.reduce((s, e) => s + Number(e.inputVatAmount), 0)
  const netVat      = outputVat - inputVat

  // ── SLSP Sales CSV ──────────────────────────────────────────────────────────
  // BIR RELIEF format: buyer TIN | name | address | gross taxable | exempt | zero-rated | VAT
  const slspSalesRows = [
    ['Buyer TIN', 'Buyer Name', 'Buyer Address', 'Gross Taxable Sales', 'Exempt Sales', 'Zero-Rated Sales', 'VAT Amount (12%)', 'OR Number', 'Date'],
    ...issued.map((i) => [
      '000-000-000',                         // B2C — no patient TIN collected
      i.buyerName ?? 'Various Customers',
      i.buyerAddress ?? '',
      Number(i.netAmount).toFixed(2),        // taxable base (ex-VAT)
      '0.00',
      '0.00',
      Number(i.vatAmount).toFixed(2),
      i.orNumber,
      new Date(i.transactionDate).toLocaleDateString('en-PH'),
    ]),
  ]
  const slspSalesCsv = csv(slspSalesRows)

  // ── SLSP Purchases CSV ──────────────────────────────────────────────────────
  // BIR RELIEF format: supplier TIN | name | address | services | capital | other | VAT
  const slspPurchasesRows = [
    ['Supplier TIN', 'Supplier Name', 'Supplier Address', 'Services Amount', 'Capital Goods', 'Other Goods', 'Input VAT (12%)', 'Category', 'Receipt No.', 'Date'],
    ...expenses.map((e) => {
      const isService = ['RENT', 'PROFESSIONAL_FEES', 'UTILITIES', 'INTERNET_PHONE', 'MAINTENANCE', 'LICENSES_PERMITS'].includes(e.category)
      const isCapital = e.category === 'OTHER' // simplification — capital goods rare for dental supplies
      return [
        e.supplier?.tin ?? '',
        e.supplier?.name ?? e.description,
        e.supplier?.address ?? '',
        isService ? Number(e.netAmount).toFixed(2) : '0.00',
        isCapital ? Number(e.netAmount).toFixed(2) : '0.00',
        (!isService && !isCapital) ? Number(e.netAmount).toFixed(2) : '0.00',
        Number(e.inputVatAmount).toFixed(2),
        e.category,
        e.receiptNumber ?? '',
        new Date(e.date).toLocaleDateString('en-PH'),
      ]
    }),
  ]
  const slspPurchasesCsv = csv(slspPurchasesRows)

  // ── QAP CSV (EWT payees) ────────────────────────────────────────────────────
  // Only included if clinic withheld EWT from any payee this quarter
  const ewtExpenses = expenses.filter(
    (e) => EWT_CATEGORIES.has(e.category) && e.supplier?.tin
  )

  let qapCsv: string | null = null
  if (ewtExpenses.length > 0) {
    // Group by supplier + category for the alphalist
    const grouped = new Map<string, { name: string; tin: string; address: string; atc: string; totalPayment: number; ewt: number }>()
    for (const e of ewtExpenses) {
      const key = `${e.supplier!.tin}-${e.category}`
      const rate = EWT_RATE[e.category] ?? 0
      const existing = grouped.get(key)
      const payment = Number(e.grossAmount)
      if (existing) {
        existing.totalPayment += payment
        existing.ewt += payment * rate
      } else {
        grouped.set(key, {
          name: e.supplier!.name,
          tin: e.supplier!.tin!,
          address: e.supplier?.address ?? '',
          atc: ATC[e.category] ?? '',
          totalPayment: payment,
          ewt: payment * rate,
        })
      }
    }
    const qapRows = [
      ['Payee TIN', 'Payee Name', 'Payee Address', 'ATC', 'Nature of Payment', 'Total Amount Paid', 'EWT Rate', 'EWT Amount'],
      ...Array.from(grouped.values()).map((p) => [
        p.tin,
        p.name,
        p.address,
        p.atc,
        p.atc === 'WC158' ? 'Rent' : 'Professional Fees',
        p.totalPayment.toFixed(2),
        `${(EWT_RATE[p.atc === 'WC158' ? 'RENT' : 'PROFESSIONAL_FEES'] ?? 0) * 100}%`,
        p.ewt.toFixed(2),
      ]),
    ]
    qapCsv = csv(qapRows)
  }

  // ── Payroll summary CSV ─────────────────────────────────────────────────────
  let payrollCsv: string | null = null
  if (payrollRecords.length > 0) {
    // Filter to records in the quarter's months
    const qMonths = [start.getMonth() + 1, start.getMonth() + 2, start.getMonth() + 3]
    const filtered = payrollRecords.filter(
      (r) => r.periodYear === year && qMonths.includes(r.periodMonth)
    )
    if (filtered.length > 0) {
      const payrollRows = [
        ['Employee', 'Month', 'Week', 'Gross Pay', 'SSS Employee', 'SSS Employer', 'PhilHealth Employee', 'PhilHealth Employer', 'Pag-IBIG Employee', 'Pag-IBIG Employer', 'Withholding Tax', 'Net Pay'],
        ...filtered.map((r) => [
          r.employee.fullName,
          r.periodMonth,
          r.periodWeek,
          Number(r.basicSalary).toFixed(2),
          Number(r.sssEmployee).toFixed(2),
          Number(r.sssEmployer).toFixed(2),
          Number(r.philhealthEmployee).toFixed(2),
          Number(r.philhealthEmployer).toFixed(2),
          Number(r.pagibigEmployee).toFixed(2),
          Number(r.pagibigEmployer).toFixed(2),
          Number(r.withholdingTax).toFixed(2),
          Number(r.netPay).toFixed(2),
        ]),
      ]
      payrollCsv = csv(payrollRows)
    }
  }

  // ── Email HTML ──────────────────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
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
              <tr><td style="color:#374151;padding:3px 0;">Patient Visits</td><td style="text-align:right;">${patientCount}</td></tr>
              <tr><td style="color:#374151;padding:3px 0;">Invoices Issued</td><td style="text-align:right;">${issued.length}</td></tr>
              <tr><td style="color:#374151;padding:3px 0;">Gross Sales</td><td style="text-align:right;font-weight:600;">₱${fmt(totalGross)}</td></tr>
              <tr><td style="color:#374151;padding:3px 0;">Net Sales (ex. VAT)</td><td style="text-align:right;">₱${fmt(totalNet)}</td></tr>
              <tr><td style="color:#374151;padding:3px 0;">Output VAT (12%)</td><td style="text-align:right;">₱${fmt(outputVat)}</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px;border-bottom:1px solid #e5e7eb;">
            <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;">Expenses</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
              <tr><td style="color:#374151;padding:3px 0;">Total Expenses</td><td style="text-align:right;font-weight:600;">₱${fmt(totalExpenses)}</td></tr>
              <tr><td style="color:#374151;padding:3px 0;">Input VAT (claimable)</td><td style="text-align:right;">₱${fmt(inputVat)}</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 28px;border-bottom:1px solid #e5e7eb;background:#fafafa;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;">VAT Summary (2550Q)</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
              <tr><td style="color:#374151;padding:3px 0;">Output VAT</td><td style="text-align:right;">₱${fmt(outputVat)}</td></tr>
              <tr><td style="color:#374151;padding:3px 0;">Less: Input VAT</td><td style="text-align:right;">−₱${fmt(inputVat)}</td></tr>
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
              CSV attachments included: SLSP Sales, SLSP Purchases${qapCsv ? ', QAP (EWT Payees)' : ''}${payrollCsv ? ', Payroll Summary' : ''}.<br>
              For BIR filing reference only. Powered by Sigurado.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  // ── Send email ──────────────────────────────────────────────────────────────
  const slug = label.replace(' ', '-')
  const attachments: { filename: string; content: Buffer }[] = [
    { filename: `SLSP-Sales-${slug}.csv`,     content: Buffer.from(slspSalesCsv, 'utf-8') },
    { filename: `SLSP-Purchases-${slug}.csv`, content: Buffer.from(slspPurchasesCsv, 'utf-8') },
  ]
  if (qapCsv)     attachments.push({ filename: `QAP-${slug}.csv`,     content: Buffer.from(qapCsv, 'utf-8') })
  if (payrollCsv) attachments.push({ filename: `Payroll-${slug}.csv`, content: Buffer.from(payrollCsv, 'utf-8') })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'noreply@sigurado.xyz',
    to: clinic.accountantEmail,
    subject: `${label} Financial Report — ${clinic.name}`,
    html,
    attachments,
  })

  // ── Log the attempt ─────────────────────────────────────────────────────────
  await prisma.quarterlyReportLog.create({
    data: {
      clinicId,
      quarter: q,
      year,
      sentTo: clinic.accountantEmail,
      status: error ? 'FAILED' : 'SENT',
      errorMessage: error?.message ?? null,
    },
  })

  if (error) return { ok: false, reason: error.message }
  return { ok: true }
}

// ── POST — cron endpoint ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!isCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clinics = await prisma.clinic.findMany({
    where: { accountantEmail: { not: null }, onboardingComplete: true },
    select: { id: true },
  })

  const results = await Promise.allSettled(clinics.map((c) => buildAndSendReport(c.id)))

  const sent    = results.filter((r) => r.status === 'fulfilled' && r.value.ok).length
  const skipped = results.filter((r) => r.status === 'fulfilled' && !r.value.ok).length
  const failed  = results.filter((r) => r.status === 'rejected').length

  return NextResponse.json({ processed: clinics.length, sent, skipped, failed })
}

// ── GET — manual trigger for a single clinic (authenticated) ──────────────────
export async function GET(req: NextRequest) {
  const { getSessionUser } = await import('@/lib/auth')
  const user = await getSessionUser()
  if (!user?.clinicId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clinicId = req.nextUrl.searchParams.get('clinicId') ?? user.clinicId

  if (clinicId !== user.clinicId && user.role !== 'CPA') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const result = await buildAndSendReport(clinicId)
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: result.reason === 'Clinic not found' ? 404 : 422 })
  }

  return NextResponse.json({ ok: true })
}
