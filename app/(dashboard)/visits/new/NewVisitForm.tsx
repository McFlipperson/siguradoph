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

export default function NewVisitForm({ setup, appointmentId }: { setup: VisitSetup; appointmentId?: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingAction, setPendingAction] = useState<'checkout' | 'save' | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const minDate = new Date(setup.clinic.enrollmentDate).toISOString().split('T')[0]

  const [visitDate, setVisitDate] = useState(today)
  const [diagnosis, setDiagnosis] = useState('')
  const [toothNumber, setToothNumber] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [price, setPrice] = useState('')
  const [isBracesReminder, setIsBracesReminder] = useState(false)
  const [reminderWeeks, setReminderWeeks] = useState(4)
  const [notes, setNotes] = useState('')

  const selectedService = setup.serviceCatalog.find((s) => s.id === selectedServiceId) ?? null
  const isBracesCategory = selectedService?.category === 'BRACES'
  const isCleaningCategory = selectedService?.category === 'CLEANING'

  const gross = parseFloat(price) || 0
  const vat = gross > 0 ? computeVat(gross) : null

  const canSubmit =
    visitDate &&
    diagnosis.trim() &&
    selectedServiceId &&
    gross > 0 &&
    notes.trim().length >= 1 &&
    !isPending

  function submit(action: 'checkout' | 'save') {
    if (!canSubmit || !selectedService) return
    setPendingAction(action)
    startTransition(async () => {
      const visitId = await saveVisit({
        patientId: setup.patient.id,
        visitDate,
        diagnosis,
        toothNumber: toothNumber.trim() || undefined,
        treatment: selectedService.name,
        notes,
        grossAmount: gross,
        isBracesReminder: isBracesCategory && isBracesReminder,
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

      <Card>
        <CardHeader>
          <CardTitle>Visit Details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Visit date */}
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

          {/* Diagnosis */}
          <div className="flex flex-col gap-1.5">
            <Label>Diagnosis<span className="text-destructive ml-0.5">*</span></Label>
            <input
              className={inputClass}
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Dental caries, tooth decay"
            />
          </div>

          {/* Tooth number */}
          <div className="flex flex-col gap-1.5">
            <Label>Tooth Number</Label>
            <input
              className={inputClass}
              value={toothNumber}
              onChange={(e) => setToothNumber(e.target.value)}
              placeholder="e.g. 16, 36, 11-21"
            />
            <p className="text-xs text-muted-foreground">Use standard tooth numbering</p>
          </div>
        </CardContent>
      </Card>

      {/* Procedure grid */}
      <Card>
        <CardHeader>
          <CardTitle>Procedure<span className="text-destructive ml-0.5">*</span></CardTitle>
        </CardHeader>
        <CardContent>
          {setup.serviceCatalog.length === 0 ? (
            <p className="text-sm text-muted-foreground">No services configured yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {setup.serviceCatalog.map((svc) => {
                const selected = selectedServiceId === svc.id
                return (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => {
                      setSelectedServiceId(svc.id)
                      if (svc.category !== 'BRACES') setIsBracesReminder(false)
                    }}
                    className={`min-h-[48px] rounded-lg border-2 px-3 py-2 text-sm font-medium text-left transition-colors ${
                      selected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-background text-foreground hover:bg-muted'
                    }`}
                  >
                    {svc.name}
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Price + VAT */}
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
          {pendingAction === 'checkout' && isPending
            ? 'Saving…'
            : 'Save and Proceed to Checkout'}
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
