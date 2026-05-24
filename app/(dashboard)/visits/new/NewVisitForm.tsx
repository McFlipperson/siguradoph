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
  serviceId: string | null   // null = Other
  serviceName: string
  diagnosis: string
  toothNumber: string
}

function uid() {
  return Math.random().toString(36).slice(2)
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

  // ── Procedure helpers ──────────────────────────────────────────────────────

  function addProcedure(serviceId: string, serviceName: string) {
    setProcedures((prev) => [
      ...prev,
      { uid: uid(), serviceId, serviceName, diagnosis: '', toothNumber: '' },
    ])
  }

  function addOther() {
    setProcedures((prev) => [
      ...prev,
      { uid: uid(), serviceId: null, serviceName: '', diagnosis: '', toothNumber: '' },
    ])
  }

  function removeProcedure(id: string) {
    setProcedures((prev) => prev.filter((p) => p.uid !== id))
  }

  function updateProcedure(id: string, field: keyof ProcedureEntry, value: string) {
    setProcedures((prev) =>
      prev.map((p) => (p.uid === id ? { ...p, [field]: value } : p))
    )
  }

  // ── Derived state ──────────────────────────────────────────────────────────

  const addedServiceIds = new Set(procedures.map((p) => p.serviceId).filter(Boolean))

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

  // ── Submit ─────────────────────────────────────────────────────────────────

  function submit(action: 'checkout' | 'save') {
    if (!canSubmit) return
    setPendingAction(action)

    // Combine multiple procedures into the single Visit fields
    const treatment = procedures.map((p) => p.serviceName).join(', ')
    const diagnosis =
      procedures.length === 1
        ? procedures[0].diagnosis
        : procedures.map((p) => `${p.serviceName}: ${p.diagnosis}`).join('; ')
    const toothNumber = procedures
      .map((p) => p.toothNumber.trim())
      .filter(Boolean)
      .join(', ') || undefined

    // Braces reminder only makes sense if exactly one braces procedure
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

  // ── Render ─────────────────────────────────────────────────────────────────

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
        <CardHeader>
          <CardTitle>Visit Details</CardTitle>
        </CardHeader>
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

      {/* Procedures */}
      <Card>
        <CardHeader>
          <CardTitle>
            Procedures<span className="text-destructive ml-0.5">*</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Service picker grid */}
          {setup.serviceCatalog.length === 0 ? (
            <p className="text-sm text-muted-foreground">No services configured yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {setup.serviceCatalog.map((svc) => {
                const alreadyAdded = addedServiceIds.has(svc.id)
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => addProcedure(svc.id, svc.name)}
                    className={`min-h-[48px] rounded-lg border-2 px-3 py-2 text-sm font-medium text-left transition-colors ${
                      alreadyAdded
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-foreground hover:bg-muted'
                    }`}
                  >
                    {svc.name}
                  </button>
                )
              })}
              {/* Other */}
              <button
                type="button"
                onClick={addOther}
                className="min-h-[48px] rounded-lg border-2 border-dashed border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted text-left transition-colors"
              >
                + Other
              </button>
            </div>
          )}

          {/* Added procedure cards */}
          {procedures.length > 0 && (
            <div className="flex flex-col gap-3">
              {procedures.map((proc) => (
                <div
                  key={proc.uid}
                  className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col gap-3"
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-2">
                    {proc.serviceId ? (
                      <span className="font-semibold text-sm text-primary">{proc.serviceName}</span>
                    ) : (
                      <input
                        className="flex-1 min-h-[40px] rounded-lg border border-input bg-background px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Procedure name…"
                        value={proc.serviceName}
                        onChange={(e) => updateProcedure(proc.uid, 'serviceName', e.target.value)}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeProcedure(proc.uid)}
                      className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label="Remove procedure"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Diagnosis */}
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">
                      Diagnosis<span className="text-destructive ml-0.5">*</span>
                    </Label>
                    <input
                      className={inputClass}
                      value={proc.diagnosis}
                      onChange={(e) => updateProcedure(proc.uid, 'diagnosis', e.target.value)}
                      placeholder="e.g. Dental caries, tooth decay"
                    />
                  </div>

                  {/* Tooth number */}
                  <div className="flex flex-col gap-1">
                    <Label className="text-xs">Tooth Number <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <input
                      className={inputClass}
                      value={proc.toothNumber}
                      onChange={(e) => updateProcedure(proc.uid, 'toothNumber', e.target.value)}
                      placeholder="e.g. 16, 36"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {procedures.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-1">
              Tap a procedure above to add it
            </p>
          )}
        </CardContent>
      </Card>

      {/* Price */}
      <Card>
        <CardHeader>
          <CardTitle>Price<span className="text-destructive ml-0.5">*</span></CardTitle>
        </CardHeader>
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
          {vat && (
            <div className="flex flex-col gap-1 text-sm rounded-lg bg-muted/50 px-4 py-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Net amount</span>
                <span>₱{formatMoney(vat.net)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT (12%)</span>
                <span>₱{formatMoney(vat.vat)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-border mt-1 pt-1">
                <span>Total</span>
                <span>₱{formatMoney(vat.gross)}</span>
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
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isBracesReminder ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                    isBracesReminder ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
              <span className="text-sm font-medium">This is a braces alignment visit</span>
            </div>
            {isBracesReminder && (
              <div className="flex flex-col gap-1.5">
                <Label>Reminder interval</Label>
                <select
                  className={inputClass}
                  value={reminderWeeks}
                  onChange={(e) => setReminderWeeks(Number(e.target.value))}
                >
                  {REMINDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cleaning recall notice */}
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
        <CardHeader>
          <CardTitle>Notes<span className="text-destructive ml-0.5">*</span></CardTitle>
        </CardHeader>
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

      {/* Action buttons */}
      <div className="flex flex-col gap-2">
        <Button
          onClick={() => submit('checkout')}
          disabled={!canSubmit}
          className="w-full min-h-[56px] text-base"
        >
          {pendingAction === 'checkout' && isPending ? 'Saving…' : 'Save and Proceed to Checkout'}
        </Button>
        <Button
          variant="outline"
          onClick={() => submit('save')}
          disabled={!canSubmit}
          className="w-full min-h-[56px] text-base"
        >
          {pendingAction === 'save' && isPending ? 'Saving…' : 'Save Only'}
        </Button>
      </div>
    </div>
  )
}
