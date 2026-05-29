'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { updatePatientMedical, updatePatientInfo, issueLoyaltyCard, updatePatientScPwd, deletePatient } from '../actions'
import { voidVisit, updateVisit } from '../../visits/actions'
import type { FullPatient } from '../actions'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

function computeAge(dob: Date): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-PH', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatMoney(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
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

function MedicalSection({ patient }: { patient: FullPatient }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [medicalHistory, setMedicalHistory] = useState(patient.medicalHistory ?? '')
  const [medications, setMedications] = useState(patient.medications ?? '')
  const [allergies, setAllergies] = useState(patient.allergies ?? '')

  const textareaClass =
    'w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring resize-none'

  function handleSave() {
    startTransition(async () => {
      await updatePatientMedical(patient.id, { medicalHistory, medications, allergies })
      setEditing(false)
    })
  }

  return (
    <Card>
      <CardHeader>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <CardTitle>Medical Background</CardTitle>
          <span className="text-muted-foreground text-sm">{open ? '▲' : '▼'}</span>
        </button>
      </CardHeader>
      {open && (
        <CardContent className="flex flex-col gap-3">
          {editing ? (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Medical History</label>
                <textarea
                  className={textareaClass}
                  rows={3}
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Medications</label>
                <textarea
                  className={textareaClass}
                  rows={3}
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Allergies</label>
                <textarea
                  className={textareaClass}
                  rows={2}
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={isPending}
                  className="flex-1 min-h-[48px]"
                >
                  {isPending ? 'Saving…' : 'Save'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditing(false)}
                  disabled={isPending}
                  className="flex-1 min-h-[48px]"
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Medical History</p>
                <p className="text-sm">{medicalHistory || 'None'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Medications</p>
                <p className="text-sm">{medications || 'None'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Allergies</p>
                <p className="text-sm">{allergies || 'None'}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => setEditing(true)}
                className="min-h-[48px]"
              >
                Edit
              </Button>
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function LoyaltySection({ patient }: { patient: FullPatient }) {
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()
  const card = patient.loyaltyCards[0] ?? null

  const isExpired = card ? new Date(card.expiryDate) < new Date() : false
  const allExhausted =
    card &&
    !isExpired &&
    LOYALTY_SERVICES.every((s) => card[s.key as CardKey] === 0)

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
    <Card>
      <CardHeader>
        <CardTitle>Loyalty Card</CardTitle>
      </CardHeader>
      <CardContent>
        {!card ? (
          <div className="flex flex-col gap-3 py-2">
            <p className="text-sm text-muted-foreground">No loyalty card issued.</p>
            {showConfirm ? (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                <p className="text-sm font-medium">
                  Issue a loyalty card for {patient.firstName}? This will charge ₱500 and generate a receipt.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isPending} className="min-h-[48px]">
                    Cancel
                  </Button>
                  <Button onClick={handleIssue} disabled={isPending} className="min-h-[48px]">
                    {isPending ? 'Issuing…' : 'Confirm ₱500'}
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setShowConfirm(true)} className="w-full min-h-[48px]">
                Issue Card (₱500)
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Card Number</p>
                <p className="font-mono text-sm font-semibold">{card.cardNumber}</p>
              </div>
              <Badge
                className={
                  isExpired
                    ? 'bg-red-100 text-red-800 border-red-200'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }
              >
                {isExpired ? 'Expired' : 'Active'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Expires: {formatDate(card.expiryDate)}
            </p>

            {/* Remaining uses grid */}
            <div className="grid grid-cols-1 gap-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Remaining Uses
              </p>
              {LOYALTY_SERVICES.map((s) => (
                <div key={s.key} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                  <span className="text-sm">{s.label}</span>
                  <span className="text-sm font-medium tabular-nums">
                    {card[s.key as CardKey]}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between py-1">
                <span className="text-sm">Check-up</span>
                <span className="text-sm font-medium">Unlimited</span>
              </div>
            </div>

            {needsNew && (
              showConfirm ? (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                  <p className="text-sm font-medium">
                    {action} a loyalty card for {patient.firstName}? This will charge ₱500 and generate a receipt.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isPending} className="min-h-[48px]">
                      Cancel
                    </Button>
                    <Button onClick={handleIssue} disabled={isPending} className="min-h-[48px]">
                      {isPending ? `${action}ing…` : 'Confirm ₱500'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setShowConfirm(true)} className="w-full min-h-[48px]">
                  {action} Card (₱500)
                </Button>
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const PWD_DISABILITY_LABELS: Record<string, string> = {
  VISUAL: 'Visual Impairment',
  HEARING: 'Hearing Impairment',
  SPEECH: 'Speech Impairment',
  PHYSICAL: 'Physical Disability',
  INTELLECTUAL: 'Intellectual Disability',
  PSYCHOSOCIAL: 'Psychosocial Disability',
  LEARNING: 'Learning Disability',
  MENTAL: 'Mental Health Condition',
}

function ScPwdSection({ patient }: { patient: FullPatient }) {
  const [open, setOpen] = useState(false)
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
      await updatePatientScPwd(patient.id, {
        isSeniorCitizen: isSc,
        scIdNumber: scId,
        isPwd,
        pwdIdNumber: pwdId,
        pwdDisabilityType: pwdType,
      })
      setEditing(false)
      router.refresh()
    })
  }

  const hasAny = patient.isSeniorCitizen || patient.isPwd
  const inputClass = 'w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring'

  return (
    <Card>
      <CardHeader>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <CardTitle>Gov&apos;t Discount Status</CardTitle>
            {hasAny && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                {patient.isSeniorCitizen && patient.isPwd ? 'SC + PWD' : patient.isSeniorCitizen ? 'SC' : 'PWD'}
              </Badge>
            )}
          </div>
          <span className="text-muted-foreground text-sm">{open ? '▲' : '▼'}</span>
        </button>
      </CardHeader>
      {open && (
        <CardContent className="flex flex-col gap-4">
          {editing ? (
            <>
              {/* Senior Citizen */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="scToggle" className="flex-1 font-medium text-sm">
                    Senior Citizen (RA 9994)
                  </Label>
                  <Switch id="scToggle" checked={isSc} onCheckedChange={setIsSc} className="shrink-0" />
                </div>
                {isSc && (
                  <div className="space-y-1">
                    <Label htmlFor="scIdInput" className="text-xs text-muted-foreground">SC ID Number</Label>
                    <Input
                      id="scIdInput"
                      value={scId}
                      onChange={(e) => setScId(e.target.value)}
                      placeholder="Senior Citizen ID number"
                      className="min-h-[48px] text-sm"
                    />
                  </div>
                )}
              </div>

              {/* PWD */}
              <div className="space-y-3 border-t pt-3">
                <div className="flex items-center justify-between gap-3">
                  <Label htmlFor="pwdToggle" className="flex-1 font-medium text-sm">
                    Person with Disability (RA 10754)
                  </Label>
                  <Switch id="pwdToggle" checked={isPwd} onCheckedChange={setIsPwd} className="shrink-0" />
                </div>
                {isPwd && (
                  <>
                    <div className="space-y-1">
                      <Label htmlFor="pwdIdInput" className="text-xs text-muted-foreground">PWD ID Number</Label>
                      <Input
                        id="pwdIdInput"
                        value={pwdId}
                        onChange={(e) => setPwdId(e.target.value)}
                        placeholder="PWD ID number"
                        className="min-h-[48px] text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="pwdTypeSelect" className="text-xs text-muted-foreground">Disability Type</Label>
                      <select
                        id="pwdTypeSelect"
                        className={inputClass}
                        value={pwdType}
                        onChange={(e) => setPwdType(e.target.value)}
                      >
                        <option value="">Select type…</option>
                        {Object.entries(PWD_DISABILITY_LABELS).map(([val, label]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <Button onClick={handleSave} disabled={isPending} className="flex-1 min-h-[48px]">
                  {isPending ? 'Saving…' : 'Save'}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)} disabled={isPending} className="flex-1 min-h-[48px]">
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Read view */}
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Senior Citizen</span>
                  <div className="flex items-center gap-2">
                    {patient.isSeniorCitizen ? (
                      <>
                        <span className="text-emerald-600 font-medium">Yes</span>
                        {patient.scIdNumber && (
                          <span className="text-xs text-muted-foreground font-mono">#{patient.scIdNumber}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-muted-foreground">PWD</span>
                  <div className="flex items-center gap-2">
                    {patient.isPwd ? (
                      <>
                        <span className="text-emerald-600 font-medium">Yes</span>
                        {patient.pwdDisabilityType && (
                          <span className="text-xs text-muted-foreground">
                            {PWD_DISABILITY_LABELS[patient.pwdDisabilityType] ?? patient.pwdDisabilityType}
                          </span>
                        )}
                        {patient.pwdIdNumber && (
                          <span className="text-xs text-muted-foreground font-mono">#{patient.pwdIdNumber}</span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={() => setEditing(true)} className="min-h-[48px]">
                Edit
              </Button>
            </>
          )}
        </CardContent>
      )}
    </Card>
  )
}

function VisitCard({ visit }: { visit: FullPatient['visits'][number] }) {
  const [expanded, setExpanded] = useState(false)
  const [showVoidConfirm, setShowVoidConfirm] = useState(false)
  const [voiding, setVoiding] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const isVoid = visit.status === 'VOID'
  const hasInvoice = !!visit.invoice

  // Edit form state — initialised from visit data
  const [editTreatment, setEditTreatment] = useState(visit.treatment)
  const [editDiagnosis, setEditDiagnosis] = useState(visit.diagnosis)
  const [editTooth, setEditTooth] = useState(visit.toothNumber ?? '')
  const [editNotes, setEditNotes] = useState(visit.notes ?? '')
  const [editAmount, setEditAmount] = useState(String(visit.grossAmount))
  const [editDate, setEditDate] = useState(() => {
    // Convert stored UTC date back to PHT for the datetime-local input
    const d = new Date(visit.visitDate)
    const pht = new Date(d.getTime() + 8 * 60 * 60 * 1000)
    return pht.toISOString().slice(0, 16)
  })

  async function handleVoid() {
    setVoiding(true)
    try {
      await voidVisit(visit.id)
      router.refresh()
    } finally {
      setVoiding(false)
      setShowVoidConfirm(false)
    }
  }

  function openEdit(e: React.MouseEvent) {
    e.stopPropagation()
    setEditTreatment(visit.treatment)
    setEditDiagnosis(visit.diagnosis)
    setEditTooth(visit.toothNumber ?? '')
    setEditNotes(visit.notes ?? '')
    setEditAmount(String(visit.grossAmount))
    setEditing(true)
    setExpanded(true)
  }

  async function handleSave() {
    if (!editTreatment.trim() || !editDiagnosis.trim() || !editNotes.trim()) return
    const grossAmount = parseFloat(editAmount)
    if (!hasInvoice && (!grossAmount || grossAmount <= 0)) return
    setSaving(true)
    try {
      await updateVisit({
        visitId: visit.id,
        treatment: editTreatment,
        diagnosis: editDiagnosis,
        toothNumber: editTooth || undefined,
        notes: editNotes,
        grossAmount: hasInvoice ? undefined : grossAmount,
        visitDate: hasInvoice ? undefined : editDate,
      })
      setEditing(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full min-h-[48px] rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring'
  const textareaCls = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none'

  return (
    <div className={`rounded-xl bg-card ring-1 overflow-hidden ${isVoid ? 'ring-red-200 opacity-60' : 'ring-foreground/10'}`}>
      {/* Header row — tap to expand */}
      <div
        onClick={() => !showVoidConfirm && !editing && setExpanded((v) => !v)}
        className="cursor-pointer px-4 py-3 flex flex-col gap-1"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{visit.treatment}</p>
              {isVoid && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">VOID</span>
              )}
            </div>
            {visit.toothNumber && (
              <p className="text-xs text-muted-foreground">Tooth {visit.toothNumber}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!isVoid && !editing && (
              <button
                type="button"
                onClick={openEdit}
                className="text-xs text-primary underline underline-offset-2 py-1"
              >
                Edit
              </button>
            )}
            <p className={`text-sm font-medium whitespace-nowrap ${isVoid ? 'line-through text-muted-foreground' : ''}`}>
              ₱{formatMoney(visit.grossAmount)}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{formatDate(visit.visitDate)}</p>
        <p className="text-sm text-muted-foreground line-clamp-1">{visit.diagnosis}</p>
      </div>

      {expanded && !editing && (
        <div className="border-t border-border px-4 py-3 flex flex-col gap-3">
          {visit.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Notes</p>
              <p className="text-sm">{visit.notes}</p>
            </div>
          )}
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>₱{formatMoney(visit.grossAmount)}</span>
            </div>
            <div className="flex justify-between text-xs text-emerald-600">
              <span>VAT-Exempt (NIRC §109)</span>
              <span>₱0.00</span>
            </div>
          </div>
          {visit.invoice?.orNumber && (
            <p className="text-xs text-muted-foreground">OR #{visit.invoice.orNumber}</p>
          )}

          {/* Void action — only for active visits */}
          {!isVoid && (
            showVoidConfirm ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 space-y-3">
                <p className="text-sm text-red-900 font-medium">
                  Are you sure you want to void this visit{visit.invoice ? ` and OR #${visit.invoice.orNumber}` : ''}? This cannot be undone.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="min-h-[44px]"
                    onClick={() => setShowVoidConfirm(false)}
                    disabled={voiding}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="min-h-[44px] bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleVoid}
                    disabled={voiding}
                  >
                    {voiding ? 'Voiding…' : 'Confirm Void'}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full min-h-[44px] border-red-200 text-red-600 hover:bg-red-50 text-sm"
                onClick={(e) => { e.stopPropagation(); setShowVoidConfirm(true) }}
              >
                Void Visit
              </Button>
            )
          )}
        </div>
      )}

      {/* ── Inline edit form ── */}
      {editing && (
        <div className="border-t border-border px-4 py-4 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
          {hasInvoice && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              OR #{visit.invoice!.orNumber} has been issued — date and amount are locked. You can still correct clinical details.
            </p>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Treatment / Procedure</label>
            <input
              className={inputCls}
              value={editTreatment}
              onChange={(e) => setEditTreatment(e.target.value)}
              placeholder="e.g. Extraction, Cleaning"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Diagnosis</label>
            <input
              className={inputCls}
              value={editDiagnosis}
              onChange={(e) => setEditDiagnosis(e.target.value)}
              placeholder="e.g. Dental caries"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Tooth Number <span className="font-normal">(optional)</span></label>
            <input
              className={inputCls}
              value={editTooth}
              onChange={(e) => setEditTooth(e.target.value)}
              placeholder="e.g. 16, 36"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <textarea
              className={textareaCls}
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="Treatment notes…"
            />
          </div>

          {!hasInvoice && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Visit Date &amp; Time</label>
                <input
                  type="datetime-local"
                  className={inputCls}
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Amount (₱)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  className={inputCls}
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              variant="outline"
              className="min-h-[48px]"
              onClick={() => setEditing(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="min-h-[48px]"
              onClick={handleSave}
              disabled={saving || !editTreatment.trim() || !editDiagnosis.trim() || !editNotes.trim()}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function DeletePatientSection({ patient }: { patient: FullPatient }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (confirmText !== 'DELETE') return
    setDeleting(true)
    setError(null)
    try {
      await deletePatient(patient.id)
      router.push('/patients')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete patient')
      setDeleting(false)
    }
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-red-800">Danger Zone</p>
        <p className="text-xs text-red-700 mt-0.5">
          Permanently deletes this patient and all their records, visits, invoices, and loyalty card data. This cannot be undone.
        </p>
      </div>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="self-start text-sm font-semibold text-red-700 underline underline-offset-2"
        >
          Delete this patient…
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium text-red-800">
            Type <strong>DELETE</strong> to confirm permanent deletion of{' '}
            <strong>{patient.firstName} {patient.lastName}</strong>
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="min-h-[48px] rounded-lg border border-red-300 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-red-400 w-full"
            autoCapitalize="characters"
          />
          {error && <p className="text-xs text-red-700">{error}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setOpen(false); setConfirmText(''); setError(null) }}
              disabled={deleting}
              className="min-h-[48px] rounded-xl border border-red-200 bg-white text-sm font-semibold text-red-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={confirmText !== 'DELETE' || deleting}
              className="min-h-[48px] rounded-xl bg-red-600 text-sm font-semibold text-white disabled:opacity-40"
            >
              {deleting ? 'Deleting…' : 'Delete Forever'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ProfileHeader({ patient }: { patient: FullPatient }) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [firstName, setFirstName] = useState(patient.firstName)
  const [middleName, setMiddleName] = useState(patient.middleName ?? '')
  const [lastName, setLastName] = useState(patient.lastName)
  const [dob, setDob] = useState(
    new Date(patient.dateOfBirth).toISOString().split('T')[0]
  )
  const [phone, setPhone] = useState(patient.phone)
  const [email, setEmail] = useState(patient.email ?? '')
  const [address, setAddress] = useState(patient.address ?? '')

  const age = computeAge(patient.dateOfBirth)
  const inputClass = 'w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring'

  function handleSave() {
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !dob) return
    startTransition(async () => {
      await updatePatientInfo(patient.id, { firstName, middleName: middleName || undefined, lastName, dateOfBirth: dob, phone, email, address })
      setEditing(false)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-3">
        {editing ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">First Name <span className="text-destructive">*</span></label>
                <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Last Name <span className="text-destructive">*</span></label>
                <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Middle Name <span className="text-muted-foreground font-normal">(optional)</span></label>
              <input className={inputClass} value={middleName} onChange={(e) => setMiddleName(e.target.value)} placeholder="e.g. Santos" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Date of Birth <span className="text-destructive">*</span></label>
              <input type="date" className={inputClass} value={dob} onChange={(e) => setDob(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Phone <span className="text-destructive">*</span></label>
              <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 09171234567" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Email <span className="text-muted-foreground font-normal">(optional)</span></label>
              <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="patient@email.com" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Address</label>
              <input className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, City, Province" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleSave} disabled={isPending || !firstName.trim() || !lastName.trim() || !phone.trim()} className="flex-1 min-h-[48px]">
                {isPending ? 'Saving…' : 'Save'}
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)} disabled={isPending} className="flex-1 min-h-[48px]">
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold font-heading">
                  {patient.firstName}{patient.middleName ? ` ${patient.middleName}` : ''} {patient.lastName}
                </h1>
                {patient.isSeniorCitizen && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs shrink-0">SC</Badge>
                )}
                {patient.isPwd && (
                  <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs shrink-0">PWD</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Age {age} &middot; DOB {formatDate(patient.dateOfBirth)}
              </p>
              {patient.address && (
                <p className="text-xs text-muted-foreground mt-0.5">{patient.address}</p>
              )}
            </div>
            <a href={`tel:${patient.phone}`} className="text-sm text-primary underline min-h-[44px] flex items-center">
              {patient.phone}
            </a>
            {patient.email && (
              <p className="text-sm text-muted-foreground">{patient.email}</p>
            )}
            <div className="flex gap-2">
              <Link
                href={`/visits/new?patientId=${patient.id}`}
                className="flex-1 min-h-[56px] flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-medium text-sm"
              >
                + New Visit
              </Link>
              <Button variant="outline" onClick={() => setEditing(true)} className="min-h-[56px] px-4">
                Edit
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default function PatientProfile({ patient }: { patient: FullPatient }) {
  const latestConsent = patient.consentRecords[0] ?? null

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Header */}
      <ProfileHeader patient={patient} />

      {/* Consent */}
      <Card>
        <CardContent className="py-2">
          {latestConsent ? (
            <div className="flex items-start gap-3">
              <span className="text-emerald-500 text-xl mt-0.5">✓</span>
              <div>
                <p className="text-sm font-medium">Consent on file</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(latestConsent.consentDate)} &middot;{' '}
                  {latestConsent.consentMethod}
                </p>
                {latestConsent.isMinor && latestConsent.guardianName && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Guardian: {latestConsent.guardianName}
                    {latestConsent.guardianRelationship
                      ? ` (${latestConsent.guardianRelationship})`
                      : ''}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <span className="text-destructive text-xl mt-0.5">⚠</span>
              <p className="text-sm font-medium text-destructive">No consent recorded</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Medical background */}
      <MedicalSection patient={patient} />

      {/* SC/PWD status */}
      <ScPwdSection patient={patient} />

      {/* Loyalty card */}
      <LoyaltySection patient={patient} />

      {/* Visit history */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold font-heading">Visit History</h2>
        {patient.visits.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No visits recorded yet. Tap New Visit to begin.
          </p>
        ) : (
          patient.visits.map((v) => <VisitCard key={v.id} visit={v} />)
        )}
      </div>

      {/* Danger Zone */}
      <DeletePatientSection patient={patient} />
    </div>
  )
}
