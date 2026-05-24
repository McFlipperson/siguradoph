'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveVisit } from '../actions'
import { computeVat } from '@/lib/vat'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import type { VisitSetup } from '../actions'

function formatMoney(n: number) {
  return new Intl.NumberFormat('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

const REMINDER_OPTIONS = [
  { label: '4 weeks', value: 4 },
  { label: '5 weeks', value: 5 },
  { label: '6 weeks', value: 6 },
]

const inputClass =
  'w-full min-h-[48px] rounded-lg border border-input bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring'
const textareaClass =
  'w-full rounded-lg border border-input bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring resize-none'

type ProcedureEntry = {
  uid: string
  serviceId: string | null
  serviceName: string
  diagnosis: string
  toothNumber: string
}

let _uidCounter = 0
function makeUid() {
  return `proc-${++_uidCounter}-${Date.now()}`
}

export default function NewVisitForm({ setup, appointmentId }: { setup: VisitSetup; appointmentId?: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<'checkout' | 'save' | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const minDate = new Date(setup.clinic.enrollmentDate).toISOString().split('T')[0]

  const [visitDate, setVisitDate] = useState(today)
  const [procedures, setProcedures] = useState<ProcedureEntry[]>([])
  const [price, setPrice] = useState('')
  const [isBracesReminder, setIsBracesReminder] = useState(false)
  const [reminderWeeks, setReminderWeeks] = useState(4)
  const [notes, setNotes] = useState('')

  function addProcedure(serviceId: string, serviceName: string) {
    setProcedures((prev) => [...prev, { uid: makeUid(), serviceId, serviceName, diagnosis: '', toothNumber: '' }])
  }

  function addOther() {
    setProcedures((prev) => [...prev, { uid: makeUid(), serviceId: null, serviceName: '', diagnosis: '', toothNumber: '' }])
  }

  function removeProcedure(uid: string) {
    setProcedures((prev) => prev.filter((p) => p.uid !== uid))
  }

  function updateProcedure(uid: string, field: 'serviceName' | 'diagnosis' | 'toothNumber', value: string) {
    setProcedures((prev) => prev.map((p) => (p.uid === uid ? { ...p, [field]: value } : p)))
  }

  const addedIds = procedures.map((p) => p.serviceId)

  const resolvedServices = procedures
    .map((p) => setup.serviceCatalog.find((s) => s.id === p.serviceId))
    .filter(Boolean)
  const isBracesCategory = resolvedServices.some((s) => s?.category === 'BRACES')
  const isCleaningCategory = resolvedServices.some((s) => s?.category === 'CLEANING')

  const gross = parseFloat(price) || 0
  const vat = gross > 0 ? computeVat(gross) : null

  const canSubmit =
    visitDate &&
    procedures.length > 0 &&
    procedures.every((p) => p.serviceName.trim() && p.diagnosis.trim()) &&
    gross > 0 &&
    notes.trim().length >= 1 &&
    !isPending

  function submit(action: 'checkout' | 'save') {
    if (!canSubmit) return
    setPendingAction(action)

    const treatment = procedures.map((p) => p.serviceName).join(', ')
    const diagnosis =
      procedures.length === 1
        ? procedures[0].diagnosis
        : procedures.map((p) => `${p.serviceName}: ${p.diagnosis}`).join('; ')
    const toothNumber =
      procedures.map((p) => p.toothNumber.trim()).filter(Boolean).join(', ') || undefined

    const bracesEntry = procedures.find((p) => {
      const svc = setup.serviceCatalog.find((s) => s.id === p.serviceId)
      return svc?.category === 'BRACES'
    })

    startTransition(async () => {
      const visitId = await saveVisit({
        patientId: setup.patient.id,
        visitDate,
        diagnosis,
        toothNumber,
        treatment,
        notes,
        grossAmount: gross,
        isBracesReminder: isBracesCategory && isBracesReminder && !!bracesEntry,
        reminderWeeks: isBracesCategory && isBracesReminder ? reminderWeeks : undefined,
        isCleaningService: isCleaningCategory,
        appointmentId,
      })
      if (action === 'checkout') {
        router.push(`/payments?visitId=${visitId}`)
      } else {
        router.push(`/patients/${setup.patient.id}`)
      }
    })
  }

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Patient header */}
      <div className="text-sm text-muted-foreground">
        Patient:{' '}
        <span className="font-semibold text-foreground">
          {setup.patient.firstName} {setup.patient.lastName}
        </span>
      </div>

      {/* Visit date */}
      <Card>
        <CardHeader><CardTitle>Visit Details</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1.5">
            <Label>Visit Date<span className="text-destructive ml-0.5">*</span></Label>
            <input
              type="date"
              className={inputClass}
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              max={today}
              min={minDate}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Procedure picker ── */}
      <Card>
        <CardHeader>
          <CardTitle>Procedures<span className="text-destructive ml-0.5">*</span></CardTitle>
        </CardHeader>
        <CardContent>
          {setup.serviceCatalog.length === 0 ? (
            <p className="text-sm text-muted-foreground">No services configured yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {setup.serviceCatalog.map((svc) => {
                const count = addedIds.filter((id) => id === svc.id).length
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => addProcedure(svc.id, svc.name)}
                    className={`relative min-h-[48px] rounded-lg border-2 px-3 py-2 text-sm font-medium text-left transition-colors ${
                      count > 0
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-foreground hover:bg-muted'
                    }`}
                  >
                    {svc.name}
                    {count > 1 && (
                      <span className="absolute top-1 right-1.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                        ×{count}
                      </span>
                    )}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={addOther}
                className="min-h-[48px] rounded-lg border-2 border-dashed border-muted-foreground/40 bg-background px-3 py-2 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 text-left transition-colors"
              >
                + Other
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── One card per added procedure ── */}
      {procedures.map((proc, i) => (
        <Card key={proc.uid} className="border-primary/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {proc.serviceId ? (
                  <CardTitle className="text-base">{proc.serviceName}</CardTitle>
                ) : (
                  <input
                    className="flex-1 min-h-[40px] rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Procedure name…"
                    value={proc.serviceName}
                    onChange={(e) => updateProcedure(proc.uid, 'serviceName', e.target.value)}
                    autoFocus
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => removeProcedure(proc.uid)}
                className="shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors text-lg"
                aria-label="Remove"
              >
                ×
              </button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            <div className="flex flex-col gap-1.5">
              <Label>Diagnosis<span className="text-destructive ml-0.5">*</span></Label>
              <input
                className={inputClass}
                value={proc.diagnosis}
                onChange={(e) => updateProcedure(proc.uid, 'diagnosis', e.target.value)}
                placeholder="e.g. Dental caries, tooth decay"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Tooth Number <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <input
                className={inputClass}
                value={proc.toothNumber}
                onChange={(e) => updateProcedure(proc.uid, 'toothNumber', e.target.value)}
                placeholder="e.g. 16, 36"
              />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* ── Price ── */}
      <Card>
        <CardHeader><CardTitle>Price<span className="text-destructive ml-0.5">*</span></CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3">
          <input
            type="number"
            inputMode="numeric"
            className={inputClass}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            min={0}
          />
          {gross > 0 && (
            <div className="flex flex-col gap-1 text-sm rounded-lg bg-muted/50 px-4 py-3">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>₱{formatMoney(gross)}</span>
              </div>
              <div className="flex justify-between text-xs text-emerald-600">
                <span>VAT-Exempt (NIRC §109)</span>
                <span>₱0.00</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Braces toggle */}
      {isBracesCategory && (
        <Card>
          <CardContent className="flex flex-col gap-3 py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={isBracesReminder}
                onClick={() => setIsBracesReminder((v) => !v)}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors ${
                  isBracesReminder ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span className={`pointer-events-none inline-block h-6 w-6 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                  isBracesReminder ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
              <span className="text-sm font-medium">This is a braces alignment visit</span>
            </div>
            {isBracesReminder && (
              <div className="flex flex-col gap-1.5">
                <Label>Reminder interval</Label>
                <select className={inputClass} value={reminderWeeks} onChange={(e) => setReminderWeeks(Number(e.target.value))}>
                  {REMINDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cleaning recall */}
      {isCleaningCategory && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              📅 A 6-month recall reminder will be scheduled automatically for this patient via Messenger.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardHeader><CardTitle>Notes<span className="text-destructive ml-0.5">*</span></CardTitle></CardHeader>
        <CardContent>
          <textarea
            className={textareaClass}
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Treatment notes, observations, next steps, patient concerns…"
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button onClick={() => submit('checkout')} disabled={!canSubmit} className="w-full min-h-[56px] text-base">
          {pendingAction === 'checkout' && isPending ? 'Saving…' : 'Save and Proceed to Checkout'}
        </Button>
        <Button variant="outline" onClick={() => submit('save')} disabled={!canSubmit} className="w-full min-h-[56px] text-base">
          {pendingAction === 'save' && isPending ? 'Saving…' : 'Save Only'}
        </Button>
      </div>
    </div>
  )
}
