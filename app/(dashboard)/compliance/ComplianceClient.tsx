'use client'

import { useState, useMemo } from 'react'
import { Shield, Download, Search, AlertTriangle, CheckCircle2, FileText, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

type AuditEntry = {
  id: string
  action: string
  resourceType: string
  resourceId: string
  detail: string
  userEmail: string
  createdAt: string
}

type ScPwdEntry = {
  id: string
  patientId: string
  invoiceId: string
  discountType: string
  idNumber: string
  discountPct: number
  discountAmount: number
  createdAt: string
}

interface Props {
  clinicName: string
  tosAcceptedAt: string | null
  enrollmentDate: string | null
  patientCount: number
  logs: AuditEntry[]
  scPwdLogs: ScPwdEntry[]
}

const ACTION_LABELS: Record<string, string> = {
  CREATE_PATIENT:       'Patient created',
  VIEW_PATIENT:         'Patient viewed',
  EDIT_PATIENT_MEDICAL: 'Medical record edited',
  EDIT_PATIENT_SCPWD:   'SC/PWD status edited',
  CREATE_VISIT:         'Visit recorded',
  CONFIRM_PAYMENT:      'Payment confirmed',
  VOID_INVOICE:         'Invoice voided',
  UPDATE_VISIT:         'Visit updated',
  DELETE_PATIENT:       'Patient deleted',
  EXPORT_PATIENTS:      'Patient data exported',
  EXPORT_INVOICES:      'Invoices exported',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

const ALL_ACTIONS = Object.keys(ACTION_LABELS)

export default function ComplianceClient({
  clinicName,
  tosAcceptedAt,
  patientCount,
  logs,
  scPwdLogs,
}: Props) {
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('ALL')
  const [activeTab, setActiveTab] = useState<'audit' | 'scpwd'>('audit')

  const npcWarning = patientCount >= 800

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchesAction = filterAction === 'ALL' || l.action === filterAction
      const matchesSearch = !search.trim() ||
        l.detail.toLowerCase().includes(search.toLowerCase()) ||
        l.userEmail.toLowerCase().includes(search.toLowerCase()) ||
        l.resourceId.toLowerCase().includes(search.toLowerCase())
      return matchesAction && matchesSearch
    })
  }, [logs, search, filterAction])

  function exportCSV() {
    const rows = [
      ['Date', 'Action', 'Resource Type', 'Resource ID', 'Detail', 'User'],
      ...filteredLogs.map(l => [
        formatDate(l.createdAt),
        ACTION_LABELS[l.action] ?? l.action,
        l.resourceType,
        l.resourceId,
        `"${l.detail.replace(/"/g, '""')}"`,
        l.userEmail,
      ]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportScPwdCSV() {
    const rows = [
      ['Date', 'Discount Type', 'ID Number', 'Discount %', 'Discount Amount', 'Invoice ID'],
      ...scPwdLogs.map(l => [
        formatDate(l.createdAt),
        l.discountType,
        l.idNumber,
        l.discountPct,
        l.discountAmount.toFixed(2),
        l.invoiceId,
      ]),
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scpwd-audit-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 pb-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Compliance</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{clinicName}</p>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 gap-3">

        <div className={`rounded-2xl border p-4 space-y-1 ${tosAcceptedAt ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-1.5">
            {tosAcceptedAt
              ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              : <AlertTriangle className="w-4 h-4 text-amber-600" />
            }
            <span className={`text-xs font-semibold ${tosAcceptedAt ? 'text-emerald-700' : 'text-amber-700'}`}>
              DPA Agreement
            </span>
          </div>
          <p className={`text-xs ${tosAcceptedAt ? 'text-emerald-600' : 'text-amber-600'}`}>
            {tosAcceptedAt ? `Signed ${formatDateShort(tosAcceptedAt)}` : 'Not yet accepted'}
          </p>
        </div>

        <div className={`rounded-2xl border p-4 space-y-1 ${npcWarning ? 'bg-amber-50 border-amber-200' : 'bg-muted/30'}`}>
          <div className="flex items-center gap-1.5">
            <Users className={`w-4 h-4 ${npcWarning ? 'text-amber-600' : 'text-muted-foreground'}`} />
            <span className={`text-xs font-semibold ${npcWarning ? 'text-amber-700' : 'text-muted-foreground'}`}>
              Patient Records
            </span>
          </div>
          <p className={`text-xs ${npcWarning ? 'text-amber-600' : 'text-muted-foreground'}`}>
            {patientCount.toLocaleString()} patients
            {npcWarning && ' — NPC registration required at 1,000'}
          </p>
        </div>

      </div>

      {/* NPC registration banner */}
      {npcWarning && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-800">NPC Registration Required</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Your clinic has processed Sensitive Personal Information (SPI) for{' '}
              {patientCount >= 1000 ? 'over 1,000' : 'nearly 1,000'} individuals.
              Under NPC Circular 2022-04, clinics must register with the National Privacy Commission
              when they process SPI of 1,000 or more data subjects.
              Register at{' '}
              <a href="https://www.privacy.gov.ph" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                privacy.gov.ph
              </a>.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/40 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'audit' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
          }`}
        >
          <Shield className="w-4 h-4" />
          Audit Log
        </button>
        <button
          onClick={() => setActiveTab('scpwd')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'scpwd' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
          }`}
        >
          <FileText className="w-4 h-4" />
          SC / PWD Log
        </button>
      </div>

      {/* Audit log tab */}
      {activeTab === 'audit' && (
        <div className="space-y-3">

          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search logs…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="rounded-xl border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="ALL">All actions</option>
              {ALL_ACTIONS.map(a => (
                <option key={a} value={a}>{ACTION_LABELS[a]}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{filteredLogs.length} entries</p>
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 h-8 text-xs">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
          </div>

          {/* Log list */}
          <div className="space-y-2">
            {filteredLogs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No matching entries</p>
            )}
            {filteredLogs.map(log => (
              <div key={log.id} className="rounded-2xl border bg-background px-4 py-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-medium">
                    {ACTION_LABELS[log.action] ?? log.action}
                  </span>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {formatDate(log.createdAt)}
                  </span>
                </div>
                {log.detail && (
                  <p className="text-xs text-muted-foreground">{log.detail}</p>
                )}
                <p className="text-[11px] text-muted-foreground/60">{log.userEmail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SC/PWD tab */}
      {activeTab === 'scpwd' && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
            Immutable records of every Senior Citizen and PWD discount applied, as required by
            RA 9994 and RA 10754. These records cannot be edited or deleted.
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{scPwdLogs.length} records</p>
            <Button variant="outline" size="sm" onClick={exportScPwdCSV} className="gap-1.5 h-8 text-xs">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
          </div>

          <div className="space-y-2">
            {scPwdLogs.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No SC/PWD discounts recorded yet</p>
            )}
            {scPwdLogs.map(log => (
              <div key={log.id} className="rounded-2xl border bg-background px-4 py-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    log.discountType === 'SC' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {log.discountType === 'SC' ? 'Senior Citizen' : 'PWD'}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{formatDate(log.createdAt)}</span>
                </div>
                <p className="text-sm font-medium">
                  {log.discountPct}% discount — ₱{log.discountAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })} saved
                </p>
                <p className="text-xs text-muted-foreground">ID: {log.idNumber}</p>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
