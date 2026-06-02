'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Download, Search, AlertTriangle, CheckCircle2, FileText, Users, Siren, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createIncident, updateIncident, type IncidentRow, type IncidentType, type IncidentSeverity } from './actions'
import { INCIDENT_TYPE_LABELS, breachClock } from '@/lib/incidents'

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
  incidents: IncidentRow[]
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
  incidents,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('ALL')
  const [activeTab, setActiveTab] = useState<'audit' | 'scpwd' | 'incidents'>('audit')

  const npcWarning = patientCount >= 800

  // Open breaches not yet reported to the NPC — drives the 72h alert.
  const unreportedBreaches = incidents.filter(i => !i.reportedToNpc)
  const breachAlert = unreportedBreaches.length > 0

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

  // ── Incident logging ──────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10)
  const [showIncidentForm, setShowIncidentForm] = useState(false)
  const [incForm, setIncForm] = useState({
    incidentDate: today,
    discoveryDate: today,
    type: 'UNAUTHORIZED_ACCESS' as IncidentType,
    severity: 'MEDIUM' as IncidentSeverity,
    description: '',
    natureOfData: '',
    individualsAffected: 0,
    measuresTaken: '',
  })

  function submitIncident() {
    if (!incForm.description.trim()) { toast.error('Describe what happened.'); return }
    startTransition(async () => {
      try {
        await createIncident(incForm)
        toast.success('Incident logged')
        setShowIncidentForm(false)
        setIncForm({ ...incForm, description: '', natureOfData: '', measuresTaken: '', individualsAffected: 0 })
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to log incident')
      }
    })
  }

  function markReportedToNpc(id: string) {
    startTransition(async () => {
      try {
        await updateIncident({ id, reportedToNpc: true })
        toast.success('Marked reported to NPC')
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Update failed')
      }
    })
  }

  // ── ASIR (Annual Security Incident Report) ────────────────────────────────
  const incidentYears = Array.from(new Set(incidents.map(i => new Date(i.discoveryDate).getFullYear())))
  const defaultAsirYear = new Date().getFullYear() - 1 // ASIR covers the PRIOR calendar year
  const [asirYear, setAsirYear] = useState<number>(defaultAsirYear)
  const asirYearOptions = Array.from(new Set([defaultAsirYear, new Date().getFullYear(), ...incidentYears])).sort((a, b) => b - a)

  const asir = useMemo(() => {
    const inYear = incidents.filter(i => new Date(i.discoveryDate).getFullYear() === asirYear)
    const byType: Record<string, number> = {}
    for (const i of inYear) byType[i.type] = (byType[i.type] ?? 0) + 1
    return {
      incidents: inYear,
      total: inYear.length,
      reported: inYear.filter(i => i.reportedToNpc).length,
      individualsAffected: inYear.reduce((s, i) => s + i.individualsAffected, 0),
      byType,
    }
  }, [incidents, asirYear])

  function exportAsirCSV() {
    const header = [
      `Annual Security Incident Report (ASIR) — ${asirYear}`,
      `Clinic: ${clinicName}`,
      `Generated: ${new Date().toLocaleString('en-PH')}`,
      `Total incidents: ${asir.total} | Reported to NPC: ${asir.reported} | Individuals affected: ${asir.individualsAffected}`,
      'NPC deadline: March 31, ' + (asirYear + 1) + ' (submit via the NPC DBNMS).',
      '',
    ]
    const rows = [
      ['Discovery Date', 'Incident Date', 'Type', 'Severity', 'Individuals Affected', 'Reported to NPC', 'NPC Report Date', 'Subjects Notified', 'Status', 'Description', 'Measures Taken'],
      ...asir.incidents.map(i => [
        formatDateShort(i.discoveryDate),
        formatDateShort(i.incidentDate),
        INCIDENT_TYPE_LABELS[i.type] ?? i.type,
        i.severity,
        String(i.individualsAffected),
        i.reportedToNpc ? 'Yes' : 'No',
        i.npcReportDate ? formatDateShort(i.npcReportDate) : '',
        i.reportedToSubjects ? 'Yes' : 'No',
        i.status,
        i.description,
        i.measuresTaken ?? '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`)),
    ]
    const csv = [...header.map(h => `"${h.replace(/"/g, '""')}"`), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ASIR-${asirYear}-${clinicName.replace(/\s+/g, '-')}.csv`
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

      {/* 72-hour breach alert */}
      {breachAlert && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex gap-3">
          <Siren className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-red-800">
              {unreportedBreaches.length} unreported incident{unreportedBreaches.length !== 1 ? 's' : ''} — 72-hour NPC clock running
            </p>
            <p className="text-xs text-red-700 leading-relaxed">
              RA 10173 requires notifying the NPC and affected patients within 72 hours of discovery.
              Review the Incidents tab, take action, then mark each as reported.
            </p>
            <button onClick={() => setActiveTab('incidents')} className="text-xs font-medium text-red-800 underline">
              Go to Incidents →
            </button>
          </div>
        </div>
      )}

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
        <button
          onClick={() => setActiveTab('incidents')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'incidents' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
          }`}
        >
          <Siren className="w-4 h-4" />
          Incidents
          {breachAlert && <span className="ml-1 w-2 h-2 rounded-full bg-red-500" />}
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

      {/* Incidents tab */}
      {activeTab === 'incidents' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700 leading-relaxed">
            Security incident &amp; data-breach register (RA 10173). Log any suspected or actual breach.
            The NPC and affected patients must be notified within <strong>72 hours of discovery</strong>.
            Use the ASIR section below to generate your Annual Security Incident Report (due March 31).
          </div>

          {/* Log incident toggle */}
          {!showIncidentForm && (
            <Button onClick={() => setShowIncidentForm(true)} className="w-full gap-1.5">
              <Siren className="w-4 h-4" /> Log a security incident
            </Button>
          )}

          {/* Log incident form */}
          {showIncidentForm && (
            <div className="rounded-2xl border bg-background p-4 space-y-3">
              <h2 className="text-sm font-semibold">Log security incident</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Incident date</label>
                  <input type="date" value={incForm.incidentDate} onChange={e => setIncForm({ ...incForm, incidentDate: e.target.value })} className="w-full mt-1 rounded-xl border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Discovery date (starts 72h)</label>
                  <input type="date" value={incForm.discoveryDate} onChange={e => setIncForm({ ...incForm, discoveryDate: e.target.value })} className="w-full mt-1 rounded-xl border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Type</label>
                  <select value={incForm.type} onChange={e => setIncForm({ ...incForm, type: e.target.value as IncidentType })} className="w-full mt-1 rounded-xl border bg-background px-3 py-2 text-sm">
                    {Object.entries(INCIDENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Severity</label>
                  <select value={incForm.severity} onChange={e => setIncForm({ ...incForm, severity: e.target.value as IncidentSeverity })} className="w-full mt-1 rounded-xl border bg-background px-3 py-2 text-sm">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">What happened? *</label>
                <textarea value={incForm.description} onChange={e => setIncForm({ ...incForm, description: e.target.value })} rows={3} className="w-full mt-1 rounded-xl border bg-background px-3 py-2 text-sm resize-none" placeholder="Describe the incident…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Individuals affected</label>
                  <input type="number" min={0} value={incForm.individualsAffected} onChange={e => setIncForm({ ...incForm, individualsAffected: Number(e.target.value) })} className="w-full mt-1 rounded-xl border bg-background px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Nature of data</label>
                  <input value={incForm.natureOfData} onChange={e => setIncForm({ ...incForm, natureOfData: e.target.value })} className="w-full mt-1 rounded-xl border bg-background px-3 py-2 text-sm" placeholder="e.g. names, medical history" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Measures taken</label>
                <textarea value={incForm.measuresTaken} onChange={e => setIncForm({ ...incForm, measuresTaken: e.target.value })} rows={2} className="w-full mt-1 rounded-xl border bg-background px-3 py-2 text-sm resize-none" placeholder="Containment / remediation steps…" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowIncidentForm(false)} disabled={isPending}>Cancel</Button>
                <Button className="flex-1" onClick={submitIncident} disabled={isPending}>{isPending ? 'Saving…' : 'Log incident'}</Button>
              </div>
            </div>
          )}

          {/* Incident list */}
          <div className="space-y-2">
            {incidents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No incidents logged. That&apos;s good — but log any breach the moment you discover it.</p>
            )}
            {incidents.map(i => {
              const clock = breachClock(i.discoveryDate)
              return (
                <div key={i.id} className="rounded-2xl border bg-background px-4 py-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium">{INCIDENT_TYPE_LABELS[i.type] ?? i.type}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      i.severity === 'HIGH' ? 'bg-red-100 text-red-700' : i.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
                    }`}>{i.severity}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{i.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                    <span>Discovered {formatDateShort(i.discoveryDate)}</span>
                    <span>{i.individualsAffected} affected</span>
                    <span>Status: {i.status}</span>
                  </div>
                  {/* 72h clock / NPC status */}
                  {i.reportedToNpc ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Reported to NPC{i.npcReportDate ? ` ${formatDateShort(i.npcReportDate)}` : ''}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <div className={`flex items-center gap-1.5 text-[11px] font-medium ${clock.overdue ? 'text-red-700' : 'text-amber-700'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        {clock.overdue
                          ? `NPC deadline passed ${Math.abs(clock.hoursLeft)}h ago`
                          : `${clock.hoursLeft}h left to notify NPC`}
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => markReportedToNpc(i.id)} disabled={isPending}>
                        Mark reported
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ASIR */}
          <div className="rounded-2xl border bg-muted/30 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Annual Security Incident Report (ASIR)</h2>
              <select value={asirYear} onChange={e => setAsirYear(Number(e.target.value))} className="rounded-lg border bg-background px-2 py-1 text-xs">
                {asirYearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Covers incidents discovered in {asirYear}. Due to the NPC by <strong>March 31, {asirYear + 1}</strong> via the DBNMS — required even if you had zero incidents.
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-background border p-2">
                <p className="text-lg font-bold">{asir.total}</p>
                <p className="text-[10px] text-muted-foreground">Incidents</p>
              </div>
              <div className="rounded-xl bg-background border p-2">
                <p className="text-lg font-bold">{asir.reported}</p>
                <p className="text-[10px] text-muted-foreground">Reported to NPC</p>
              </div>
              <div className="rounded-xl bg-background border p-2">
                <p className="text-lg font-bold">{asir.individualsAffected}</p>
                <p className="text-[10px] text-muted-foreground">Individuals</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={exportAsirCSV} className="w-full gap-1.5 h-8 text-xs">
              <Download className="w-3.5 h-3.5" /> Download ASIR {asirYear} (CSV)
            </Button>
          </div>
        </div>
      )}

    </div>
  )
}
