export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parsePeriod, verifyCpaAccess } from '../_lib'
import React from 'react'
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const styles = (StyleSheet.create as (s: Record<string, any>) => Record<string, any>)({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: '#111' },
  header: { marginBottom: 16 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#555', marginBottom: 2 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#ddd', paddingBottom: 3 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 4 },
  headerRow: { flexDirection: 'row', backgroundColor: '#f3f4f6', paddingVertical: 5 },
  cell: { flex: 1, paddingHorizontal: 4 },
  cellRight: { flex: 1, paddingHorizontal: 4, textAlign: 'right' },
  summaryRow: { flexDirection: 'row', marginBottom: 4 },
  summaryLabel: { width: 180, color: '#555' },
  summaryValue: { fontWeight: 'bold' },
  footer: { marginTop: 24, color: '#888', fontSize: 8, textAlign: 'center' },
})

function fmt(n: number) { return n.toLocaleString('en-US', { minimumFractionDigits: 2 }) }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) }

export async function GET(req: NextRequest, { params }: { params: { clinicId: string } }) {
  const ok = await verifyCpaAccess(params.clinicId)
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const period = req.nextUrl.searchParams.get('period') ?? ''
  const { start, end, label } = parsePeriod(period || 'now')

  const clinic = await prisma.clinic.findUnique({ where: { id: params.clinicId } })
  if (!clinic) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [invoices, expenses] = await Promise.all([
    prisma.invoice.findMany({ where: { clinicId: params.clinicId, transactionDate: { gte: start, lte: end } }, orderBy: { transactionDate: 'asc' } }),
    prisma.expense.findMany({ where: { clinicId: params.clinicId, date: { gte: start, lte: end } }, orderBy: { date: 'asc' } }),
  ])

  const issued = invoices.filter((i) => i.status === 'ISSUED')
  const totalGross = issued.reduce((s, i) => s + Number(i.grossAmount), 0)
  const totalOutputVat = issued.reduce((s, i) => s + Number(i.vatAmount), 0)
  const totalInputVat = expenses.reduce((s, e) => s + Number(e.inputVatAmount), 0)
  const netVat = totalOutputVat - totalInputVat

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CE = (type: any, props: any, ...children: any[]) => React.createElement(type, props, ...children)

  const summaryItems: [string, number][] = [
    ['Gross Sales', totalGross],
    ['Total Output VAT', totalOutputVat],
    ['Total Input VAT', totalInputVat],
    ['Net VAT Payable', netVat],
  ]

  const doc = CE(Document, {},
    CE(Page, { size: 'A4', style: styles.page },
      CE(View, { style: styles.header },
        CE(Text, { style: styles.title }, clinic.name),
        CE(Text, { style: styles.subtitle }, `TIN: ${clinic.tin} | ${clinic.street}, ${clinic.city}, ${clinic.province}`),
        CE(Text, { style: styles.subtitle }, `VAT Report — ${label}`),
        CE(Text, { style: styles.subtitle }, `Generated: ${new Date().toLocaleDateString('en-PH')}`),
      ),
      CE(View, { style: styles.section },
        CE(Text, { style: styles.sectionTitle }, 'Summary'),
        ...summaryItems.map(([lbl, value]) =>
          CE(View, { style: styles.summaryRow, key: lbl },
            CE(Text, { style: styles.summaryLabel }, lbl),
            CE(Text, { style: styles.summaryValue }, `PHP ${fmt(value)}`),
          )
        ),
      ),
      CE(View, { style: styles.section },
        CE(Text, { style: styles.sectionTitle }, `Sales Invoices (${invoices.length})`),
        CE(View, { style: styles.headerRow },
          CE(Text, { style: { ...styles.cell, width: 70 } }, 'OR No.'),
          CE(Text, { style: { ...styles.cell, width: 70 } }, 'Date'),
          CE(Text, { style: { ...styles.cell, flex: 2 } }, 'Service'),
          CE(Text, { style: styles.cellRight }, 'Gross'),
          CE(Text, { style: styles.cellRight }, 'VAT'),
          CE(Text, { style: { ...styles.cell, width: 40 } }, 'Status'),
        ),
        ...invoices.map((inv) =>
          CE(View, { style: styles.row, key: inv.id },
            CE(Text, { style: { ...styles.cell, width: 70 } }, inv.orNumber),
            CE(Text, { style: { ...styles.cell, width: 70 } }, fmtDate(inv.transactionDate.toISOString())),
            CE(Text, { style: { ...styles.cell, flex: 2 } }, inv.serviceDescription.slice(0, 40)),
            CE(Text, { style: styles.cellRight }, fmt(Number(inv.grossAmount))),
            CE(Text, { style: styles.cellRight }, fmt(Number(inv.vatAmount))),
            CE(Text, { style: { ...styles.cell, width: 40 } }, inv.status),
          )
        ),
      ),
      CE(Text, { style: styles.footer }, 'Generated by SiguradoPH — For BIR filing reference only'),
    )
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await (renderToBuffer as (doc: any) => Promise<Buffer>)(doc)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="report-${params.clinicId}-${period || 'report'}.pdf"`,
    },
  })
}
