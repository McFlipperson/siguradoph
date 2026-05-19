'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { updatePatientMedical, issueLoyaltyCard, markBracesComplete } from '../actions'
import type { FullPatient } from '../actions'

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
  const router = useRouter()
  const card = patient.loyaltyCards[0] ?? null

  const isExpired = card ? new Date(card.expiryDate) < new Date() : false
  const allExhausted =
    card &&
    !isExpired &&
    LOYALTY_SERVICES.every((s) => card[s.key as CardKey] === 0)

  function handleIssue() {
    startTransition(async () => {
      await issueLoyaltyCard(patient.id)
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
          <div className="flex flex-col items-center gap-3 py-2">
            <p className="text-sm text-muted-foreground">No loyalty card issued.</p>
            <Button onClick={handleIssue} disabled={isPending} className="w-full min-h-[48px]">
              {isPending ? 'Issuing…' : 'Issue Card (₱500)'}
            </Button>
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

            {(isExpired || allExhausted) && (
              <Button onClick={handleIssue} disabled={isPending} className="w-full min-h-[48px]">
                {isPending ? 'Renewing…' : 'Renew Card (₱500)'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function BracesSection({ patient }: { patient: FullPatient }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleMarkComplete() {
    startTransition(async () => {
      await markBracesComplete(patient.id)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Braces Treatment</CardTitle>
      </CardHeader>
      <CardContent>
        {patient.bracesComplete ? (
          <div className="flex items-center gap-3">
            <span className="text-emerald-500 text-xl">✓</span>
            <div>
              <p className="text-sm font-medium">Treatment Complete</p>
              <p className="text-xs text-muted-foreground">No further alignment reminders scheduled.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">In Progress</Badge>
              <p className="text-sm text-muted-foreground">Alignment reminders active</p>
            </div>
            <Button
              variant="outline"
              onClick={handleMarkComplete}
              disabled={isPending}
              className="w-full min-h-[48px] border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              {isPending ? 'Updating…' : 'Mark Braces Complete'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function VisitCard({ visit }: { visit: FullPatient['visits'][number] }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      className="cursor-pointer rounded-xl bg-card ring-1 ring-foreground/10 overflow-hidden"
    >
      <div className="px-4 py-3 flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm">{visit.treatment}</p>
            {visit.toothNumber && (
              <p className="text-xs text-muted-foreground">Tooth {visit.toothNumber}</p>
            )}
          </div>
          <p className="text-sm font-medium whitespace-nowrap">
            ₱{formatMoney(visit.grossAmount)}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">{formatDate(visit.visitDate)}</p>
        <p className="text-sm text-muted-foreground line-clamp-1">{visit.diagnosis}</p>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 py-3 flex flex-col gap-3">
          {visit.notes && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">Notes</p>
              <p className="text-sm">{visit.notes}</p>
            </div>
          )}
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Net amount</span>
              <span>₱{formatMoney(visit.netAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT (12%)</span>
              <span>₱{formatMoney(visit.vatAmount)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-border pt-1 mt-0.5">
              <span>Total</span>
              <span>₱{formatMoney(visit.grossAmount)}</span>
            </div>
          </div>
          {visit.invoice?.orNumber && (
            <p className="text-xs text-muted-foreground">OR #{visit.invoice.orNumber}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function PatientProfile({ patient }: { patient: FullPatient }) {
  const age = computeAge(patient.dateOfBirth)
  const latestConsent = patient.consentRecords[0] ?? null

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Header */}
      <Card>
        <CardContent className="flex flex-col gap-3 py-2">
          <div>
            <h1 className="text-xl font-bold font-heading">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Age {age} &middot; DOB {formatDate(patient.dateOfBirth)}
            </p>
          </div>
          <a
            href={`tel:${patient.phone}`}
            className="text-sm text-primary underline min-h-[48px] flex items-center"
          >
            {patient.phone}
          </a>
          {patient.email && (
            <p className="text-sm text-muted-foreground">{patient.email}</p>
          )}
          <Link
            href={`/visits/new?patientId=${patient.id}`}
            className="w-full min-h-[56px] flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-medium text-sm"
          >
            + New Visit
          </Link>
        </CardContent>
      </Card>

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

      {/* Loyalty card */}
      <LoyaltySection patient={patient} />

      {/* Braces status */}
      <BracesSection patient={patient} />

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
    </div>
  )
}
