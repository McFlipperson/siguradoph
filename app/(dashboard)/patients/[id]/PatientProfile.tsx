'use client'

import { useState, useTransition, useRef } from 'react'
import QRCode from 'react-qr-code'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { updatePatientMedical, updatePatientInfo, issueLoyaltyCard, updatePatientScPwd, deletePatient, anonymizePatient, startMessengerLink, cancelMessengerLink, checkMessengerLink } from '../actions'
import { voidVisit, updateVisit } from '../../visits/actions'
import type { FullPatient } from '../actions'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

function computeAge(dob: Date): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatDateShort(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}

const LOYALTY_SERVICES = [
  { key: 'cleaningUses50', label: 'Cleaning (50% off)' },
  { key: 'cleaningUses25', label: 'Cleaning (25% off)' },
  { key: 'fillingUses50', label: 'Filling (50% off)' },
  { key: 'fillingUses25', label: 'Filling (25% off)' },
  { key: 'rctUses', label: 'Root Canal' },
  { key: 'dentureUses', label: 'Denture' },
  { key: 'bracesUses', label: 'Braces' },
  { key: 'wisdomToothUses', label: 'Wisdom Tooth' },
  { key: 'extractionUses', label: 'Extraction' },
] as const

type CardKey = (typeof LOYALTY_SERVICES)[number]['key']

