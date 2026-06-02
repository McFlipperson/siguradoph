'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Siren, Clock, CheckCircle2, Download } from 'lucide-react'
import { INCIDENT_TYPE_LABELS, breachClock } from '@/lib/incidents'
import { createPlatformIncident, updatePlatformIncident } from './actions'

type Incident = {
  id: string
  incidentDate: string
  discoveryDate: string
  type: string
  severity: string
  description: string
  natureOfData: string | null
  clinicsAffected: number
  individualsAffected: number
  measuresTaken: string | null
  reportedToNpc: boolean
  npcReportDate: string | null
  reportedToSubjects: boolean
  status: string
  createdBy: string
  createdAt: string
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function PlatformIncidentsClient({ incidents }: { incidents: Incident[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const today = new Date().toISOString().slice(0, 10)
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({
    incidentDate: today,
    discoveryDate: today,
    type: 'SYSTEM_BREACH',
    severity: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    description: '',
    natureOfData: '',
    clinicsAffected: 0,
    individualsAffected: 0,
    measuresTaken: '',
  })

  const unreported = incidents.filter((i) => !i.reportedToNpc)

  function submit() {
    if (!form.description.trim()) { alert('Describe what happened.'); return }
    startTransition(async () => {
      try {
        await createPlatformIncident(form)
        setShow(false)
        setForm({ ...form, description: '', natureOfData: '', measuresTaken: '', clinicsAffected: 0, individualsAffected: 0 })
        router.refresh()
      } catch { alert('Failed to log incident') }
    })
  }

  function markReported(id: string) {
    startTransition(async () => {
      try { await updatePlatformIncident({ id, reportedToNpc: true }); router.refresh() }
      catch { alert('Update failed') }
    })
  }

  // ASIR — Sigurado's own annual report
  const defaultYear = new Date().getFullYear() - 1
  const [year, setYear] = useState(defaultYear)
  const years = Array.from(new Set([defaultYear, new Date().getFullYear(), ...incidents.map((i) => new Date(i.discoveryDate).getFullYear())])).sort((a, b) => b - a)
  const asir = useMemo(() => {
    const inY = incidents.filter((i) => new Date(i.discoveryDate).getFullYear() === year)
    return {
      rows: inY,
      total: inY.length,
      reported: inY.filter((i) => i.reportedToNpc).length,
      clinics: inY.reduce((s, i) => s + i.clinicsAffected, 0),
      individuals: inY.reduce((s, i) => s + i.individualsAffected, 0),
    }
  }, [incidents, year])

  function exportAsir() {
    const head = [
      `Sigurado (AI Matters) — Annual Security Incident Report ${year}`,
      `Role: Personal Information Processor (PIP)`,
      `Generated: ${new Date().toLocaleString('en-PH')}`,
      `Incidents: ${asir.total} | Reported to NPC: ${asir.reported} | Clinics affected: ${asir.clinics} | Individuals: ${asir.individuals}`,
      `NPC deadline: March 31, ${year + 1} (DBNMS). Required even with zero incidents.`,
      '',
    ]
    const rows = [
      ['Discovery', 'Incident', 'Type', 'Severity', 'Clinics', 'Individuals', 'Reported to NPC', 'NPC Date', 'Status', 'Description', 'Measures'],
      ...asir.rows.map((i) => [
        fmt(i.discoveryDate), fmt(i.incidentDate), INCIDENT_TYPE_LABELS[i.type] ?? i.type, i.severity,
        String(i.clinicsAffected), String(i.individualsAffected), i.reportedToNpc ? 'Yes' : 'No',
        i.npcReportDate ? fmt(i.npcReportDate) : '', i.status, i.description, i.measuresTaken ?? '',
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`)),
    ]
    const csv = [...head.map((h) => `"${h.replace(/"/g, '""')}"`), ...rows.map((r) => r.join(','))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url; a.download = `Sigurado-ASIR-${year}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-8 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Sigurado DPO — Incident Register</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sigurado&apos;s own breaches as Personal Information Processor. Separate from each clinic&apos;s log.
          </p>
        </div>
        <Link href="/admin" className="text-sm text-primary underline shrink-0">← Plans</Link>
      </div>

      {unreported.length > 0 && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex gap-3">
          <Siren className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">
            {unreported.length} unreported incident{unreported.length !== 1 ? 's' : ''} — the 72-hour NPC clock is running.
            Notify the NPC and affected clinics, then mark reported.
          </p>
        </div>
      )}

      {!show ? (
        <button onClick={() => setShow(true)} className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2">
          <Siren className="w-4 h-4" /> Log a platform incident
        </button>
      ) : (
        <div className="rounded-2xl border bg-background p-4 space-y-3">
          <h2 className="text-sm font-semibold">Log platform incident</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-muted-foreground">Incident date
              <input type="date" value={form.incidentDate} onChange={(e) => setForm({ ...form, incidentDate: e.target.value })} className="w-full mt-1 rounded-xl border bg-background px-3 py-2 text-sm" /></label>
            <label className="text-xs font-medium text-muted-foreground">Discovery date (starts 72h)
              <input type="date" value={form.discoveryDate} onChange={(e) => setForm({ ...form, discoveryDate: e.target.value })} className="w-full mt-1 rounded-xl border bg-background px-3 py-2 text-sm" /></label>
            <label className="text-xs font-medium text-muted-foreground">Type
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full mt-1 rounded-xl border bg-background px-3 py-2 text-sm">
                {Object.entries(INCIDENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></label>
            <label className="text-xs font-medium text-muted-foreground">Severity
              <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' })} className="w-full mt-1 rounded-xl border bg-background px-3 py-2 text-sm">
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option>
              </select></label>
          </div>
          <label className="text-xs font-medium text-muted-foreground block">What happened? *
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full mt-1 rounded-xl border bg-background px-3 py-2 text-sm resize-none" /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs font-medium text-muted-foreground">Clinics affected
              <input type="number" min={0} value={form.clinicsAffected} onChange={(e) => setForm({ ...form, clinicsAffected: Number(e.target.value) })} className="w-full mt-1 rounded-xl border bg-background px-3 py-2 text-sm" /></label>
            <label className="text-xs font-medium text-muted-foreground">Individuals affected
              <input type="number" min={0} value={form.individualsAffected} onChange={(e) => setForm({ ...form, individualsAffected: Number(e.target.value) })} className="w-full mt-1 rounded-xl border bg-background px-3 py-2 text-sm" /></label>
          </div>
          <label className="text-xs font-medium text-muted-foreground block">Measures taken
            <textarea value={form.measuresTaken} onChange={(e) => setForm({ ...form, measuresTaken: e.target.value })} rows={2} className="w-full mt-1 rounded-xl border bg-background px-3 py-2 text-sm resize-none" /></label>
          <div className="flex gap-2">
            <button onClick={() => setShow(false)} disabled={isPending} className="flex-1 min-h-[44px] rounded-xl border text-sm font-medium">Cancel</button>
            <button onClick={submit} disabled={isPending} className="flex-1 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-sm font-medium">{isPending ? 'Saving…' : 'Log incident'}</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {incidents.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No platform incidents logged.</p>}
        {incidents.map((i) => {
          const clock = breachClock(i.discoveryDate)
          return (
            <div key={i.id} className="rounded-2xl border bg-background px-4 py-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium">{INCIDENT_TYPE_LABELS[i.type] ?? i.type}</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${i.severity === 'HIGH' ? 'bg-red-100 text-red-700' : i.severity === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'}`}>{i.severity}</span>
              </div>
              <p className="text-xs text-muted-foreground">{i.description}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                <span>Discovered {fmt(i.discoveryDate)}</span>
                <span>{i.clinicsAffected} clinic(s)</span>
                <span>{i.individualsAffected} individual(s)</span>
                <span>Status: {i.status}</span>
              </div>
              {i.reportedToNpc ? (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700"><CheckCircle2 className="w-3.5 h-3.5" />Reported to NPC{i.npcReportDate ? ` ${fmt(i.npcReportDate)}` : ''}</div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className={`flex items-center gap-1.5 text-[11px] font-medium ${clock.overdue ? 'text-red-700' : 'text-amber-700'}`}>
                    <Clock className="w-3.5 h-3.5" />{clock.overdue ? `Deadline passed ${Math.abs(clock.hoursLeft)}h ago` : `${clock.hoursLeft}h left to notify NPC`}
                  </div>
                  <button onClick={() => markReported(i.id)} disabled={isPending} className="h-7 px-2 rounded-lg border text-[11px] font-medium">Mark reported</button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Sigurado ASIR */}
      <div className="rounded-2xl border bg-muted/30 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Sigurado Annual Security Incident Report</h2>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="rounded-lg border bg-background px-2 py-1 text-xs">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">Sigurado&apos;s own ASIR as a processor, covering {year}. Due to the NPC by <strong>March 31, {year + 1}</strong> — required even with zero incidents.</p>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[['Incidents', asir.total], ['Reported', asir.reported], ['Clinics', asir.clinics], ['Individuals', asir.individuals]].map(([l, n]) => (
            <div key={l} className="rounded-xl bg-background border p-2"><p className="text-lg font-bold">{n}</p><p className="text-[10px] text-muted-foreground">{l}</p></div>
          ))}
        </div>
        <button onClick={exportAsir} className="w-full min-h-[40px] rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5"><Download className="w-3.5 h-3.5" /> Download Sigurado ASIR {year} (CSV)</button>
      </div>
    </div>
  )
}