function SectionCard({
  emoji, title, color, children, collapsible = false,
}: {
  emoji: string
  title: string
  color: 'teal' | 'amber' | 'emerald' | 'blue'
  children: React.ReactNode
  collapsible?: boolean
}) {
  const [open, setOpen] = useState(!collapsible)
  const headerColors = {
    teal:    'bg-teal-50 border-teal-200 text-teal-800',
    amber:   'bg-amber-50 border-amber-200 text-amber-800',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    blue:    'bg-blue-50 border-blue-200 text-blue-800',
  }
  return (
    <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        disabled={!collapsible}
        onClick={() => collapsible && setOpen(v => !v)}
        className={`w-full flex items-center justify-between px-4 py-3 border-b ${headerColors[color]} ${collapsible ? 'cursor-pointer' : 'cursor-default'}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <span className="text-base font-black">{title}</span>
        </div>
        {collapsible && <span className="text-sm font-bold opacity-60">{open ? '▲' : '▼'}</span>}
      </button>
      {open && <div className="px-4 py-4">{children}</div>}
    </div>
  )
}

// ── Medical Section ──────────────────────────────────────────────────────────
function MedicalSection({ patient }: { patient: FullPatient }) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [medicalHistory, setMedicalHistory] = useState(patient.medicalHistory ?? '')
  const [medications, setMedications] = useState(patient.medications ?? '')
  const [allergies, setAllergies] = useState(patient.allergies ?? '')

  const textareaClass = 'w-full rounded-xl border border-input bg-background px-4 py-3 text-base outline-none focus:ring-2 focus:ring-ring resize-none'

  function handleSave() {
    startTransition(async () => {
      await updatePatientMedical(patient.id, { medicalHistory, medications, allergies })
      setEditing(false)
    })
  }

  return (
    <SectionCard emoji="🩺" title="Medical Background" color="teal" collapsible>
      {editing ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-muted-foreground">Medical History</label>
            <textarea className={textareaClass} rows={3} value={medicalHistory} onChange={e => setMedicalHistory(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-muted-foreground">Medications</label>
            <textarea className={textareaClass} rows={3} value={medications} onChange={e => setMedications(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-muted-foreground">Allergies</label>
            <textarea className={textareaClass} rows={2} value={allergies} onChange={e => setAllergies(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isPending} className="flex-1 min-h-[52px]">{isPending ? 'Saving…' : 'Save'}</Button>
            <Button variant="outline" onClick={() => setEditing(false)} disabled={isPending} className="flex-1 min-h-[52px]">Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {[
            { label: 'Medical History', value: medicalHistory },
            { label: 'Medications', value: medications },
            { label: 'Allergies', value: allergies },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-sm font-semibold text-muted-foreground mb-0.5">{label}</p>
              <p className="text-base">{value || 'None'}</p>
            </div>
          ))}
          <Button variant="outline" onClick={() => setEditing(true)} className="min-h-[52px] text-base">Edit</Button>
        </div>
      )}
    </SectionCard>
  )
}

// ── Loyalty Section ──────────────────────────────────────────────────────────
function LoyaltySection({ patient }: { patient: FullPatient }) {
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()
  const card = patient.loyaltyCards[0] ?? null

  const isExpired = card ? new Date(card.expiryDate) < new Date() : false
  const allExhausted = card && !isExpired && LOYALTY_SERVICES.every(s => card[s.key as CardKey] === 0)
  const needsNew = !card || isExpired || allExhausted
  const action = !card ? 'Issue' : 'Renew'

  function handleIssue() {
    startTransition(async () => {
      await issueLoyaltyCard(patient.id)
      setShowConfirm(false)
      router.refresh()
    })
  }

  return (
    <SectionCard emoji="💳" title="Loyalty Card" color="emerald">
      {!card ? (
        <div className="flex flex-col gap-3">
          <p className="text-base text-muted-foreground">No loyalty card issued yet.</p>
          {showConfirm ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
              <p className="text-base font-medium">Issue a loyalty card for {patient.firstName}? This will charge ₱500 and generate a receipt.</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isPending} className="min-h-[52px]">Cancel</Button>
                <Button onClick={handleIssue} disabled={isPending} className="min-h-[52px] bg-emerald-600 hover:bg-emerald-700">{isPending ? 'Issuing…' : 'Confirm ₱500'}</Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowConfirm(true)} className="w-full min-h-[52px] bg-emerald-600 hover:bg-emerald-700 text-base">Issue Card (₱500)</Button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Card Number</p>
              <p className="font-mono text-base font-bold">{card.cardNumber}</p>
            </div>
            <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${isExpired ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {isExpired ? 'Expired' : 'Active'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Expires: {formatDate(card.expiryDate)}</p>

          <div className="rounded-xl bg-emerald-50 border border-emerald-100 overflow-hidden">
            <p className="text-xs font-black text-emerald-700 uppercase tracking-wide px-4 pt-3 pb-1">Remaining Uses</p>
            {LOYALTY_SERVICES.map((s, i) => (
              <div key={s.key} className={`flex items-center justify-between px-4 py-2 ${i < LOYALTY_SERVICES.length - 1 ? 'border-b border-emerald-100' : ''}`}>
                <span className="text-base">{s.label}</span>
                <span className={`text-base font-black tabular-nums ${card[s.key as CardKey] === 0 ? 'text-muted-foreground line-through' : 'text-emerald-700'}`}>
                  {card[s.key as CardKey]}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-2 border-t border-emerald-100">
              <span className="text-base">Check-up</span>
              <span className="text-base font-black text-emerald-700">∞</span>
            </div>
          </div>

          {needsNew && (showConfirm ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
              <p className="text-base font-medium">{action} a loyalty card for {patient.firstName}? This will charge ₱500 and generate a receipt.</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isPending} className="min-h-[52px]">Cancel</Button>
                <Button onClick={handleIssue} disabled={isPending} className="min-h-[52px] bg-emerald-600 hover:bg-emerald-700">{isPending ? `${action}ing…` : 'Confirm ₱500'}</Button>
              </div>
            </div>
          ) : (
            <Button onClick={() => setShowConfirm(true)} className="w-full min-h-[52px] bg-emerald-600 hover:bg-emerald-700 text-base">{action} Card (₱500)</Button>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

// ── SC/PWD Section ────────────────────────────────────────────────────────────
const PWD_DISABILITY_LABELS: Record<string, string> = {
  VISUAL: 'Visual Impairment', HEARING: 'Hearing Impairment', SPEECH: 'Speech Impairment',
  PHYSICAL: 'Physical Disability', INTELLECTUAL: 'Intellectual Disability',
  PSYCHOSOCIAL: 'Psychosocial Disability', LEARNING: 'Learning Disability', MENTAL: 'Mental Health Condition',
}

function ScPwdSection({ patient }: { patient: FullPatient }) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [isSc, setIsSc] = useState(patient.isSeniorCitizen)
  const [scId, setScId] = useState(patient.scIdNumber ?? '')
  const [isPwd, setIsPwd] = useState(patient.isPwd)
  const [pwdId, setPwdId] = useState(patient.pwdIdNumber ?? '')
  const [pwdType, setPwdType] = useState(patient.pwdDisabilityType ?? '')

  function handleSave() {
    startTransition(async () => {
      await updatePatientScPwd(patient.id, { isSeniorCitizen: isSc, scIdNumber: scId, isPwd, pwdIdNumber: pwdId, pwdDisabilityType: pwdType })
      setEditing(false)
      router.refresh()
    })
  }

  return (
    <SectionCard emoji="🏛️" title="Gov't Discount Status" color="amber" collapsible>
      {editing ? (
        <div className="flex flex-col gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="scToggle" className="flex-1 font-semibold text-base">Senior Citizen (RA 9994)</Label>
              <Switch id="scToggle" checked={isSc} onCheckedChange={setIsSc} className="shrink-0" />
            </div>
            {isSc && (
              <div className="space-y-1 pl-2">
                <Label htmlFor="scIdInput" className="text-sm text-muted-foreground">SC ID Number</Label>
                <Input id="scIdInput" value={scId} onChange={e => setScId(e.target.value)} placeholder="Senior Citizen ID number" className="min-h-[52px] text-base" />
              </div>
            )}
          </div>
          <div className="space-y-3 border-t pt-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="pwdToggle" className="flex-1 font-semibold text-base">Person with Disability (RA 10754)</Label>
              <Switch id="pwdToggle" checked={isPwd} onCheckedChange={setIsPwd} className="shrink-0" />
            </div>
            {isPwd && (
              <div className="space-y-2 pl-2">
                <div>
                  <Label htmlFor="pwdIdInput" className="text-sm text-muted-foreground">PWD ID Number</Label>
                  <Input id="pwdIdInput" value={pwdId} onChange={e => setPwdId(e.target.value)} placeholder="PWD ID number" className="min-h-[52px] text-base mt-1" />
                </div>
                <div>
                  <Label htmlFor="pwdTypeSelect" className="text-sm text-muted-foreground">Disability Type</Label>
                  <select id="pwdTypeSelect" value={pwdType} onChange={e => setPwdType(e.target.value)}
                    className="w-full min-h-[52px] rounded-xl border border-input bg-background px-4 text-base mt-1">
                    <option value="">Select type…</option>
                    {Object.entries(PWD_DISABILITY_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <Button onClick={handleSave} disabled={isPending} className="flex-1 min-h-[52px]">{isPending ? 'Saving…' : 'Save'}</Button>
            <Button variant="outline" onClick={() => setEditing(false)} disabled={isPending} className="flex-1 min-h-[52px]">Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between py-2 border-b border-amber-100">
            <span className="text-base font-medium">Senior Citizen</span>
            <div className="flex items-center gap-2">
              {patient.isSeniorCitizen ? (
                <>
                  <span className="text-base font-bold text-amber-700">Yes</span>
                  {patient.scIdNumber && <span className="text-sm text-muted-foreground font-mono">#{patient.scIdNumber}</span>}
                </>
              ) : <span className="text-base text-muted-foreground">No</span>}
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-base font-medium">PWD</span>
            <div className="flex items-center gap-2">
              {patient.isPwd ? (
                <>
                  <span className="text-base font-bold text-amber-700">Yes</span>
                  {patient.pwdDisabilityType && <span className="text-sm text-muted-foreground">{PWD_DISABILITY_LABELS[patient.pwdDisabilityType] ?? patient.pwdDisabilityType}</span>}
                  {patient.pwdIdNumber && <span className="text-sm text-muted-foreground font-mono">#{patient.pwdIdNumber}</span>}
                </>
              ) : <span className="text-base text-muted-foreground">No</span>}
            </div>
          </div>
          <Button variant="outline" onClick={() => setEditing(true)} className="min-h-[52px] text-base">Edit</Button>
        </div>
      )}
    </SectionCard>
  )
}

// ── Visit Card ────────────────────────────────────────────────────────────────
function VisitCard({ visit, index }: { visit: FullPatient['visits'][number]; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const [showVoidConfirm, setShowVoidConfirm] = useState(false)
  const [voiding, setVoiding] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const isVoid = visit.status === 'VOID'
  const hasInvoice = !!visit.invoice

  const [editTreatment, setEditTreatment] = useState(visit.treatment)
  const [editDiagnosis, setEditDiagnosis] = useState(visit.diagnosis)
  const [editTooth, setEditTooth] = useState(visit.toothNumber ?? '')
  const [editNotes, setEditNotes] = useState(visit.notes ?? '')
  const [editAmount, setEditAmount] = useState(String(visit.grossAmount))
  const [editDate, setEditDate] = useState(() => {
    const d = new Date(visit.visitDate)
    const pht = new Date(d.getTime() + 8 * 60 * 60 * 1000)
    return pht.toISOString().slice(0, 16)
  })

  async function handleVoid() {
    setVoiding(true)
    try { await voidVisit(visit.id); router.refresh() }
    finally { setVoiding(false); setShowVoidConfirm(false) }
  }

  function openEdit(e: React.MouseEvent) {
    e.stopPropagation()
    setEditTreatment(visit.treatment); setEditDiagnosis(visit.diagnosis)
    setEditTooth(visit.toothNumber ?? ''); setEditNotes(visit.notes ?? '')
    setEditAmount(String(visit.grossAmount)); setEditing(true); setExpanded(true)
  }

  async function handleSave() {
    if (!editTreatment.trim() || !editDiagnosis.trim() || !editNotes.trim()) return
    const grossAmount = parseFloat(editAmount)
    if (!hasInvoice && (!grossAmount || grossAmount <= 0)) return
    setSaving(true)
    try {
      await updateVisit({ visitId: visit.id, treatment: editTreatment, diagnosis: editDiagnosis, toothNumber: editTooth || undefined, notes: editNotes, grossAmount: hasInvoice ? undefined : grossAmount, visitDate: hasInvoice ? undefined : editDate })
      setEditing(false); router.refresh()
    } finally { setSaving(false) }
  }

  const inputCls = 'w-full min-h-[48px] rounded-xl border border-input bg-background px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring'
  const textareaCls = 'w-full rounded-xl border border-input bg-background px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring resize-none'
  const accentColor = isVoid ? 'border-l-red-300' : index === 0 ? 'border-l-blue-500' : 'border-l-border'

  return (
    <div className={`rounded-2xl bg-white border border-border shadow-sm overflow-hidden border-l-4 ${accentColor} ${isVoid ? 'opacity-60' : ''}`}>
      <div onClick={() => !showVoidConfirm && !editing && setExpanded(v => !v)} className="cursor-pointer px-4 py-3 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-base">{visit.treatment}</p>
              {isVoid && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">VOID</span>}
            </div>
            {visit.toothNumber && <p className="text-sm text-muted-foreground">Tooth {visit.toothNumber}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isVoid && !editing && (
              <button type="button" onClick={openEdit} className="text-sm text-primary font-bold underline underline-offset-2 py-1">Edit</button>
            )}
            <p className={`text-base font-black whitespace-nowrap ${isVoid ? 'line-through text-muted-foreground' : 'text-blue-700'}`}>₱{formatMoney(visit.grossAmount)}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{formatDateShort(visit.visitDate)}</p>
        <p className="text-base text-muted-foreground line-clamp-1">{visit.diagnosis}</p>
      </div>

      {expanded && !editing && (
        <div className="border-t border-border px-4 py-3 flex flex-col gap-3">
          {visit.notes && (
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-0.5">Notes</p>
              <p className="text-base">{visit.notes}</p>
            </div>
          )}
          <div className="flex flex-col gap-1 text-base rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
            <div className="flex justify-between font-black text-blue-900">
              <span>Total</span>
              <span>₱{formatMoney(visit.grossAmount)}</span>
            </div>
            <div className="flex justify-between text-sm text-emerald-600">
              <span>VAT-Exempt (NIRC §109)</span>
              <span>₱0.00</span>
            </div>
          </div>
          {visit.invoice?.orNumber && <p className="text-sm text-muted-foreground">OR #{visit.invoice.orNumber}</p>}
          {!isVoid && (showVoidConfirm ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-3">
              <p className="text-base text-red-900 font-medium">Void this visit{visit.invoice ? ` and OR #${visit.invoice.orNumber}` : ''}? This cannot be undone.</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="min-h-[48px]" onClick={() => setShowVoidConfirm(false)} disabled={voiding}>Cancel</Button>
                <Button className="min-h-[48px] bg-red-600 hover:bg-red-700 text-white" onClick={handleVoid} disabled={voiding}>{voiding ? 'Voiding…' : 'Confirm Void'}</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full min-h-[48px] border-red-200 text-red-600 hover:bg-red-50 text-base" onClick={e => { e.stopPropagation(); setShowVoidConfirm(true) }}>Void Visit</Button>
          ))}
        </div>
      )}

      {editing && (
        <div className="border-t border-border px-4 py-4 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
          {hasInvoice && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              OR #{visit.invoice!.orNumber} has been issued — date and amount are locked. You can still correct clinical details.
            </p>
          )}
          {[
            { label: 'Treatment / Procedure', value: editTreatment, set: setEditTreatment, placeholder: 'e.g. Extraction, Cleaning' },
            { label: 'Diagnosis', value: editDiagnosis, set: setEditDiagnosis, placeholder: 'e.g. Dental caries' },
            { label: 'Tooth Number (optional)', value: editTooth, set: setEditTooth, placeholder: 'e.g. 16, 36' },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label} className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-muted-foreground">{label}</label>
              <input className={inputCls} value={value} onChange={e => set(e.target.value)} placeholder={placeholder} />
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-muted-foreground">Notes</label>
            <textarea className={textareaCls} rows={3} value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Treatment notes…" />
          </div>
          {!hasInvoice && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-muted-foreground">Visit Date &amp; Time</label>
                <input type="datetime-local" className={inputCls} value={editDate} onChange={e => setEditDate(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-muted-foreground">Amount (₱)</label>
                <input type="number" inputMode="decimal" min={0} step="0.01" className={inputCls} value={editAmount} onChange={e => setEditAmount(e.target.value)} placeholder="0.00" />
              </div>
            </>
          )}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="outline" className="min-h-[52px]" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
            <Button className="min-h-[52px]" onClick={handleSave} disabled={saving || !editTreatment.trim() || !editDiagnosis.trim() || !editNotes.trim()}>{saving ? 'Saving…' : 'Save Changes'}</Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Messenger Link Section ────────────────────────────────────────────────────
function fbPageHandle(url: string): string | null {
  try { const path = new URL(url).pathname.replace(/^\//, '').replace(/\/$/, ''); return path || null }
  catch { return null }
}

function LinkMessengerSection({ patient, facebookPageUrl, messengerPageId }: { patient: FullPatient; facebookPageUrl: string | null; messengerPageId: string | null }) {
  const router = useRouter()
  const [waiting, setWaiting] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function stopPolling() { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null } }

  async function handleShow() {
    await startMessengerLink(patient.id)
    setWaiting(true)
    pollRef.current = setInterval(async () => {
      const result = await checkMessengerLink(patient.id)
      if (result.linked) { stopPolling(); router.refresh() }
      else if (result.expired) { stopPolling(); setWaiting(false) }
    }, 3000)
  }

  async function handleCancel() { stopPolling(); await cancelMessengerLink(); setWaiting(false) }

  if (patient.messengerPsid) {
    return (
      <div className="rounded-2xl bg-blue-50 border border-blue-200 px-4 py-4 flex items-center gap-3">
        <span className="text-2xl">💬</span>
        <div>
          <p className="text-base font-bold text-blue-900">Messenger linked</p>
          <p className="text-sm text-blue-700">This patient will receive Messenger reminders</p>
        </div>
      </div>
    )
  }

  const pageHandle = messengerPageId || (facebookPageUrl ? fbPageHandle(facebookPageUrl) : null)
  if (!pageHandle) {
    return (
      <div className="rounded-2xl bg-muted/40 border border-border px-4 py-4 flex items-center gap-3">
        <span className="text-2xl">💬</span>
        <div>
          <p className="text-base font-semibold text-muted-foreground">Facebook Page not set up</p>
          <p className="text-sm text-muted-foreground">Add your Messenger Page ID in Settings first.</p>
        </div>
      </div>
    )
  }

  const mmLink = `https://m.me/${pageHandle}?ref=patient_${patient.id}`

  return (
    <div className="rounded-2xl bg-white border border-border shadow-sm overflow-hidden">
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex items-center gap-2">
        <span className="text-xl">💬</span>
        <span className="text-base font-black text-blue-800">Link Messenger</span>
      </div>
      <div className="px-4 py-4 flex flex-col gap-4">
        <p className="text-base text-muted-foreground">
          {waiting ? 'Waiting for patient to scan and send…' : 'Patient scans this QR to connect Messenger reminders.'}
        </p>
        {!waiting ? (
          <Button onClick={handleShow} className="w-full min-h-[52px] text-base">Show QR Code</Button>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-xl border border-border"><QRCode value={mmLink} size={200} /></div>
            <p className="text-sm text-center text-muted-foreground">Patient points camera → opens Messenger → taps Send → done</p>
            <Button variant="outline" onClick={handleCancel} className="w-full min-h-[52px] text-base">Cancel</Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Delete Section ────────────────────────────────────────────────────────────
function DeletePatientSection({ patient }: { patient: FullPatient }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mustAnonymize, setMustAnonymize] = useState(false)

  if (patient.anonymizedAt) {
    return (
      <div className="rounded-2xl border bg-muted/40 p-4">
        <p className="text-base font-bold">Record anonymized</p>
        <p className="text-sm text-muted-foreground mt-0.5">Personal data was erased on {new Date(patient.anonymizedAt).toLocaleDateString('en-PH')} under RA 10173. Financial records are retained for BIR compliance.</p>
      </div>
    )
  }

  async function handleDelete() {
    if (confirmText !== 'DELETE') return
    setDeleting(true); setError(null)
    try {
      const res = await deletePatient(patient.id)
      if (!res.ok && res.reason === 'has_issued_invoices') { setMustAnonymize(true); setConfirmText(''); setDeleting(false); return }
      router.push('/patients')
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to delete patient'); setDeleting(false) }
  }

  async function handleAnonymize() {
    if (confirmText !== 'ANONYMIZE') return
    setDeleting(true); setError(null)
    try { await anonymizePatient(patient.id); router.refresh() }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to anonymize patient'); setDeleting(false) }
  }

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex flex-col gap-3">
      <div>
        <p className="text-base font-black text-red-800">Danger Zone</p>
        <p className="text-sm text-red-700 mt-0.5">Patients with issued receipts can&apos;t be fully deleted (BIR requirement) — you&apos;ll be offered to anonymize instead.</p>
      </div>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="self-start text-base font-bold text-red-700 underline underline-offset-2">Delete this patient…</button>
      ) : mustAnonymize ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-red-800">Type <strong>ANONYMIZE</strong> to erase personal data while keeping receipts for BIR.</p>
          <input type="text" value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="Type ANONYMIZE to confirm"
            className="min-h-[52px] rounded-xl border border-red-300 bg-white px-4 py-2 text-base outline-none focus:ring-2 focus:ring-red-400 w-full" autoCapitalize="characters" />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { setOpen(false); setMustAnonymize(false); setConfirmText(''); setError(null) }} disabled={deleting} className="min-h-[52px] rounded-xl border border-red-200 bg-white text-base font-bold text-red-700">Cancel</button>
            <button type="button" onClick={handleAnonymize} disabled={confirmText !== 'ANONYMIZE' || deleting} className="min-h-[52px] rounded-xl bg-red-600 text-base font-bold text-white disabled:opacity-40">{deleting ? 'Anonymizing…' : 'Anonymize'}</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-red-800">Type <strong>DELETE</strong> to confirm permanent deletion of <strong>{patient.firstName} {patient.lastName}</strong></p>
          <input type="text" value={confirmText} onChange={e => setConfirmText(e.target.value)} placeholder="Type DELETE to confirm"
            className="min-h-[52px] rounded-xl border border-red-300 bg-white px-4 py-2 text-base outline-none focus:ring-2 focus:ring-red-400 w-full" autoCapitalize="characters" />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => { setOpen(false); setConfirmText(''); setError(null) }} disabled={deleting} className="min-h-[52px] rounded-xl border border-red-200 bg-white text-base font-bold text-red-700">Cancel</button>
            <button type="button" onClick={handleDelete} disabled={confirmText !== 'DELETE' || deleting} className="min-h-[52px] rounded-xl bg-red-600 text-base font-bold text-white disabled:opacity-40">{deleting ? 'Deleting…' : 'Delete Forever'}</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Profile Header ────────────────────────────────────────────────────────────
function ProfileHeader({ patient, hasConsent }: { patient: FullPatient; hasConsent: boolean }) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [firstName, setFirstName] = useState(patient.firstName)
  const [middleName, setMiddleName] = useState(patient.middleName ?? '')
  const [lastName, setLastName] = useState(patient.lastName)
  const [dob, setDob] = useState(new Date(patient.dateOfBirth).toISOString().split('T')[0])
  const [phone, setPhone] = useState(patient.phone)
  const [email, setEmail] = useState(patient.email ?? '')
  const [address, setAddress] = useState(patient.address ?? '')
  const [addressLine2, setAddressLine2] = useState(patient.addressLine2 ?? '')
  const [sex, setSex] = useState(patient.sex ?? '')
  const [civilStatus, setCivilStatus] = useState(patient.civilStatus ?? '')
  const [occupation, setOccupation] = useState(patient.occupation ?? '')

  const age = computeAge(patient.dateOfBirth)
  const inputClass = 'w-full min-h-[52px] rounded-xl border border-input bg-background px-4 py-2 text-base outline-none focus:ring-2 focus:ring-ring'

  function handleSave() {
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !dob) return
    startTransition(async () => {
      await updatePatientInfo(patient.id, { firstName, middleName: middleName || undefined, lastName, dateOfBirth: dob, phone, email, address, addressLine2: addressLine2 || undefined, sex: sex || undefined, civilStatus: civilStatus || undefined, occupation: occupation || undefined })
      setEditing(false); router.refresh()
    })
  }

  if (editing) {
    return (
      <div className="rounded-2xl bg-white border border-border shadow-sm p-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-muted-foreground">First Name *</label>
            <input className={inputClass} value={firstName} onChange={e => setFirstName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-muted-foreground">Last Name *</label>
            <input className={inputClass} value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
        </div>
        {[
          { label: 'Middle Name (optional)', value: middleName, set: setMiddleName, placeholder: 'e.g. Santos' },
          { label: 'Phone *', value: phone, set: setPhone, placeholder: '09171234567' },
          { label: 'Email (optional)', value: email, set: setEmail, placeholder: 'patient@email.com' },
          { label: 'Address', value: address, set: setAddress, placeholder: 'Street, City, Province' },
          { label: 'Address Line 2 (optional)', value: addressLine2, set: setAddressLine2, placeholder: 'Unit / building / barangay' },
          { label: 'Occupation', value: occupation, set: setOccupation, placeholder: 'e.g. Teacher, Nurse' },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label} className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-muted-foreground">{label}</label>
            <input className={inputClass} value={value} onChange={e => set(e.target.value)} placeholder={placeholder} />
          </div>
        ))}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-muted-foreground">Date of Birth *</label>
          <input type="date" className={inputClass} value={dob} onChange={e => setDob(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-semibold text-muted-foreground">Sex</label>
            <select value={sex} onChange={e => setSex(e.target.value)} className="min-h-[52px] rounded-xl border border-input bg-background px-4 text-base">
              <option value="">— select —</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-sm font-semibold text-muted-foreground">Civil Status</label>
            <select value={civilStatus} onChange={e => setCivilStatus(e.target.value)} className="min-h-[52px] rounded-xl border border-input bg-background px-4 text-base">
              <option value="">— select —</option>
              <option value="SINGLE">Single</option>
              <option value="MARRIED">Married</option>
              <option value="WIDOWED">Widowed</option>
              <option value="SEPARATED">Separated</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button onClick={handleSave} disabled={isPending || !firstName.trim() || !lastName.trim() || !phone.trim()} className="flex-1 min-h-[52px]">{isPending ? 'Saving…' : 'Save'}</Button>
          <Button variant="outline" onClick={() => setEditing(false)} disabled={isPending} className="flex-1 min-h-[52px]">Cancel</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden shadow-md">
      {/* Violet gradient banner */}
      <div className="bg-gradient-to-br from-violet-600 to-violet-500 px-5 py-5 text-white">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-black leading-tight">
              {patient.firstName}{patient.middleName ? ` ${patient.middleName}` : ''} {patient.lastName}
            </h1>
            <p className="text-base opacity-90 mt-0.5">Age {age} · {formatDateShort(patient.dateOfBirth)}</p>
            {patient.address && (
              <p className="text-sm opacity-75 mt-0.5">{patient.address}{patient.addressLine2 ? `, ${patient.addressLine2}` : ''}</p>
            )}
          </div>
          <button onClick={() => setEditing(true)} className="shrink-0 bg-white/20 hover:bg-white/30 text-white text-sm font-bold px-3 py-2 rounded-xl transition-colors">Edit</button>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-2 mt-3">
          {hasConsent ? (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-400/30 text-emerald-100 border border-emerald-400/40">✓ Consent on file</span>
          ) : (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-400/30 text-red-100 border border-red-400/40">⚠ No consent</span>
          )}
          {patient.isSeniorCitizen && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-400/30 text-amber-100 border border-amber-400/40">SC</span>}
          {patient.isPwd && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-400/30 text-purple-100 border border-purple-400/40">PWD</span>}
          {patient.loyaltyCards[0] && !( new Date(patient.loyaltyCards[0].expiryDate) < new Date()) && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 text-white border border-white/30">💳 Loyalty Card</span>
          )}
        </div>
      </div>

      {/* Action strip */}
      <div className="bg-white px-4 py-3 flex flex-col gap-2 border-t border-violet-100">
        {(patient.sex || patient.civilStatus || patient.occupation) && (
          <p className="text-base text-muted-foreground">
            {[patient.sex ? (patient.sex === 'MALE' ? 'Male' : 'Female') : null, patient.civilStatus ? patient.civilStatus.charAt(0) + patient.civilStatus.slice(1).toLowerCase() : null, patient.occupation ?? null].filter(Boolean).join(' · ')}
          </p>
        )}
        {patient.email && <p className="text-base text-muted-foreground">{patient.email}</p>}

        <div className="flex gap-2 mt-1">
          <a href={`tel:${patient.phone}`} className="flex-1 min-h-[56px] flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 text-white font-bold text-base shadow-sm">
            📞 {patient.phone}
          </a>
          <Link href={`/visits/new?patientId=${patient.id}`}
            className="flex-1 min-h-[56px] flex items-center justify-center rounded-2xl bg-amber-400 text-white font-bold text-base shadow-sm">
            ＋ New Visit
          </Link>
        </div>

        <Link href={`/patients/${patient.id}/certificate`}
          className="w-full min-h-[52px] flex items-center justify-center gap-2 rounded-2xl bg-violet-600 text-white font-bold text-base shadow-sm">
          📄 Dental Certificate
        </Link>
      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function PatientProfile({ patient, facebookPageUrl, messengerPageId }: { patient: FullPatient; facebookPageUrl: string | null; messengerPageId: string | null }) {
  const latestConsent = patient.consentRecords[0] ?? null

  return (
    <div className="flex flex-col gap-4 pb-8">
      <ProfileHeader patient={patient} hasConsent={!!latestConsent} />
      <MedicalSection patient={patient} />
      <ScPwdSection patient={patient} />
      <LoyaltySection patient={patient} />

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-black text-foreground">Visit History</h2>
        {patient.visits.length === 0 ? (
          <p className="text-base text-muted-foreground text-center py-6">No visits recorded yet. Tap New Visit to begin.</p>
        ) : (
          patient.visits.map((v, i) => <VisitCard key={v.id} visit={v} index={i} />)
        )}
      </div>

      <LinkMessengerSection patient={patient} facebookPageUrl={facebookPageUrl} messengerPageId={messengerPageId} />
      <DeletePatientSection patient={patient} />
    </div>
  )
}
